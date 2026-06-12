# Phase 2 — delivery notes

**Shipped:** 2026-06-12. Deployed to production via commit `be0bd9d`. Vercel auto-deployed.
**Supabase migration 025:** MUST be run manually — see rollout steps 2–4 below. Until this is done, duplicate orders and missing confirmation emails will persist.
**Status:** all 6 items shipped. `npx tsc --noEmit` clean. ESLint clean across
all 17 touched files.

## What you need to do to roll this out (in order)

1. **Set `CRON_SECRET`** in `.env.local` and in the Vercel project env. Use
   `openssl rand -hex 32`. The cron at `/api/cron/expire-pending-orders` is
   already registered in `vercel.json` and will run hourly once deployed.
2. **Run `supabase/migrations/025_orders_pending_dedupe_schema.sql`** in
   Supabase. This adds the new columns + indexes. Safe on populated tables.
3. **Run `scripts/dedupe/01_preview.sql`** in Supabase SQL editor. Save the
   three result blocks. They tell you exactly how many existing duplicate
   pending rows will be cancelled by the next step.
4. **Send me the preview counts** (or paste them into chat). After approval,
   run `scripts/dedupe/02_finalize.sql`. That step cancels duplicate pendings
   and adds the unique partial index that makes "two open pending orders per
   customer" impossible going forward.
5. Deploy. The app code is already safe before steps 2–4 — the dedupe logic
   in the create-order route does a SELECT-then-UPSERT. The DB index is an
   extra safety net for races.

## Files added

- `supabase/migrations/025_orders_pending_dedupe_schema.sql`
- `scripts/dedupe/01_preview.sql`
- `scripts/dedupe/02_finalize.sql`
- `lib/cart-fingerprint.ts`
- `lib/send-order-emails.ts`
- `lib/razorpay-client.ts`
- `app/api/cron/expire-pending-orders/route.ts`
- `app/api/orders/hide/route.ts`
- `app/api/orders/[orderNumber]/retry-payment/route.ts`
- `app/api/orders/[orderNumber]/cancel/route.ts`
- `app/(shop)/account/orders/[orderNumber]/page.tsx`
- `components/account/OrderProgressBar.tsx`
- `components/account/OrderCardActions.tsx`
- `components/account/IncompleteOrderCard.tsx`
- `docs/ORDER_PAGE_SPACING.md`

## Files edited

- `app/api/orders/create/route.ts` — full upsert-flow rewrite. One open
  pending per customer; same cart → reuse; different cart → update in place.
  Email send removed (moved post-payment).
- `app/api/payments/verify/route.ts` — fires confirmation email via the new
  idempotent helper after `paid` update.
- `app/api/payments/webhook/route.ts` — same. Customer + admin emails happen
  exactly once across the verify-callback + webhook race.
- `app/(shop)/account/orders/page.tsx` — full rewrite. Paid section
  (with mini progress bar + X) + Payment Incomplete section
  (with Retry + Cancel) + soft-hide filter.
- `app/admin/orders/page.tsx` — new `Attempted` tab; `×N` retry badge near
  order number; tabs row wraps on narrow viewports.
- `app/admin/page.tsx` — revenue + orders-today filtered to paid-only;
  pending-orders filtered to paid+unfulfilled (so abandoned checkouts don't
  inflate the admin action queue); new `Abandoned (7d)` stat card.
- `lib/database.types.ts` — added the new columns to the orders Row/Insert/
  Update types so TS knows about them.
- `lib/email.ts` — fixed `Neworder` → `New order` typo in admin notification
  subject.
- `vercel.json` — registered hourly cron for `/api/cron/expire-pending-orders`.
- `.env.local.example` — documented `CRON_SECRET`.

## Behaviour changes the customer will notice

- **Only one open pending order per email ever.** A retry never creates a new
  order — it updates the existing one with new cart, new totals, new Razorpay
  id. Same order_number, so confirmation URLs don't break.
- **Confirmation email lands AFTER payment.** Customers who abandoned at
  Razorpay never get a "thank you" email any more.
- **My orders page now shows two sections.** Paid orders on top with a
  5-step progress bar per row. Payment Incomplete below with Retry + Cancel
  buttons. The Cancel button soft-hides the row after marking it cancelled.
- **X button on cancelled/unpaid orders** removes them from the list. Admin
  still sees them.
- **Each card links to a new detail page** at `/account/orders/<number>` with
  a full progress bar, tracking, and payment breakdown.

## Behaviour changes admin will notice

- **Dashboard revenue + orders-today are paid-only.** Unpaid attempts never
  inflate the numbers.
- **New `Abandoned (7d)` stat card** surfaces the conversion signal.
- **New `Attempted` tab on `/admin/orders`** lists pending/failed payment
  attempts in the last 14 days. `×3` badge next to the order number tells
  you how many times the customer tried to pay.
- **Pending Orders stat** = paid + (unfulfilled OR processing). It used to
  include abandoned checkouts, which made the queue look fake.

## Behaviour changes you DON'T see

- Existing paid orders are untouched in every dimension. No migration changes
  any column on a paid row.
- The webhook flow + HMAC verification logic is unchanged.
- The checkout form UI is unchanged.

## Open follow-ups for Phase 4 / 5

- Status emails on shipped + delivered (Phase 4 plan item).
- Order status history table (migration 028, Phase 4).
- Admin manual resend confirmation button (Phase 4).
- DB field cleanup + dedupe of `gift_message` vs `notes` (Phase 5).
- One spacing tweak deferred from this phase: the gap between order-number
  block and "what's next" steps on `/order/confirmation`. Bundling with the
  Phase 4 email template touch.
