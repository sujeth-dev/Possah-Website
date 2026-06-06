import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils'

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY)
}

// --- Shared HTML wrapper ---

function emailWrapper(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F4ECDF;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4ECDF;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#F4ECDF;">
        <tr><td align="center" style="padding-bottom:32px;">
          <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1F3A2D;margin:0;letter-spacing:0.1em;">THE POSSAH</h1>
          <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#6B6B6B;margin:4px 0 0;">HAUTE COUTURE</p>
        </td></tr>
        <tr><td style="border-top:1px solid #E2D9CC;padding-bottom:32px;"></td></tr>
        ${body}
        <tr><td style="height:48px;"></td></tr>
        <tr><td style="border-top:1px solid #E2D9CC;padding-top:24px;text-align:center;">
          <p style="color:#6B6B6B;font-size:12px;margin:0 0 8px;">The Possah Atelier &middot; 14 Hanenganj Lane, Lucknow 226001, Uttar Pradesh, India</p>
          <p style="color:#6B6B6B;font-size:12px;margin:0;">
            <a href="https://thepossah.com" style="color:#1F3A2D;text-decoration:none;">thepossah.com</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:hello@thepossah.com" style="color:#1F3A2D;text-decoration:none;">hello@thepossah.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

interface LineItem {
  name: string
  colour: string
  size: string
  qty: number
  price: number
}

interface OrderConfirmationEmailProps {
  to: string
  customerName: string
  orderNumber: string
  items: LineItem[]
  subtotal: number
  shippingFee: number
  discountAmount: number
  tax: number
  total: number
  estimatedDelivery: string
}

/** Send order confirmation email via Resend */
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  subtotal,
  shippingFee,
  discountAmount,
  tax,
  total,
  estimatedDelivery,
}: OrderConfirmationEmailProps): Promise<void> {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #E2D9CC;">
          <strong style="color:#1A1A1A;">${item.name}</strong><br>
          <span style="color:#6B6B6B;font-size:13px;">${item.colour} &middot; ${item.size} &middot; Qty ${item.qty}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #E2D9CC;text-align:right;color:#1A1A1A;">
          ${formatPrice(item.price * item.qty)}
        </td>
      </tr>`
    )
    .join('')

  const discountRow =
    discountAmount > 0
      ? `<tr>
          <td style="color:#27AE60;font-size:14px;padding-bottom:8px;">Discount</td>
          <td style="text-align:right;color:#27AE60;font-size:14px;padding-bottom:8px;">-${formatPrice(discountAmount)}</td>
        </tr>`
      : ''

  const body = `
    <tr><td>
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1A1A1A;margin:0 0 8px;">
        Thank you, ${customerName}.
      </h2>
      <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Your order has been placed. We are already preparing something beautiful for you.
      </p>
      <div style="background-color:#1F3A2D;padding:16px 24px;margin-bottom:24px;">
        <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C99A99;">ORDER NUMBER</span><br>
        <span style="font-size:20px;font-weight:500;color:#F4ECDF;letter-spacing:0.05em;">#${orderNumber}</span>
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
            <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${formatPrice(subtotal)}</td>
          </tr>
          <tr>
            <td style="color:#6B6B6B;font-size:14px;padding-bottom:8px;">Shipping</td>
            <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</td>
          </tr>
          ${discountRow}
          <tr>
            <td style="color:#6B6B6B;font-size:14px;padding-bottom:12px;">Tax (GST)</td>
            <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:12px;">${formatPrice(tax)}</td>
          </tr>
          <tr style="border-top:1px solid #E2D9CC;">
            <td style="padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">Total</td>
            <td style="text-align:right;padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">${formatPrice(total)}</td>
          </tr>
        </table>
      </div>
      <p style="color:#6B6B6B;font-size:14px;margin:0 0 4px;">Estimated Delivery</p>
      <p style="color:#1F3A2D;font-size:15px;font-weight:500;margin:0 0 24px;">${estimatedDelivery}</p>
      <div style="border-left:2px solid #C8973A;padding-left:16px;">
        <p style="color:#1A1A1A;font-size:14px;font-style:italic;line-height:1.6;margin:0;">
          "Every Possah piece arrives in our signature packaging - because the unboxing is part of the story."
        </p>
      </div>
    </td></tr>`

  await getResend().emails.send({
    from: 'The Possah <noreply@thepossah.com>',
    to,
    subject: `Order Confirmed: #${orderNumber} - The Possah`,
    html: emailWrapper(body),
  })
}

// --- FIX-PAY-02: Payment failure email ---

interface PaymentFailureEmailProps {
  to: string
  customerName: string
  orderNumber: string
  amount: number
}

export async function sendPaymentFailureEmail({
  to,
  customerName,
  orderNumber,
  amount,
}: PaymentFailureEmailProps): Promise<void> {
  const body = `
    <tr><td>
      <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1A1A1A;margin:0 0 12px;">
        Payment unsuccessful
      </h2>
      <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Hi ${customerName}, we were unable to process your payment of ${formatPrice(amount)} for order <strong>#${orderNumber}</strong>.
        No money has been deducted from your account.
      </p>
      <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Please try placing your order again. If the issue persists, contact us at
        <a href="mailto:hello@thepossah.com" style="color:#1F3A2D;">hello@thepossah.com</a>.
      </p>
      <a href="https://thepossah.com/shop"
         style="display:inline-block;background-color:#1F3A2D;color:#F4ECDF;padding:14px 28px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
        RETURN TO SHOP
      </a>
    </td></tr>`

  await getResend().emails.send({
    from: 'The Possah <noreply@thepossah.com>',
    to,
    subject: `Payment failed for order #${orderNumber} - The Possah`,
    html: emailWrapper(body),
  })
}

// --- FIX-PAY-03: Admin order notification ---

interface AdminOrderNotificationProps {
  to: string
  orderNumber: string
  customerName: string
  customerEmail: string
  items: LineItem[]
  total: number
  shippingAddress: Record<string, string> | string
}

export async function sendAdminOrderNotification({
  to,
  orderNumber,
  customerName,
  customerEmail,
  items,
  total,
  shippingAddress,
}: AdminOrderNotificationProps): Promise<void> {
  const itemsText = items
    .map((i) => `${i.name} (${i.colour}, ${i.size}) x${i.qty} = ${formatPrice(i.price * i.qty)}`)
    .join('\n')

  const addr =
    typeof shippingAddress === 'object'
      ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.state, shippingAddress.pincode]
          .filter(Boolean)
          .join(', ')
      : String(shippingAddress)

  const body = `
    <tr><td>
      <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#1A1A1A;margin:0 0 16px;">
        New Order: #${orderNumber}
      </h2>
      <p style="color:#1A1A1A;font-size:15px;margin:0 0 8px;"><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
      <p style="color:#1A1A1A;font-size:15px;margin:0 0 8px;"><strong>Total:</strong> ${formatPrice(total)}</p>
      <p style="color:#1A1A1A;font-size:15px;margin:0 0 8px;"><strong>Ship to:</strong> ${addr}</p>
      <pre style="background:#f5f5f5;padding:12px;font-size:13px;color:#333;white-space:pre-wrap;">${itemsText}</pre>
      <a href="https://thepossah.com/admin/orders"
         style="display:inline-block;background-color:#1F3A2D;color:#F4ECDF;padding:12px 24px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;margin-top:16px;">
        VIEW IN ADMIN
      </a>
    </td></tr>`

  await getResend().emails.send({
    from: 'Possah Orders <noreply@thepossah.com>',
    to,
    subject: `[POSSAH] New order #${orderNumber} - ${formatPrice(total)}`,
    html: emailWrapper(body),
  })
}
