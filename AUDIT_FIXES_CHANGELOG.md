# Audit Fixes — Changelog

**Date:** 12 June 2026
**Scope:** All no-approval fixes from `QA_AUDIT_REPORT.md` (2 High, 6 Medium, supporting tech-debt + tests).
**Build gate:** `tsc --noEmit` → 0 errors. ESLint → clean. New + existing unit tests pass.

This document lists exactly what changed, why, how to verify it, and the one manual step left for you (a DB migration — **requires your approval to run**).

---

## ⚠️ One action needed from you before deploy

**Run migration `029_orders_stock_decrement_guard.sql` in Supabase.**
It adds `orders.stock_decremented_at` (the idempotency guard that the new stock logic depends on) and backfills existing paid orders so their stock is never double-decremented. The file is written and safe (adds one nullable column + a backfill + one index). The H-1 code is deployed-ready but the column must exist first. Running SQL on the live DB is the one thing I don't do without you.

Everything else below is pure code and is already applied.

---

## High-severity fixes

### H-1 — Inventory now decrements on both payment paths, exactly once
**Files:** `lib/stock.ts` (new), `app/api/payments/verify/route.ts`, `app/api/payments/webhook/route.ts`, `lib/database.types.ts`, `supabase/migrations/029_orders_stock_decrement_guard.sql` (new)

Before: stock was decremented **only** inside the Razorpay webhook. If the webhook was unconfigured or failed to deliver, a paid order never reduced inventory → silent oversell.

After: a shared helper `decrementOrderStockOnce()` performs an **atomic claim** on `orders.stock_decremented_at` (NULL → NOW()). Both `/api/payments/verify` (the client callback) and the webhook call it. Whichever runs first does the decrement; every later/duplicate call no-ops. Inventory reduces exactly once regardless of which path confirms payment or how many retries fire. Oversells (stock would go negative) are logged for reconciliation, never thrown.

**Verify:** `tests/unit/stock.test.ts` — proves it decrements each line item when it wins the claim, and no-ops when the claim returns no row or errors.

### H-2 — Captured payments are no longer orphaned by a retry
**Files:** `lib/razorpay.ts` (added `fetchRazorpayOrder`), `app/api/payments/webhook/route.ts`

Before: every retry/reuse rotated `gateway_order_id`. If a customer paid an **older** still-open Razorpay modal, the webhook's lookup by `gateway_order_id` missed → money captured, order stuck `pending`, no email, no stock decrement.

After: when the webhook can't find the order by `gateway_order_id`, it fetches the Razorpay order and reconciles via its `receipt` (which we always set to our `order_number`), then marks the correct order paid. No payment is orphaned. Combined with H-1's guard, stock still decrements exactly once even in this path.

---

## Medium-severity fixes

### Coupon usage leak — usage is now released on abandon/cancel
**Files:** `lib/coupons.ts` (new), `app/api/orders/create/route.ts`, `app/api/orders/[orderNumber]/cancel/route.ts`

`coupons.usage_count` is incremented at order-create. Previously it was never given back when a pending order was lazy-expired (on the customer's next attempt) or cancelled — so a limited-use coupon was permanently eaten by abandoned checkouts. New `releaseCouponUsage()` decrements (floored at 0) on both the expiry sweep and the cancel route.
**Verify:** `tests/unit/coupons.test.ts`.

### S-1 — Email HTML injection closed
**Files:** `lib/html-escape.ts` (new), `lib/email.ts`, `app/api/contact/route.ts`

Every user-controlled value interpolated into an HTML email (customer name, product name/colour/size, courier, tracking, address, contact name/subject/message) is now `escapeHtml()`-wrapped. The contact subject line also strips CR/LF to block header injection.
**Verify:** `tests/unit/html-escape.test.ts`.

### S-2 — Search filter injection closed
**File:** `app/api/search/route.ts`

The user query is interpolated into a PostgREST `.or()` filter string. Input is now stripped of PostgREST-significant characters (`, ( ) % _ * \`) before use, so a crafted query can't inject extra filter conditions. Plain words/spaces still match via `ilike`.

### S-4 — Dev auth bypass hardened
**Files:** `lib/auth.ts`, `app/api/account/addresses/route.ts` (+ `/[id]`), `app/api/orders/hide`, `.../cancel`, `.../retry-payment`

The account/order routes previously swapped in the admin `DEV_SESSION` whenever `NODE_ENV !== 'production'`. Now gated on a new `DEV_AUTH_BYPASS` flag that requires an explicit `ALLOW_DEV_SESSION=1` **and** hard-refuses when `NODE_ENV === 'production'`. Default off. (Live prod was already safe — this removes the misconfiguration footgun.)

### U-1 / P-2 — Pagination + filters corrected
**File:** `app/api/products/route.ts`

`page` is clamped to ≥ 1 (`?page=abc` / `?page=-1` no longer return a confusing "total but no products"). Occasion/size/fabric filters now run **in the DB before pagination**, so the returned `count` matches the filtered result and pagination is correct (previously occasion/fabric were filtered in JS after the page was fetched, silently breaking page counts).

### U-2 — Checkout no longer fakes a successful order
**File:** `app/(shop)/checkout/CheckoutForm.tsx`

If the Razorpay script fails to load, checkout now shows a retryable error and **keeps the cart**, instead of clearing the cart and routing to the confirmation page as if payment succeeded.

---

## Tech-debt cleanup
- `lib/constants.ts` (new) — single source of truth for `INDIAN_STATES` (was duplicated in 3 files) and checkout pricing constants (`SHIPPING_THRESHOLD`, shipping/gift costs — were duplicated between the checkout UI and the server order calc, a drift risk). Checkout, both address routes, and `orders/create` now import from it.
- Doc drift corrected in `POSSAH_MASTER_DOCUMENT.md`: the non-existent `/api/reviews` and `/api/wishlist` rows were replaced with the routes that actually ship, plus an explicit note that review submission isn't implemented and the wishlist is client-only.

---

## New files
| File | Purpose |
|---|---|
| `lib/html-escape.ts` | `escapeHtml()` for safe email interpolation |
| `lib/constants.ts` | Shared states + pricing constants |
| `lib/coupons.ts` | `releaseCouponUsage()` |
| `lib/stock.ts` | `decrementOrderStockOnce()` idempotent stock guard |
| `supabase/migrations/029_orders_stock_decrement_guard.sql` | Adds `stock_decremented_at` (**run this**) |
| `tests/unit/html-escape.test.ts` | S-1 coverage |
| `tests/unit/stock.test.ts` | H-1 coverage |
| `tests/unit/coupons.test.ts` | Coupon-leak coverage |

---

## How I verified
- `tsc --noEmit` after every change — 0 errors on the final state.
- ESLint clean.
- Unit tests (incl. 3 new) pass.
- Live black-box checks against the dev deployment for the original findings (auth 401 without cookie, etc.) remain valid; the new code paths are covered by unit tests since they can't be exercised against live until deployed.

---

## Still needs your approval (unchanged from before)
- **Run migration 029** in Supabase (above).
- **Rate limiting** (S-3) on contact/coupon/order-create — needs a service (Upstash/Vercel) decision.
- **Dev-site `noindex`** — Vercel env/deploy config change.
- **Deploy** to Vercel.
- **Razorpay webhook** registration (dashboard).
- **Run k6 load test** against live.
- **A11y contrast** changes that alter brand colours.
