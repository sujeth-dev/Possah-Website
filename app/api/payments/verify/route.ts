import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay'

const schema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  order_number: z.string().min(1),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Missing payment fields.' }, { status: 400 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number } = parsed.data
  const secret = process.env.RAZORPAY_KEY_SECRET

  if (!secret) {
    console.error('[payments/verify] RAZORPAY_KEY_SECRET not set')
    return NextResponse.json({ success: false, message: 'Payment configuration error.' }, { status: 500 })
  }

  // HMAC signature verification — NEVER trust client-side
  const isValid = verifyRazorpayPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    secret,
  })

  if (!isValid) {
    console.error('[payments/verify] Signature mismatch for order:', order_number)
    return NextResponse.json(
      { success: false, message: 'Payment verification failed. Please contact support.' },
      { status: 400 }
    )
  }

  try {
    const supabase = createServerClient()

    // Update order: mark paid, store gateway refs
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        gateway_payment_id: razorpay_payment_id,
        gateway_order_id: razorpay_order_id,
      })
      .eq('order_number', order_number)
      .eq('payment_status', 'pending') // idempotent: don't overwrite already-paid

    if (error) {
      console.error('[payments/verify] DB update error:', error)
      // Still return success to client — payment IS valid, DB update is best-effort
      // Webhook will catch this if it failed
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[payments/verify] Unexpected error:', err)
    return NextResponse.json({ success: false, message: 'Database error. Payment is recorded with Razorpay.' }, { status: 500 })
  }
}
