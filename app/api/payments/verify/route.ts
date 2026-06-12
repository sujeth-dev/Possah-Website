import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayPaymentSignature } from '@/lib/razorpay'
import { sendOrderConfirmationIfNotSent } from '@/lib/send-order-emails'

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
    const supabase = createAdminClient()

    // Update order: mark paid, store gateway refs. Idempotent — only flips
    // pending → paid (paid stays paid; webhook is the safety net for that case).
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        gateway_payment_id: razorpay_payment_id,
        gateway_order_id: razorpay_order_id,
      })
      .eq('order_number', order_number)
      .eq('payment_status', 'pending')

    if (error) {
      console.error('[payments/verify] DB update error:', error)
      // Still return success to client — payment IS valid, DB update is
      // best-effort and the webhook will reconcile if it failed.
    }

    // Fire confirmation + admin emails exactly once (idempotent across
    // verify-callback + webhook). Best-effort — never fail verify on email
    // errors; the helper handles its own try/catch internally.
    void sendOrderConfirmationIfNotSent(supabase, order_number).catch((err) => {
      console.error('[payments/verify] email dispatch failed:', err)
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[payments/verify] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Database error. Payment is recorded with Razorpay.' },
      { status: 500 },
    )
  }
}
