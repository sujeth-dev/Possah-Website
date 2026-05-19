import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)

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
        <td style="padding: 12px 0; border-bottom: 1px solid #E2D9CC;">
          <strong style="color: #1A1A1A;">${item.name}</strong><br>
          <span style="color: #6B6B6B; font-size: 13px;">${item.colour} · ${item.size} · Qty ${item.qty}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E2D9CC; text-align: right; color: #1A1A1A;">
          ${formatPrice(item.price * item.qty)}
        </td>
      </tr>
    `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F4ECDF;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4ECDF;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#F4ECDF;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1F3A2D;margin:0;letter-spacing:0.1em;">
                THE POSSAH
              </h1>
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#6B6B6B;margin:4px 0 0;">
                HAUTE COUTURE
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="border-top:1px solid #E2D9CC;padding-bottom:32px;"></td>
          </tr>

          <!-- Thank you message -->
          <tr>
            <td style="padding-bottom:24px;">
              <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1A1A1A;margin:0 0 8px;">
                Thank you, ${customerName}.
              </h2>
              <p style="color:#6B6B6B;font-size:15px;line-height:1.6;margin:0;">
                Your order has been placed. We're already preparing something beautiful for you.
              </p>
            </td>
          </tr>

          <!-- Order number -->
          <tr>
            <td style="background-color:#1F3A2D;padding:16px 24px;margin-bottom:24px;display:block;">
              <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C99A99;">
                ORDER NUMBER
              </span><br>
              <span style="font-size:20px;font-weight:500;color:#F4ECDF;letter-spacing:0.05em;">
                #${orderNumber}
              </span>
            </td>
          </tr>

          <tr><td style="height:24px;"></td></tr>

          <!-- Order items -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;padding-bottom:8px;border-bottom:1px solid #E2D9CC;">
                      PIECE
                    </th>
                    <th style="text-align:right;font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6B6B6B;padding-bottom:8px;border-bottom:1px solid #E2D9CC;">
                      AMOUNT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <tr><td style="height:16px;"></td></tr>

          <!-- Order summary -->
          <tr>
            <td style="background-color:rgba(31,58,45,0.05);padding:16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#6B6B6B;font-size:14px;padding-bottom:8px;">Subtotal</td>
                  <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${formatPrice(subtotal)}</td>
                </tr>
                <tr>
                  <td style="color:#6B6B6B;font-size:14px;padding-bottom:8px;">Shipping</td>
                  <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:8px;">${shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</td>
                </tr>
                ${discountAmount > 0 ? `
                <tr>
                  <td style="color:#27AE60;font-size:14px;padding-bottom:8px;">Discount</td>
                  <td style="text-align:right;color:#27AE60;font-size:14px;padding-bottom:8px;">−${formatPrice(discountAmount)}</td>
                </tr>` : ''}
                <tr>
                  <td style="color:#6B6B6B;font-size:14px;padding-bottom:12px;">Tax (GST)</td>
                  <td style="text-align:right;color:#1A1A1A;font-size:14px;padding-bottom:12px;">${formatPrice(tax)}</td>
                </tr>
                <tr style="border-top:1px solid #E2D9CC;">
                  <td style="padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">Total</td>
                  <td style="text-align:right;padding-top:12px;font-weight:600;font-size:16px;color:#1A1A1A;">${formatPrice(total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:24px;"></td></tr>

          <!-- Estimated delivery -->
          <tr>
            <td>
              <p style="color:#6B6B6B;font-size:14px;margin:0 0 4px;">Estimated Delivery</p>
              <p style="color:#1F3A2D;font-size:15px;font-weight:500;margin:0;">${estimatedDelivery}</p>
            </td>
          </tr>

          <tr><td style="height:32px;"></td></tr>

          <!-- Packaging callout -->
          <tr>
            <td style="border-left:2px solid #C8973A;padding-left:16px;">
              <p style="color:#1A1A1A;font-size:14px;font-style:italic;line-height:1.6;margin:0;">
                "Every Possah piece arrives in our signature packaging — because beautiful things deserve a beautiful arrival."
              </p>
              <p style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6B6B6B;margin:8px 0 0;">
                — The Possah Maker
              </p>
            </td>
          </tr>

          <tr><td style="height:32px;"></td></tr>

          <!-- CTA -->
          <tr>
            <td align="center">
              <a href="https://thepossah.com/account" style="display:inline-block;background-color:#1F3A2D;color:#F4ECDF;text-decoration:none;padding:14px 32px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">
                Track Your Order
              </a>
            </td>
          </tr>

          <tr><td style="height:48px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #E2D9CC;padding-top:24px;text-align:center;">
              <p style="color:#6B6B6B;font-size:12px;margin:0 0 8px;">
                The Possah Atelier · 14 Hanenganj Lane, Lucknow 226001, Uttar Pradesh, India
              </p>
              <p style="color:#6B6B6B;font-size:12px;margin:0;">
                <a href="https://thepossah.com" style="color:#1F3A2D;text-decoration:none;">thepossah.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@thepossah.com" style="color:#1F3A2D;text-decoration:none;">hello@thepossah.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const { error } = await resend.emails.send({
    from: 'The Possah <orders@thepossah.com>',
    to,
    subject: `Your order is confirmed — #${orderNumber}`,
    html,
  })

  if (error) {
    // Log but don't throw — email failure should not block order flow
    console.error('[Resend] Failed to send order confirmation:', error)
  }
}
