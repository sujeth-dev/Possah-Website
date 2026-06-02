# Razorpay Webhook Setup Guide

Webhooks are the **safety net** for payment confirmation. If the user's browser closes or network drops after payment, the webhook fires anyway — up to 3 days of retries with exponential backoff.

---

## 1. Generate Your Webhook Secret

```bash
# Generate a strong random secret (do this once, store it safely)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output. This becomes `RAZORPAY_WEBHOOK_SECRET`.

---

## 2. Register the Webhook in Razorpay Dashboard

### Test environment
1. Log in at https://dashboard.razorpay.com (test mode — toggle in top-left)
2. Go to **Settings → Webhooks → + Add New Webhook**
3. Fill in:

   | Field | Value |
   |-------|-------|
   | Webhook URL | `https://your-preview.vercel.app/api/payments/webhook` |
   | Secret | (paste the key from step 1) |
   | Active Events | ✅ `payment.captured` + ✅ `payment.failed` |

4. Click **Create Webhook**

### Production environment
Repeat step 2 with:
- Toggle dashboard to **Live mode**
- URL: `https://thepossah.com/api/payments/webhook`
- A **different** secret from the one used in test

---

## 3. Set Environment Variables

### Local development (`.env.local`)
```
RAZORPAY_WEBHOOK_SECRET=<your_test_secret_from_step_1>
```

### Vercel (for preview + production)
In Vercel dashboard → Your Project → Settings → Environment Variables:

| Name | Environment | Value |
|------|-------------|-------|
| `RAZORPAY_WEBHOOK_SECRET` | Preview | test secret |
| `RAZORPAY_WEBHOOK_SECRET` | Production | live secret (different value) |

> ⚠️ Never share these secrets or commit them to git. They allow anyone to forge webhook events.

---

## 4. Test Locally with ngrok

Razorpay cannot reach `localhost:3000` directly. Use ngrok to expose a tunnel:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

ngrok prints a URL like `https://abc123.ngrok-free.app`. Use that as your Webhook URL in Razorpay Dashboard (test mode), replacing `/api/payments/webhook` at the end.

**Full local test flow:**
1. Start dev server: `npm run dev`
2. Start ngrok in a second terminal: `ngrok http 3000`
3. Register `https://abc123.ngrok-free.app/api/payments/webhook` in Razorpay test dashboard
4. Make a test payment using Razorpay test card: `4111 1111 1111 1111`, CVV `111`, any future expiry
5. Watch your terminal for `[webhook] payment.captured` logs

---

## 5. Verify It Works

After a test payment, check:

```sql
-- In Supabase Dashboard → SQL Editor
SELECT order_number, payment_status, gateway_payment_id
FROM orders
WHERE payment_status = 'paid'
ORDER BY created_at DESC
LIMIT 5;
```

`payment_status` should be `'paid'` and `gateway_payment_id` should be set (e.g. `pay_xxxxx`).

---

## 6. Razorpay Test Cards

| Card number | Network | Result |
|-------------|---------|--------|
| `4111 1111 1111 1111` | Visa | Success |
| `5267 3181 8797 5449` | Mastercard | Success |
| `4000 0000 0000 0002` | Visa | Failure |

- OTP (if prompted): `1234` (test mode always accepts this)
- CVV: any 3 digits
- Expiry: any future date

---

## 7. Webhook Event Reference

The code (`app/api/payments/webhook/route.ts`) handles two events:

### `payment.captured`
Fires when Razorpay confirms payment received. The handler:
1. Finds the order by `gateway_order_id`
2. Skips if already `paid` (idempotent)
3. Updates `payment_status = 'paid'`, sets `gateway_payment_id`
4. Decrements stock for each line item via `decrement_variant_stock` RPC
5. Sends admin notification email
6. Sends customer confirmation email

### `payment.failed`
Fires when payment explicitly fails. The handler:
1. Finds the order by `gateway_order_id`
2. Only transitions `pending → failed` (never downgrades `paid`)
3. Sends customer failure email

---

## 8. Retry Behaviour

Razorpay retries failed webhooks (non-2xx response) with exponential backoff for up to **3 days**. The code is fully idempotent:
- Duplicate `payment.captured` → second call is a no-op (already `paid`)
- Late `payment.failed` after `payment.captured` → guard prevents downgrade

Return `200 { received: true }` even when no action is taken (order not found, etc.) to prevent unnecessary retries.

---

## 9. Monitoring Failed Webhooks

In Razorpay Dashboard → Settings → Webhooks → click your webhook → **Webhook Logs**. You can see every delivery attempt, response code, and body. Retry manually if needed.