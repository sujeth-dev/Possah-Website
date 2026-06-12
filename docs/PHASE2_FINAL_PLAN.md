# PHASE 2 — FINAL PLAN (revised)

**Date:** 2026-06-11
**Supersedes:** Phase 2 section in `docs/EXEC_PLAN_2026_06_11.md`.
**Why revised:** DEN flagged that unpaid orders pile up in DB — every checkout attempt creates a new row. Also confirmation email fires before payment. Plan below fixes both at the foundation.

---

## 0. Audit of the duplicate-order bug

### Bug A — duplicate pending orders
File: `app/api/orders/create/route.ts` lines 239–262.

Code does an unconditional `supabase.from('orders').insert(...)`. No dedupe, no upsert. So:

1. Customer fills checkout, hits Pay → row 1 inserted, `payment_status='pending'`.
2. Razorpay modal dismissed / failed / browser closed.
3. Customer returns to checkout (cart still has same items, same email).
4. Hits Pay again → row 2 inserted with a brand-new `order_number` and brand-new `razorpay_order_id`.
5. Repeat N times → N pending rows for the same intent.

Admin dashboard counts all N. Customer's `/account/orders` shows N entries. DB grows for nothing.

### Bug B — confirmation email fires before payment
Same file, lines 272–291. `sendOrderConfirmationEmail(...)` is called immediately after `INSERT`, **before** Razorpay even prompts the customer. So the customer gets a "Thanks for your order" email for an order they never paid for. If they retry, they get another. Spam + brand confusion.

### Bug C — guest checkout has no identity anchor
Currently the only stable identifier between attempts is `customer_email`. No session, no cart id. If the guest changes their email between attempts, dedupe by email won't help. Acceptable trade-off — most retries keep the same email.

---

## 1. Design — "One open pending order per customer" rule

### Rule
A customer (identified by `customer_email`) can have **at most one** order in `payment_status='pending'` AND `fulfillment_status='unfulfilled'` at any time.

Any subsequent checkout attempt with the same email:
- **Same cart fingerprint + same totals** → reuse the existing order_number, regenerate Razorpay order id, return same order.
- **Different cart or totals** → update the existing row in place (cart, totals, address, coupon, new Razorpay order id). Keep the same order_number so links don't break.

### Why same order_number on update
Customer may already have a tab open at `/order/confirmation?order=XYZ`. If we change the order_number on retry, that URL 404s. Keep it stable.

### Expiry
Pending orders older than 24h are considered abandoned. A scheduled cleanup (cron via Vercel or Supabase) moves them to `fulfillment_status='cancelled'` so they fall out of the "open pending" pool. After that point, a new checkout attempt creates a fresh row.

### Cart fingerprint
A deterministic hash of the order intent. Used for fast equality check before deciding reuse vs update.

Computed server-side from:
```
sorted_by_variant_id(items.map(i => `${i.variant_id}:${i.qty}`)).join('|')
+ '||' + delivery_option
+ '||' + (coupon_code || '')
+ '||' + (gift_wrap ? '1' : '0')
+ '||' + serverTotal
```

Stored as plain TEXT on the order row.

### DB-level safety net
A unique partial index makes it **impossible** to have two open pending orders for the same email even if two concurrent requests race:

```sql
CREATE UNIQUE INDEX one_pending_per_email
  ON orders(customer_email)
  WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled';
```

If a race slips past the app-level check, the second insert hits the index and fails. App retries with the "update existing" branch.

---

## 2. Phase 2 deliverables — final list

Phase 2 now bundles 6 items. Old items 1, 2, 3, 4 from the original plan are kept and items 5, 6 are the new duplicate-order fix and the email-timing fix.

| # | Issue | Title |
|---|-------|-------|
| 1 | NEW | **Duplicate-order kill** — one open pending order per customer |
| 2 | NEW | **Confirmation email moves to post-payment** |
| 3 | 1 | Soft-hide cancelled/unpaid via X |
| 4 | 2 | Progress bar in list + new detail page |
| 5 | 14 | Paid vs Incomplete split + retry + admin "Attempted" tab |
| 6 | 20 | Blank-space sweep across all order-related pages |

Order of execution matters. Item 1 must land first because items 3, 4, 5 all consume the new state model (cart_fingerprint, expires_at, one-pending rule).

---

## 3. Item-by-item plan

### ITEM 1 — Duplicate-order kill (NEW)

**DB — migration `supabase/migrations/025_orders_pending_dedupe.sql`**

```sql
-- 025: One open pending order per customer
BEGIN;

-- Cart fingerprint for fast equality check between attempts
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_fingerprint TEXT;

-- Auto-expiry for abandoned pending orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Track retry count for analytics + abuse detection
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_attempts INT NOT NULL DEFAULT 0;

-- Unique partial index — DB-level guarantee of single pending order per email
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_per_email
  ON orders(customer_email)
  WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled';

-- Index on expires_at for cleanup cron
CREATE INDEX IF NOT EXISTS idx_orders_expires_at
  ON orders(expires_at)
  WHERE payment_status = 'pending';

COMMIT;
```

**API — rewrite `app/api/orders/create/route.ts`**

Replace the unconditional INSERT (lines 239–262) with this flow:

```
1. Compute serverSubtotal / serverShipping / couponDiscount / serverTotal (existing).
2. Build cart_fingerprint string.
3. SELECT existing order where:
     customer_email = data.contact.email
     AND payment_status = 'pending'
     AND fulfillment_status = 'unfulfilled'
     AND (expires_at IS NULL OR expires_at > NOW())
   LIMIT 1.
4. If found:
     a. If existing.cart_fingerprint === new fingerprint:
        → REUSE branch:
          - Regenerate Razorpay order id (don't reuse old — may have expired).
          - UPDATE row: gateway_order_id = new id, payment_attempts += 1, expires_at = NOW() + 24h.
          - Return existing.order_number + new razorpay_order_id.
     b. Else:
        → UPDATE branch:
          - If coupon changed: decrement old coupon usage, validate + increment new.
          - Generate new Razorpay order id.
          - UPDATE row: cart_fingerprint, line_items, shipping_address, subtotal, shipping_fee, discount_amount, coupon_code, total, gateway_order_id, payment_attempts += 1, expires_at = NOW() + 24h.
          - Keep order_number same. Return order_number + new razorpay_order_id.
5. If NOT found:
     → INSERT branch (current code):
       - Generate order_number, Razorpay order id.
       - INSERT with cart_fingerprint, expires_at = NOW() + 24h, payment_attempts = 1.
6. Catch unique-index violation from concurrent requests:
     - retry once: go back to step 3 (will find the row inserted by the other request).
```

Wrap steps 3–5 in a transaction-like sequence using Supabase. The unique index is the ultimate guard.

**Cleanup cron — new file `app/api/cron/expire-pending-orders/route.ts`**

```
GET endpoint. Bearer-token auth via env var CRON_SECRET.
UPDATE orders
  SET fulfillment_status = 'cancelled', internal_notes = COALESCE(internal_notes,'') || ' [auto-expired]'
  WHERE payment_status = 'pending'
    AND fulfillment_status = 'unfulfilled'
    AND expires_at < NOW()
Returns count of rows affected.
```

Register in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/expire-pending-orders", "schedule": "0 * * * *" }
  ]
}
```

Hourly is enough — the 24h expiry has plenty of slack.

**Acceptance**
- Customer attempts checkout 5 times for same cart → 1 row in DB, `payment_attempts = 5`.
- Customer changes cart mid-attempt → same row updated with new items, same `order_number`.
- Two concurrent requests from same email → one wins, one falls back to UPDATE.
- Pending order older than 24h auto-cancelled by cron.
- Existing paid orders untouched.

**Risk**
- Migration on a populated table: the unique partial index may fail if duplicates already exist. Pre-flight: cancel all but the most recent pending row per email before adding the index. Migration includes this:
  ```sql
  UPDATE orders SET fulfillment_status = 'cancelled', internal_notes = COALESCE(internal_notes,'') || ' [pre-dedupe cleanup]'
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
        FROM orders
        WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled'
      ) t WHERE t.rn > 1
    );
  ```

---

### ITEM 2 — Confirmation email post-payment (NEW)

**Problem**
`app/api/orders/create/route.ts` lines 272–291 fires `sendOrderConfirmationEmail` immediately after INSERT, before Razorpay even prompts. Customer gets thank-you email for an unpaid order.

**Fix**
1. **Remove** the `sendOrderConfirmationEmail` call from `app/api/orders/create/route.ts`.
2. **Move** it into `app/api/payments/verify/route.ts` — fire after the `payment_status='paid'` update succeeds. Wrap in try/catch, swallow errors (don't fail verify on email failure).
3. **Also fire** from the Razorpay webhook handler `app/api/payments/webhook/route.ts` for redundancy — but de-dupe by checking a new `confirmation_email_sent_at` column.

**DB additions to migration 025**
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;
```

**Email send logic (shared)**
- Re-fetch order from DB (line_items, totals).
- If `confirmation_email_sent_at IS NOT NULL` → skip.
- Send via `sendOrderConfirmationEmail`.
- On success: `UPDATE orders SET confirmation_email_sent_at = NOW() WHERE order_number = ?`.

**Acceptance**
- Pending order: no email sent.
- Successful payment: exactly one email sent (verified by `confirmation_email_sent_at`).
- Webhook fires after verify already sent email: no duplicate.
- Retry payment on existing pending order that succeeds: email fires on the success, not on retry attempt.

**Risk**
- Email worker race: verify + webhook race to send. Mitigated by atomic `UPDATE ... WHERE confirmation_email_sent_at IS NULL` check.

---

### ITEM 3 (Issue 1) — Soft-hide cancelled/unpaid via X

**DB additions to migration 025**
```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_hidden_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_customer_hidden
  ON orders(customer_email, customer_hidden_at);
```

**API — `app/api/orders/hide/route.ts`**
```
POST { order_number }
- Auth: getServerSession; session.user.email must match orders.customer_email.
- Reject if payment_status='paid' AND fulfillment_status NOT IN ('cancelled','unfulfilled').
- UPDATE orders SET customer_hidden_at = NOW() WHERE order_number = ? AND customer_email = ?.
- Return { ok: true }.
- Errors: 401 (no session), 403 (email mismatch), 422 (not eligible), 404 (not found).
```

**UI — edit `app/(shop)/account/orders/page.tsx`**
- `getOrders` query adds `.is('customer_hidden_at', null)`.
- Each card gets `<OrderCardActions orderNumber={...} isHideable={...} />` top-right.

**New component — `components/account/OrderCardActions.tsx`** (client)
- X button (lucide-style svg, no external dep).
- On click: confirm modal "Hide order #X? It will move out of your list. You can recover it by contacting us."
- On confirm: POST `/api/orders/hide`, optimistic remove from UI, `router.refresh()` on success.
- Error toast on failure.

**Acceptance**
- X appears only when payment_status IN ('pending','failed','refunded') OR fulfillment_status='cancelled'.
- Click X → confirm → order hidden from `/account/orders`.
- Admin `/admin/orders` still sees it.
- Refresh persists hide.
- Wrong-user attempt → 403.

---

### ITEM 4 (Issue 2) — Progress bar + new detail page

**New component — `components/account/OrderProgressBar.tsx`** (server)
- Props: `paymentStatus`, `fulfillmentStatus`, `size: 'mini' | 'full'`.
- Steps: Placed → Confirmed (paid) → Processing → Shipped → Delivered.
- Cancelled: render full-width red bar with "Cancelled" label instead of steps.
- Mini variant: 5 dots horizontally, filled green up to current, grey after.
- Full variant: 5 labelled circles with connecting lines + dates if available.

**Edit `app/(shop)/account/orders/page.tsx`**
- Under the existing Badge in each card, render `<OrderProgressBar paymentStatus={...} fulfillmentStatus={...} size="mini" />`.
- Repoint Details link from `/order/confirmation?order=...` to `/account/orders/${order.order_number}`.

**New page — `app/(shop)/account/orders/[orderNumber]/page.tsx`**
- Auth gate. 404 if order_number not found OR customer_email !== session email.
- Sections:
  - Back to orders link.
  - Heading "Order #XXXX" + created date.
  - Full progress bar.
  - Tracking strip: if `tracking_number` set → show courier name + tracking number + tracking URL (if courier known) + "Mark delivered if it arrived" CTA (no-op for now, just info).
  - Line items list with thumbnail, name, colour/size, qty, unit price.
  - Shipping address card.
  - Payment breakdown: subtotal, shipping, gift_wrap (if any), discount (if any), total, payment_status badge.
  - "Need help?" → /contact?order=NUMBER.
  - "Hide order" button at bottom right (reuses ITEM 3 hide endpoint) only when eligible.
- Mobile: progress bar wraps to vertical or scrolls horizontally.

**Acceptance**
- List shows mini 5-step bar per row.
- Details link goes to new page.
- Cancelled orders show red bar.
- Tracking info shown only if present.
- Wrong-user URL: 404, not 403 (don't leak existence).

---

### ITEM 5 (Issue 14) — Paid / Incomplete split + retry + admin Attempted tab

**Customer `/account/orders/page.tsx` — split rendering**
- Query both paid and pending in one call, partition in code.
- Top section: paid orders (current rendering, with progress bar).
- Bottom section (only if non-empty): heading "Payment incomplete". Cards for orders with `payment_status IN ('pending','failed')` AND `fulfillment_status NOT IN ('cancelled')` AND NOT hidden.
  - Each card shows: order#, items preview, amount, two CTAs:
    - `[Retry payment]` — opens Razorpay modal with fresh order id (via retry endpoint).
    - `[Cancel]` — sets fulfillment_status='cancelled' (then soft-hide via ITEM 3 X).

**Retry endpoint — `app/api/orders/[orderNumber]/retry-payment/route.ts`**
- POST. Auth: session email must match.
- Reject if not in pending state.
- Re-create Razorpay order id for the stored `total`.
- UPDATE orders SET gateway_order_id = newId, payment_attempts += 1, expires_at = NOW() + 24h.
- Return `{ razorpay_order_id, amount, order_number }`.

**Cancel endpoint — `app/api/orders/[orderNumber]/cancel/route.ts`**
- POST. Auth as above.
- Reject if `payment_status='paid'` (can't cancel paid via this — needs refund flow).
- UPDATE orders SET fulfillment_status='cancelled'.
- Returns `{ ok: true }`. Client follows with hide call.

**Client retry flow**
- Reuse Razorpay init pattern from `app/(shop)/checkout/CheckoutForm.tsx`. Extract `initRazorpay` to `lib/razorpay-client.ts` so retry page can call it.
- On success → call `/api/payments/verify`. Same flow as initial checkout.

**Admin `/admin/orders/page.tsx` — Attempted tab**
- Add to `TABS` array between "All" and "Unfulfilled":
  ```
  { label: 'Attempted', value: 'attempted' },
  ```
- In `getOrders`, when `params.status === 'attempted'`:
  ```
  query = query
    .in('payment_status', ['pending', 'failed'])
    .gte('created_at', new Date(Date.now() - 14*24*60*60*1000).toISOString())
  ```
- Show retry count and last-attempt timestamp in row.
- CSV export respects this filter.

**Admin revenue widget**
- Locate the revenue computation (likely `app/admin/page.tsx` or a stat component).
- Audit: ensure `payment_status = 'paid'` filter is applied.
- If filter missing → patch.
- Add second stat card "Abandoned (last 7 days)" showing count + total of attempted-but-not-paid for context.

**Acceptance**
- Customer with paid + pending sees both sections.
- Retry → Razorpay opens → success flows through verify → moves to paid section.
- Cancel → moves out of incomplete list, becomes hideable.
- Admin Attempted tab shows only pending/failed within 14d.
- Revenue widget excludes non-paid.

---

### ITEM 6 (Issue 20) — Blank-space sweep

Pages to audit at 1440px and 375px:
- `/account/orders` (with new sections + progress bars).
- `/account/orders/[orderNumber]` (new page).
- `/order/confirmation` (existing post-checkout page).
- `/admin/orders`.
- `/admin/orders/[id]`.

Method:
1. Run dev server, screenshot each at both widths.
2. Catalogue gaps >40px without grouping intent.
3. Tighten with 8/16/24/40px rhythm tokens.
4. Output `docs/ORDER_PAGE_SPACING.md` with before/after notes.

---

## 4. Final migration 025 — complete

```sql
-- 025_orders_pending_dedupe_and_hide.sql
BEGIN;

-- A. Cart fingerprint for dedupe
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cart_fingerprint TEXT;

-- B. Pending expiry
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- C. Retry count
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_attempts INT NOT NULL DEFAULT 0;

-- D. Customer soft-hide
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_hidden_at TIMESTAMPTZ;

-- E. Email-sent guard
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

-- F. Backfill expires_at on existing pending rows
UPDATE orders
  SET expires_at = created_at + INTERVAL '24 hours'
  WHERE payment_status = 'pending' AND expires_at IS NULL;

-- G. Pre-dedupe cleanup: keep most-recent pending per email, cancel the rest
UPDATE orders SET fulfillment_status = 'cancelled',
                  internal_notes = COALESCE(internal_notes,'') || ' [pre-dedupe cleanup]'
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
      FROM orders
      WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled'
    ) t WHERE t.rn > 1
  );

-- H. One-pending-per-email guard
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_per_email
  ON orders(customer_email)
  WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled';

-- I. Cron-friendly index
CREATE INDEX IF NOT EXISTS idx_orders_expires_at
  ON orders(expires_at)
  WHERE payment_status = 'pending';

-- J. Soft-hide lookup
CREATE INDEX IF NOT EXISTS idx_orders_customer_hidden
  ON orders(customer_email, customer_hidden_at);

COMMIT;
```

One migration covers all of Phase 2's DB needs.

---

## 5. Files to create / edit

### New files
- `supabase/migrations/025_orders_pending_dedupe_and_hide.sql`
- `app/api/orders/hide/route.ts`
- `app/api/orders/[orderNumber]/retry-payment/route.ts`
- `app/api/orders/[orderNumber]/cancel/route.ts`
- `app/api/cron/expire-pending-orders/route.ts`
- `app/(shop)/account/orders/[orderNumber]/page.tsx`
- `components/account/OrderCardActions.tsx`
- `components/account/OrderProgressBar.tsx`
- `components/account/IncompleteOrderCard.tsx`
- `lib/cart-fingerprint.ts` (shared helper for create + retry)
- `lib/razorpay-client.ts` (shared modal init, used by checkout + retry)
- `docs/ORDER_PAGE_SPACING.md`

### Existing files to edit
- `app/api/orders/create/route.ts` — replace INSERT with reuse/update/insert flow + remove email send.
- `app/api/payments/verify/route.ts` — add email send after `paid` update, gated on `confirmation_email_sent_at`.
- `app/api/payments/webhook/route.ts` — same email send + de-dupe guard.
- `app/(shop)/account/orders/page.tsx` — paid/incomplete split, mini progress bar, X actions, hidden filter.
- `app/(shop)/checkout/CheckoutForm.tsx` — extract razorpay init to lib, otherwise no change.
- `app/admin/orders/page.tsx` — Attempted tab, retry/attempt count columns.
- `app/admin/page.tsx` (or wherever revenue stat lives) — paid-only filter + Abandoned stat card.
- `vercel.json` — cron registration.

---

## 6. Execution order (one PR per item, gated by tests)

1. **Migration 025 + ITEM 1** (dedupe). No UI changes. Existing flows keep working — every checkout becomes an upsert. Ship + monitor.
2. **ITEM 2** (email timing). Pure logic move, no schema change. Ship + monitor sender logs.
3. **ITEM 3** (X soft-hide). Customer UI only.
4. **ITEM 4** (progress bar + detail page). Customer UI.
5. **ITEM 5** (split + retry + admin Attempted). Touches both customer and admin.
6. **ITEM 6** (blank space sweep). Pure CSS.

Each item ships with:
- Integration test for new API routes.
- Manual walkthrough checklist (see acceptance bullets).
- `npx tsc --noEmit` + ESLint clean.

---

## 7. Open questions before execution

1. **Cron auth secret** — confirm a `CRON_SECRET` env var exists or needs adding to `.env.local` + Vercel.
2. **Pending expiry window** — 24h proposed. Want 12h or 48h?
3. **Pre-dedupe cleanup on prod DB** — the migration cancels duplicate pending orders. Acceptable, or want a dry-run report first listing how many will be cancelled?
4. **Retry payment attempt limit** — cap at 5 attempts per order? After that, force cancel?
5. **Admin override** — should admin be able to undo `customer_hidden_at` on request?

---

## 8. Out of scope for Phase 2

These are deferred to later phases per the master plan:
- Address book (Phase 3).
- Image upload (Phase 3).
- Order status history + auto-emails on shipped/delivered (Phase 4).
- PDP magnifier (Phase 4).
- SEO + speed + DB cleanup (Phase 5).

END.
