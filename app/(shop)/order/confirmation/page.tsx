import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { OrderConfirmationView } from './OrderConfirmationView'

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: { index: false, follow: false },
}

export type ConfirmationLineItem = {
  product_id: string
  variant_id: string
  name: string
  image: string
  colour: string
  size: string
  qty: number
  price: number
}

export type ConfirmationAddress = {
  line1?: string
  line2?: string | null
  city?: string
  state?: string
  pincode?: string
}

export type ConfirmationOrder = {
  order_number: string
  customer_name: string
  customer_phone: string
  payment_status: string
  fulfillment_status: string
  subtotal: number
  shipping_fee: number
  discount_amount: number
  tax: number
  total: number
  coupon_code: string | null
  is_gift: boolean
  items: ConfirmationLineItem[]
  address: ConfirmationAddress
}

function coerceLineItems(raw: unknown): ConfirmationLineItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => ({
      product_id: String(it.product_id ?? ''),
      variant_id: String(it.variant_id ?? ''),
      name: String(it.name ?? ''),
      image: String(it.image ?? ''),
      colour: String(it.colour ?? ''),
      size: String(it.size ?? ''),
      qty: Number(it.qty ?? 0),
      price: Number(it.price ?? 0),
    }))
    .filter((it) => it.name)
}

function coerceAddress(raw: unknown): ConfirmationAddress {
  if (typeof raw !== 'object' || raw === null) return {}
  const o = raw as Record<string, unknown>
  return {
    line1: o.line1 != null ? String(o.line1) : undefined,
    line2: o.line2 != null ? String(o.line2) : null,
    city: o.city != null ? String(o.city) : undefined,
    state: o.state != null ? String(o.state) : undefined,
    pincode: o.pincode != null ? String(o.pincode) : undefined,
  }
}

async function fetchConfirmationOrder(orderNumber: string): Promise<ConfirmationOrder | null> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('orders')
      .select(
        'order_number, customer_name, customer_phone, payment_status, fulfillment_status, subtotal, shipping_fee, discount_amount, tax, total, coupon_code, is_gift, line_items, shipping_address',
      )
      .eq('order_number', orderNumber)
      .maybeSingle()
    if (!data) return null
    return {
      order_number: data.order_number,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      payment_status: data.payment_status,
      fulfillment_status: data.fulfillment_status,
      subtotal: data.subtotal,
      shipping_fee: data.shipping_fee,
      discount_amount: data.discount_amount,
      tax: data.tax,
      total: data.total,
      coupon_code: data.coupon_code,
      is_gift: data.is_gift,
      items: coerceLineItems(data.line_items),
      address: coerceAddress(data.shipping_address),
    }
  } catch {
    return null
  }
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string; payment?: string }
}) {
  const orderNumber = searchParams.order ?? null
  const paymentId = searchParams.payment ?? null
  const order = orderNumber ? await fetchConfirmationOrder(orderNumber) : null

  return <OrderConfirmationView order={order} orderNumber={orderNumber} paymentId={paymentId} />
}
