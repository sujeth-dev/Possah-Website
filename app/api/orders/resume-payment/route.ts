import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'

const schema = z.object({
  order_number: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: 'dev@thepossah.com', name: 'Dev User' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'order_number is required.' }, { status: 400 })
  }

  const { order_number } = parsed.data

  try {
    const supabase = createServerClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total, payment_status, customer_name, customer_phone')
      .eq('order_number', order_number)
      .eq('customer_email', session.user.email)
      .single()

    if (error || !order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { message: 'This order has already been paid or is no longer payable.' },
        { status: 409 },
      )
    }

    const totalPaise = Math.round(order.total * 100)

    let rzOrder: { id: string; amount: number; currency: string }
    try {
      rzOrder = await createRazorpayOrder({
        amount: totalPaise,
        currency: 'INR',
        receipt: order.order_number,
      })
    } catch (rzErr) {
      console.error('[orders/resume-payment] Razorpay order creation failed:', rzErr)
      return NextResponse.json(
        { message: 'Payment gateway error. Please try again.' },
        { status: 502 },
      )
    }

    // Update gateway_order_id with the fresh Razorpay order
    await supabase
      .from('orders')
      .update({ gateway_order_id: rzOrder.id })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      razorpay_order_id: rzOrder.id,
      amount: totalPaise,
      order_id: order.id,
      order_number: order.order_number,
      customer_name: order.customer_name ?? session.user.name ?? '',
      customer_email: session.user.email,
      customer_phone: order.customer_phone ?? '',
    })
  } catch (err) {
    console.error('[orders/resume-payment] Unexpected error:', err)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
