# Possah 1.0 — Plan 03: Payment & Full eCommerce Completion

**Type:** eCommerce Operations & Payment Engineering Plan  
**Scope:** Everything needed to run a complete, legally compliant, operationally sound online store in India  
**Stack:** Razorpay (Indian payment gateway) · Supabase · Resend · Next.js 14  
**Last Updated:** May 2026

---

## Current Payment State

What works:
- Razorpay order creation via `/api/orders/create` (server-side, with real price validation)
- Razorpay payment modal loads in checkout
- Webhook handler on `/api/payments/webhook` updates order status to `paid` after `payment.captured`
- Stock decremented atomically via `decrement_variant_stock` RPC after confirmed payment
- Order confirmation email sent via Resend
- Order number generated and stored

What does NOT work:
- No live mode ever tested with real money
- No `payment.failed` handling in the webhook (orders stay `pending` forever on failure)
- No refund API — refunds are manual via Razorpay dashboard
- No GST calculation — all orders have `tax = 0`
- No cart → DB persistence (stock can be over-reserved by concurrent users)
- No customer-facing payment failure recovery UX
- No Indian shipping logistics integration
- No invoice generation
- No COD (Cash on Delivery) support
- No UPI Intent / QR code flow (high conversion for Indian customers)
- No EMI options surfaced to customers

---

## Part 1: Immediate Payment Fixes

### P1.1 — Handle `payment.failed` in Webhook

**File:** `app/api/payments/webhook/route.ts`

Currently the `payment.captured` case is handled. `payment.failed` is ignored. When a customer's payment fails, the order stays in `payment_status: 'pending'` indefinitely, stock is never released, and the customer sees nothing.

**Fix:**

```ts
case 'payment.failed': {
  const paymentId = event.payload.payment.entity.id
  const razorpayOrderId = event.payload.payment.entity.order_id
  const errorCode = event.payload.payment.entity.error_code
  const errorDescription = event.payload.payment.entity.error_description

  await supabase
    .from('orders')
    .update({
      payment_status: 'failed',
      razorpay_payment_id: paymentId,
      notes: `Payment failed: ${errorCode} — ${errorDescription}`,
    })
    .eq('razorpay_order_id', razorpayOrderId)

  // Send payment failure email to customer
  const { data: order } = await supabase
    .from('orders')
    .select('*, user_email:shipping_address->email')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (order?.shipping_address?.email) {
    await sendPaymentFailureEmail({
      to: order.shipping_address.email,
      orderNumber: order.order_number,
      errorMessage: errorDescription,
      retryUrl: `https://thepossah.com/checkout`,
    })
  }

  break
}
```

The customer must receive a payment failure email with a link back to checkout. The cart should still be populated (localStorage persists it). Do not delete the `pending` order — it's a useful record for abandonment analysis.

---

### P1.2 — Payment Failure UX in CheckoutForm

**File:** `app/(shop)/checkout/CheckoutForm.tsx`

After `handler.on('payment.failed', ...)` fires in the Razorpay modal callback, the current behavior is unknown — likely nothing visible happens.

**Fix:**

```ts
handler.on('payment.failed', function (response) {
  const errorCode = response.error.code
  const errorDescription = response.error.description
  const errorSource = response.error.source  // 'customer' | 'business' | 'bank'

  let userMessage = 'Your payment could not be processed.'

  if (errorSource === 'customer') {
    userMessage = 'Payment declined. Please check your card details or try a different payment method.'
  } else if (errorCode === 'BAD_REQUEST_ERROR') {
    userMessage = 'Payment failed due to a technical issue. Please try again.'
  } else {
    userMessage = 'Payment failed. Please try again or use a different payment method.'
  }

  setPaymentError(userMessage)
  setIsLoading(false)
  // Do NOT clear cart — customer should be able to retry
})
```

Show `paymentError` as a visible error banner above the "Pay Now" button. Do not auto-dismiss.

---

### P1.3 — Payment Retry Flow

After payment failure, the customer must be able to retry without re-filling the entire form. The cart is preserved in localStorage. The existing `pending` order in DB should be reused or a new Razorpay order created for the retry.

**Fix:**

In `/api/orders/create`, if a `pending` order with the same cart (same user + same items) already exists within the last 30 minutes, return the existing `razorpay_order_id` instead of creating a new Razorpay order. This prevents duplicate order records for a single checkout attempt.

```ts
// Before creating a new order, check for an existing pending one
const { data: existingOrder } = await supabase
  .from('orders')
  .select('id, razorpay_order_id, order_number')
  .eq('user_id', userId)
  .eq('payment_status', 'pending')
  .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

if (existingOrder?.razorpay_order_id) {
  // Return existing Razorpay order for retry
  return NextResponse.json({
    razorpay_order_id: existingOrder.razorpay_order_id,
    order_number: existingOrder.order_number,
    amount: calculatedTotal,
    is_retry: true,
  })
}
```

---

### P1.4 — Razorpay Live Mode Validation

Before any real customer traffic:

1. Set `RAZORPAY_KEY_ID=rzp_live_...` and `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...` in production env
2. Complete a real test transaction (see `PLAN_02_DEPLOYMENT.md` Section C.7)
3. Verify in Razorpay live dashboard:
   - Payment appears under "Payments"
   - Settlement is scheduled (Razorpay settles T+2 for most accounts)
4. Verify in Supabase:
   - `orders.payment_status = 'paid'`
   - `orders.razorpay_payment_id` is populated
   - `product_variants.stock_qty` decremented
5. Initiate a refund from Razorpay dashboard and verify the order status can be manually updated to `refunded`

---

### P1.5 — Webhook Idempotency

The `payment.captured` webhook can be replayed by Razorpay (they retry on non-200 responses). Currently the webhook updates `payment_status = 'paid'` and decrements stock on every call — a duplicate webhook means double-decrement.

**Fix:**

```ts
case 'payment.captured': {
  // Check if already processed
  const { data: order } = await supabase
    .from('orders')
    .select('payment_status, id, line_items')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Idempotency: if already paid, return 200 without re-processing
  if (order.payment_status === 'paid') {
    logger.info({ razorpayOrderId }, 'webhook.duplicate - already processed')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // ... proceed with update and stock decrement
}
```

---

## Part 2: GST Compliance

GST registration is required to collect GST from customers. This section covers both the pre-registration and post-registration states.

### P2.1 — Pre-Registration (Current State)

While not GST registered:
- Do NOT collect GST from customers (correct — currently tax = 0)
- Do NOT display "Inclusive of all taxes" unless true
- Display pricing as "MRP" or just the price — no tax breakdown

**Action:** Update all price display components to NOT say "inclusive of GST" or any tax-related language until registration is obtained.

---

### P2.2 — Post-Registration: GST Implementation

When GST registration is obtained, implement in this order:

**Step 1 — Product schema update**

```sql
-- Migration: 022_gst_fields.sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 12
  CHECK (gst_rate IN (0, 5, 12, 18, 28));
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;

-- HSN codes for Indian fashion:
-- Sarees (silk, cotton): HSN 5007 / 5208 / 5211 — 5% GST if price <= ₹1000, 12% if price > ₹1000
-- Lehengas, salwar suits: HSN 6211 — 5% if <= ₹1000, 12% if > ₹1000
-- Jewellery (non-precious): HSN 7117 — 3% GST
-- Ready-made garments > ₹1000: 12% GST
```

**Step 2 — Server-side GST calculation in `/api/orders/create`**

```ts
// After fetching real prices from DB
const lineItemsWithGST = variants.map((v, i) => {
  const price = v.price * items[i].qty
  const gstRate = v.products.gst_rate / 100
  const gstAmount = Math.round(price * gstRate)
  return {
    variant_id: v.id,
    product_name: v.products.name,
    hsn_code: v.products.hsn_code,
    qty: items[i].qty,
    unit_price: v.price,
    total_price: price,
    gst_rate: v.products.gst_rate,
    gst_amount: gstAmount,
    cgst_amount: Math.round(gstAmount / 2),  // 50% CGST (intrastate)
    sgst_amount: Math.round(gstAmount / 2),  // 50% SGST (intrastate)
    // or IGST = full gstAmount for interstate orders
  }
})

const totalGST = lineItemsWithGST.reduce((sum, item) => sum + item.gst_amount, 0)
```

**Step 3 — GST breakdown in checkout UI**

Show in `CheckoutForm.tsx` order summary:
```
Subtotal (excl. GST):  ₹8,928
CGST (6%):             ₹536
SGST (6%):             ₹536
Shipping:              ₹200
Total:                 ₹10,200
```

For interstate orders (customer's state ≠ business's registered state), replace CGST + SGST with IGST (same total amount, different breakdown).

**Step 4 — GST-compliant invoice**

Every paid order must generate a GST invoice with:
- Seller GSTIN
- Invoice number (sequential, prefix: FY-YYYY-YYYY/POS/XXXXX)
- Invoice date
- Customer name and shipping address
- Customer GSTIN (optional, for B2B)
- HSN code per line item
- Quantity, unit price, taxable value, GST rate, GST amount, CGST, SGST/IGST
- Total taxable value, total GST, grand total

Generate as a PDF via `pdf-lib` or a Resend HTML-to-PDF approach. Attach to the order confirmation email.

---

## Part 3: Shipping & Fulfillment

### P3.1 — Phase 1: Manual Fulfillment (Go-Live)

At launch, fulfillment is 100% manual. The workflow:

1. Admin receives order notification email (see `PLAN_01_DEVELOPMENT_COMPLETION.md` S1.6)
2. Admin opens `/admin/orders`, finds the new order
3. Packs the order
4. Ships via preferred courier (Delhivery, Bluedart, DTDC, India Post, etc.)
5. Admin enters `tracking_number` and `courier` in `/admin/orders/[id]`
6. Customer sees tracking info on `/account/orders`

**Ship-to-all India:** The shipping cost currently in `CheckoutForm.tsx` is hardcoded. For phase 1, this is acceptable. Flat-rate shipping per order size:
- Orders < ₹1000: ₹150 shipping
- Orders ₹1000–₹4999: ₹99 shipping
- Orders ≥ ₹5000: Free

Store these thresholds in `store_settings` table so they can be changed from `/admin/settings` without a code deploy.

---

### P3.2 — Phase 2: Shiprocket Integration

Shiprocket is the de facto standard for Indian ecommerce shipping aggregation (integrates 30+ couriers, auto-picks cheapest/fastest rate).

**API integration — `/api/admin/orders/[id]/ship`:**

```ts
// 1. Create Shiprocket order
const shiprocketOrder = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${shiprocketToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    order_id: order.order_number,
    order_date: order.created_at,
    pickup_location: 'Primary',  // configured in Shiprocket
    channel_id: '',  // blank for custom
    billing_customer_name: order.shipping_address.fullName,
    billing_address: order.shipping_address.address,
    billing_city: order.shipping_address.city,
    billing_pincode: order.shipping_address.pincode,
    billing_state: order.shipping_address.state,
    billing_country: 'India',
    billing_email: order.shipping_address.email,
    billing_phone: order.shipping_address.phone,
    shipping_is_billing: true,
    order_items: order.line_items.map(item => ({
      name: item.product_name,
      sku: item.variant_id,
      units: item.qty,
      selling_price: item.unit_price / 100,  // Shiprocket uses rupees, not paise
      discount: 0,
      tax: item.gst_amount / 100,
      hsn: item.hsn_code,
    })),
    payment_method: 'Prepaid',
    total_discount: order.discount / 100,
    sub_total: order.subtotal / 100,
    length: 30,  // cm — typical for clothing
    breadth: 20,
    height: 10,
    weight: 0.5,  // kg — typical for single garment
  }),
})

const { order_id: shiprocketOrderId, awb_code, courier_name } = await shiprocketOrder.json()

// 2. Update Possah order with AWB
await supabase.from('orders').update({
  tracking_number: awb_code,
  courier: courier_name,
  fulfillment_status: 'shipped',
  shipped_at: new Date().toISOString(),
}).eq('id', order.id)

// 3. Email customer
await sendShippingConfirmationEmail({
  to: order.shipping_address.email,
  orderNumber: order.order_number,
  trackingNumber: awb_code,
  courierName: courier_name,
  trackingUrl: `https://shiprocket.co/tracking/${awb_code}`,
})
```

**Shiprocket webhook for delivery updates:**

Create `app/api/webhooks/shiprocket/route.ts`. When Shiprocket fires a `delivered` event, update `orders.fulfillment_status = 'delivered'` and send a delivery confirmation + review request email.

---

### P3.3 — Returns and Refunds

**Return Request Flow (Customer-facing):**

1. Customer goes to `/account/orders/[id]`
2. If `fulfillment_status = 'delivered'` and within return window (e.g. 7 days of delivery): show "Request Return" button
3. Customer selects reason from dropdown: "Wrong size", "Damaged", "Not as described", "Changed mind", "Quality issue"
4. Return request created in DB with `return_status = 'requested'`
5. Admin notification email sent

**Return Management (Admin):**

In `/admin/orders/[id]`:
1. Admin sees return request with reason and customer details
2. Admin can: Approve (change `return_status = 'approved'`) or Reject (with reason)
3. On approval: Admin arranges return pickup (Shiprocket Reverse Pickup API if using Shiprocket) or emails customer return instructions
4. When item received: Admin updates `return_status = 'received'`
5. Admin initiates Razorpay refund

**Razorpay Refund API:**

```ts
// app/api/admin/orders/[id]/refund/route.ts
const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
  amount: refundAmountPaise,  // partial or full
  speed: 'normal',  // 5-7 days to customer. 'optimum' for instant but higher cost
  notes: { reason: returnReason, order_number: order.order_number },
})

await supabase.from('orders').update({
  return_status: 'refunded',
  refund_amount: refundAmountPaise,
  refund_razorpay_id: refund.id,
  refunded_at: new Date().toISOString(),
}).eq('id', orderId)

// Email customer
await sendRefundEmail({
  to: order.shipping_address.email,
  orderNumber: order.order_number,
  refundAmount: refundAmountPaise / 100,
  refundId: refund.id,
  estimatedDays: 5,
})
```

---

## Part 4: UPI and Indian Payment Methods

Razorpay's standard checkout modal handles UPI, Net Banking, Cards, and Wallets automatically. However, there are optimizations specific to the Indian market.

### P4.1 — UPI Intent (Mobile)

On mobile devices, Razorpay should open UPI apps directly (GPay, PhonePe, Paytm) via intent links instead of requiring customers to type their UPI ID. This increases mobile conversion significantly.

In `CheckoutForm.tsx` `initRazorpay`:

```ts
const options = {
  // ... existing options
  config: {
    display: {
      blocks: {
        utib: {
          name: 'Pay via UPI',
          instruments: [
            { method: 'upi', flows: ['intent', 'qr', 'collect'] },
          ],
        },
        other: {
          name: 'Other Payment Modes',
          instruments: [
            { method: 'card' },
            { method: 'netbanking' },
            { method: 'wallet' },
          ],
        },
      },
      sequence: ['block.utib', 'block.other'],
      preferences: { show_default_blocks: false },
    },
  },
}
```

---

### P4.2 — Payment Method Preference Tracking

When an order is paid, store the payment method used in the order record:

```ts
// In payment verify route or webhook
const paymentMethod = event.payload.payment.entity.method  // 'upi', 'card', 'netbanking', 'wallet'
await supabase.from('orders').update({ payment_method: paymentMethod }).eq('razorpay_payment_id', paymentId)
```

Add `payment_method TEXT` column to orders in a migration. Surface in `/admin/reports` — knowing that 70% of customers pay via UPI informs future A/B tests.

---

### P4.3 — EMI Options

Razorpay surfaces EMI options automatically for eligible cards. No code change needed, but configure in Razorpay dashboard → Settings → EMI:
- Enable No Cost EMI for supported banks
- Set minimum order value for EMI: ₹5000 (reasonable for luxury fashion)

---

## Part 5: Inventory Management

### P5.1 — Stock Alert Notifications

When a variant's stock drops to 2 or below (or hits 0), admin must be notified.

**Implementation via Supabase Database Webhook:**

1. In Supabase dashboard → Database → Webhooks
2. Create webhook: "stock-low-alert"
3. Table: `product_variants`
4. Events: `UPDATE`
5. URL: `https://thepossah.com/api/webhooks/stock-alert`
6. HTTP method: POST

Create `app/api/webhooks/stock-alert/route.ts`:

```ts
export async function POST(req: Request) {
  const payload = await req.json()
  const { record } = payload

  if (record.stock_qty <= 0) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `OUT OF STOCK: ${record.product_name} — Size ${record.size}`,
      text: `Variant ${record.id} is now out of stock. Update stock or mark inactive.`,
    })
  } else if (record.stock_qty <= 2) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: `LOW STOCK: ${record.product_name} — Size ${record.size} (${record.stock_qty} remaining)`,
      text: `Only ${record.stock_qty} units left. Restock or prepare to mark out of stock.`,
    })
  }

  return NextResponse.json({ ok: true })
}
```

---

### P5.2 — Bulk Stock Update

Currently stock can only be updated one variant at a time via the product edit form. For restocking events (new shipment arrives), the admin needs to update 20–50 variants at once.

**Fix:** Add `app/api/admin/products/bulk-stock/route.ts` accepting:

```json
{
  "updates": [
    { "variant_id": "uuid", "stock_qty": 15 },
    { "variant_id": "uuid", "stock_qty": 0 }
  ]
}
```

And a corresponding bulk stock update UI in `/admin/products` — a CSV upload button or a table where stock quantities can be edited inline and saved in one click.

---

### P5.3 — Pre-Order / Back-Order Support (Phase 4)

For made-to-measure and high-demand products that sell out, add `allow_backorder` boolean to `product_variants`. When `stock_qty = 0` and `allow_backorder = true`:
- Customer can still add to cart and order
- Product info shows "Pre-order — Ships in 4–6 weeks" (text configurable from `store_settings`)
- Order is created with `fulfillment_status = 'preorder'`
- Admin is notified with pre-order count to manage production queue

---

## Part 6: Email Flows

A complete post-purchase email sequence is required for professional ecommerce operations. All emails via Resend using React Email templates.

### P6.1 — Order Confirmation (Exists — Verify)

Verify existing order confirmation email:
- Fires within 60 seconds of `payment.captured`
- Contains: order number, items with images, quantities, prices, shipping address, expected delivery window
- Contains: "Track your order" link to `/account/orders`
- Responsive design works on mobile

---

### P6.2 — Payment Failure Email (New — P1.1 above)

Fires on `payment.failed` webhook. Contains:
- "Your payment for order [X] could not be processed"
- Error reason in plain language
- "Try again" button → links to `/checkout` (cart still has their items)
- "Need help?" link to `/contact`

---

### P6.3 — Shipping Confirmation Email

Fires when admin sets `fulfillment_status = 'shipped'` (or via Shiprocket webhook).

Contains:
- Order number and items
- Courier name and tracking number
- Tracking link (courier's tracking URL)
- Estimated delivery date (if available from courier API)

---

### P6.4 — Delivery Confirmation + Review Request Email

Fires when `fulfillment_status = 'delivered'` (via Shiprocket webhook or manual admin update).

Contents:
- "Your order has been delivered!"
- Items ordered (with images)
- "We'd love your feedback" — link to leave a review
- Review link format: `https://thepossah.com/shop/[category]/[slug]?review=true`

The `?review=true` query param opens the reviews section and pre-scrolls to the "Write a Review" form.

---

### P6.5 — Welcome Email (New User)

Fires when a user signs in with Google for the first time (detect via NextAuth `signIn` event — check if user was just created).

```ts
// lib/auth.ts — in signIn event
events: {
  async signIn({ user, isNewUser }) {
    if (isNewUser) {
      await sendWelcomeEmail({
        to: user.email!,
        name: user.name?.split(' ')[0] ?? 'there',
      })
    }
  }
}
```

Welcome email contents:
- "Welcome to The Possah"
- Brand story (2 sentences)
- "Explore our collections" CTA
- "Complete your profile" CTA → links to `/account` (where measurements can be saved)

---

### P6.6 — Abandoned Cart Recovery Email (Phase 4)

For logged-in users whose cart has items and who haven't checked out after 2 hours:

1. Supabase scheduled function (via `pg_cron`) or Vercel Cron Job: runs every hour
2. Queries `orders` with `payment_status = 'pending'` older than 2 hours, user_id is not null
3. Sends a single recovery email (one per order, never more than once)

```ts
// app/api/cron/abandoned-carts/route.ts
export const runtime = 'edge'
export const maxDuration = 30

export async function GET(req: Request) {
  // Verify this is a legitimate Vercel cron request
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

  const { data: abandonedOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_status', 'pending')
    .lt('created_at', twoHoursAgo)
    .eq('recovery_email_sent', false)  // add this column
    .not('user_id', 'is', null)
    .limit(50)

  for (const order of abandonedOrders ?? []) {
    await sendAbandonedCartEmail(order)
    await supabase.from('orders').update({ recovery_email_sent: true }).eq('id', order.id)
  }

  return NextResponse.json({ processed: abandonedOrders?.length ?? 0 })
}
```

Configure in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/abandoned-carts", "schedule": "0 * * * *" }
  ]
}
```

---

## Part 7: Full eCommerce Completion Roadmap

This is the sequence from current state to a fully operational, legally sound Indian ecommerce store.

### Immediate (before first real customer — Weeks 1–2)

| Task | File/Area | Effort |
|---|---|---|
| Fix `payment.failed` webhook handler | `app/api/payments/webhook/route.ts` | 2h |
| Payment failure UX in CheckoutForm | `CheckoutForm.tsx` | 2h |
| Webhook idempotency guard | `app/api/payments/webhook/route.ts` | 1h |
| Manual fulfillment workflow (admin email on payment) | `webhook/route.ts` + email template | 3h |
| Customer order tracking page | `account/orders/page.tsx` | 2h |
| Stock alert webhook | `api/webhooks/stock-alert/route.ts` | 2h |
| Seed 10–20 real products via admin panel | `/admin/products` | Admin work |
| First production transaction test | Manual | 1h |
| Uptime monitoring setup | UptimeRobot | 30m |

---

### Month 1 (First 30 days of operation)

| Task | Priority |
|---|---|
| Shipping confirmation email template | High |
| Delivery confirmation + review request email | High |
| Welcome email for new users | Medium |
| Shiprocket integration for label printing | High |
| Return request form for customers | Medium |
| Razorpay refund API in admin | Medium |
| Bulk stock update UI | Medium |
| Revenue reports dashboard (`/admin/reports`) | Medium |
| Customer lookup in admin (`/admin/customers`) | Low |

---

### Month 2–3 (After first 100 orders)

| Task | Priority |
|---|---|
| GST registration → GST calculation implementation | When registered |
| GST-compliant invoice generation | When registered |
| Abandoned cart recovery email cron | High |
| Cart → DB sync for logged-in users | High |
| Full-text search (tsvector migration) | Medium |
| Admin audit log | Medium |
| A/B test UPI Intent vs standard modal (track conversion) | Medium |
| Pre-order / back-order support | Low |

---

### Phase 5 (Post-100 orders, post-product-market-fit)

| Task | Priority |
|---|---|
| Klaviyo/Mailchimp CRM integration | When marketing budget allocated |
| Meta Pixel + GTM for paid ads | When running ads |
| Made-to-measure full measurement→order flow | When demand confirmed |
| Newsletter signup + email sequence automation | High |
| Referral program | Low |
| Multi-currency (USD for international customers) | When international shipping offered |
| WhatsApp notifications via Twilio/Gupshup | High (India-specific) |
| Gift cards and gift registry | Low |

---

## Razorpay Account Requirements Checklist

Before going live with Razorpay in live mode:

- [ ] Business entity verified (Proprietorship / LLP / Pvt Ltd)
- [ ] PAN card verified
- [ ] Bank account verified (test ₹1 credit from Razorpay)
- [ ] Business category set to "Fashion & Lifestyle"
- [ ] Settlement cycle confirmed (T+2 by default; T+1 available at higher volume)
- [ ] Razorpay dashboard has your correct bank account for settlements
- [ ] Webhook URL added and secret configured for production
- [ ] `rzp_live_` key ID and secret copied into production env vars
- [ ] Test payment completed in live mode and settled correctly
- [ ] Dispute resolution process understood (Razorpay handles card chargebacks on your behalf)

---

## Payment Compliance Checklist

- [ ] Privacy Policy mentions data collected at checkout (name, address, email, phone)
- [ ] Privacy Policy mentions payment processing via Razorpay
- [ ] Terms & Conditions include return/refund policy (14-day window, original condition)
- [ ] Terms & Conditions include cancellation policy (before dispatch: full refund; after dispatch: return policy applies)
- [ ] Razorpay checkout is in INR only
- [ ] No card data is ever stored on your servers (Razorpay handles tokenization — verify this is true, do not add any custom card capture)
- [ ] SSL certificate is active (HTTPS on all pages — verify in browser padlock)
- [ ] Payment receipt issued for every order (order confirmation email serves as receipt until GST invoice is in place)

---

## Post-Launch Monitoring

### Daily (Admin responsibility)

- Check `/admin/orders` for new orders
- Fulfill any unpacked orders
- Check for new return requests
- Check stock levels on fast-moving variants

### Weekly

- Review Sentry for any new error patterns
- Check UptimeRobot history — any downtime?
- Review GA4 checkout funnel — where are users dropping off?
- Check Razorpay dashboard for settlement status
- Run smoke test (15 minutes)

### Monthly

- Review admin audit log for any unusual activity
- Review Razorpay dispute/chargeback history
- Verify Supabase backup restored successfully (test restore)
- Review `/admin/reports` revenue and AOV trends
- Check GST liability if registered
