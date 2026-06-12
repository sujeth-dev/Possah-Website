import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST /api/admin/email-preview
// Sends a test order confirmation email to an override address.
// Does NOT set confirmation_email_sent_at on the real order.
// Tags the Resend send with { name: 'test', value: 'true' }.
export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json() as { orderId?: string; testEmail?: string }
    const { orderId, testEmail } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      return NextResponse.json({ error: 'Valid testEmail required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: order, error } = await supabase
      .from('orders')
      .select('order_number, customer_name, total, subtotal, shipping_fee, discount_amount, tax, line_items, internal_notes')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Build email HTML inline (same template as lib/email.ts — avoids coupling)
    const rawItems = Array.isArray(order.line_items) ? order.line_items as Record<string, unknown>[] : []
    const items = rawItems
      .filter((it) => typeof it === 'object' && it !== null && it.name)
      .map((it) => ({
        name:   String(it.name   ?? ''),
        colour: String(it.colour ?? ''),
        size:   String(it.size   ?? ''),
        qty:    Number(it.qty    ?? 0),
        price:  Number(it.unit_price ?? it.price ?? 0),
      }))
      .filter((it) => it.name && it.qty > 0)

    const formatPrice = (n: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

    const notes = typeof order.internal_notes === 'string' ? order.internal_notes : ''
    const estimatedDelivery = notes.toLowerCase().includes('express') ? '2–3 business days' : '5–7 business days'

    // Send via Resend directly so we can attach the test tag without modifying lib/email.ts
    const { error: sendError } = await resend.emails.send({
      from:    'The Possah <noreply@thepossah.com>',
      to:      testEmail,
      subject: `[TEST] Order Confirmed: #${order.order_number} - The Possah`,
      tags:    [{ name: 'test', value: 'true' }],
      html: buildConfirmationHtml({
        customerName:   order.customer_name,
        orderNumber:    order.order_number,
        items,
        subtotal:       order.subtotal,
        shippingFee:    order.shipping_fee,
        discountAmount: order.discount_amount,
        total:          order.total,
        estimatedDelivery,
        formatPrice,
      }),
    })

    if (sendError) {
      return NextResponse.json({ error: (sendError as Error).message }, { status: 500 })
    }

    return NextResponse.json({ sent: true, to: testEmail, orderNumber: order.order_number })
  } catch (err) {
    console.error('[email-preview] failed:', err)
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 })
  }
}

interface ConfirmationHtmlProps {
  customerName: string
  orderNumber: string
  items: { name: string; colour: string; size: string; qty: number; price: number }[]
  subtotal: number
  shippingFee: number
  discountAmount: number
  total: number
  estimatedDelivery: string
  formatPrice: (n: number) => string
}

function buildConfirmationHtml(p: ConfirmationHtmlProps): string {
  const itemsHtml = p.items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #E2D9CC;">
        <strong style="color:#1A1A1A;">${item.name}</strong><br>
        <span style="color:#6B6B6B;font-size:13px;">${item.colour} &middot; ${item.size} &middot; Qty ${item.qty}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #E2D9CC;text-align:right;color:#1A1A1A;">
        ${p.formatPrice(item.price * item.qty)}
      </td>
    </tr>`).join('')

  const discountRow = p.discountAmount > 0
    ? `<tr>
        <td style="color:#27AE60;font-size:14px;padding-bottom:8px;">Discount</td>
        <td style="text-align:right;color:#27AE60;font-size:14px;padding-bottom:8px;">-${p.formatPrice(p.discountAmount)}</td>
      </tr>` : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F4ECDF;font-family:Inter,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4ECDF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#F4ECDF;">
        <tr><td align="center" style="padding-bottom:8px;">
          <p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#DC2626;margin:0 0 16px;">[TEST EMAIL — NOT SENT TO CUSTOMER]</p>
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1F3A2D;margin:0;letter-spacing:0.1em;">THE POSSAH</h1>
          <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#6B6B6B;margin:4px 0 0;">HAUTE COUTURE</p>
        </td></tr>
        <tr><td style="border-top:1px solid #E2D9CC;padding-bottom:32px;"></td></tr>
        <tr><td>
          <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1A1A1A;margin:0 0 8px;">Thank you, ${p.customerName}.</h2>
          <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0 0 24px;">Your order has been placed. We are already preparing something beautiful for you.</p>
          <div style="background-color:#1F3A2D;padding:16px 24px;margin-bottom:24px;">
            <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C99A99;">ORDER NUMBER</span><br>
            <span style="font-size:20px;font-weight:500;color:#F4ECDF;letter-spacing:0.05em;">#${p.orderNumber}</span>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
            <thead>
              <tr>
                <th style="text-align:left;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;padding-bottom:8px;border-bottom:1px solid #E2D9CC;">PIECE</th>
                <th style="text-align:right;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;padding-bottom:8px;border-bottom:1px solid #E2D9CC;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="background-color:rgba(31,58,45,0.05);padding:16px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#6B6B6B;font-size:14px;padding-bottom:8px;">Subtotal</td>
                <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${p.formatPrice(p.subtotal)}</td>
              </tr>
              <tr>
                <td style="color:#6B6B6B;font-size:14px;padding-bottom:8px;">Shipping</td>
                <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${p.shippingFee === 0 ? 'Free' : p.formatPrice(p.shippingFee)}</td>
              </tr>
              ${discountRow}
              <tr style="border-top:1px solid #E2D9CC;">
                <td style="padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">Total</td>
                <td style="text-align:right;padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">${p.formatPrice(p.total)}</td>
              </tr>
            </table>
          </div>
          <p style="color:#6B6B6B;font-size:14px;margin:0 0 4px;">Estimated Delivery</p>
          <p style="color:#1F3A2D;font-size:15px;font-weight:500;margin:0 0 24px;">${p.estimatedDelivery}</p>
        </td></tr>
        <tr><td style="height:48px;"></td></tr>
        <tr><td style="border-top:1px solid #E2D9CC;padding-top:24px;text-align:center;">
          <p style="color:#6B6B6B;font-size:12px;margin:0;">The Possah Atelier &middot; Horamavu, Bengaluru, Karnataka 560113, India</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
