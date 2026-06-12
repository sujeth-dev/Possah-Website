# Possah — Phase 3 Summary + Phase 4 Continuation Prompt

**Date:** 2026-06-12
**Status:** Phase 3 shipped. Phase 4 ready to start.
**Reference:** Full execution plan at `docs/EXEC_PLAN_2026_06_11.md`.

---

## PART A — What Phase 3 delivered

### Phase 3 commits
- `787823e` — feat(phase3): address book, homepage image upload, admin products filter/sort
- `866fde7` — fix(homepage): new arrivals respects admin-curated new_arrival_ids order
- `85e7e86` — feat(checkout): auto-save address to address book on Pay button press

### Issues shipped
1. **Issues 3+4+5 — Full address book**
   - Migration `026_addresses_default_unique.sql` — adds `delivery_notes` column + unique partial index on `(user_id) WHERE is_default = TRUE`
   - API: GET/POST `/api/account/addresses`, PATCH/DELETE `/api/account/addresses/[id]`
   - `getOrCreateUserId(email)` pattern — resolves Supabase UUID from email (session.user.id is Google ID, not Supabase UUID)
   - Account UI: `/account/addresses` with AddressCard + AddressForm components; link added to `/account` index
   - Checkout: saved address picker prefills form; localStorage draft restores on re-visit; auto-save on Pay button press

2. **Issue 18 — Homepage image upload**
   - `components/admin/ImageUploadField.tsx` — upload + URL fallback + thumbnail preview
   - Uses existing `/api/admin/upload` (R2 via `r2Upload`). Paths: `uploads/homepage/hero`, `uploads/homepage/banner`, `uploads/homepage/occasions`
   - Wired into all `Field label="Image URL"` occurrences in `HomepageEditor.tsx`

3. **Issue 21 — Admin products category filter + sort**
   - `?category=<id>` + `?sort=<key>` URL params on `/admin/products`
   - Sort options: newest (default), name_asc, price_asc, price_desc, stock_asc
   - Category dropdown from `categories` table; combined with existing name search
   - Pagination carries params through; "Clear filters" resets to `/admin/products`

4. **Bug fix — New Arrivals curated order**
   - Homepage was ignoring `homepage_config.new_arrival_ids` entirely; always fetched `is_new_arrival=true` products
   - Fixed: if `new_arrival_ids` is set, fetch those exact products in admin-selected order; fallback to flag if empty

5. **Bug fix — Address auto-save fires on Pay (not after payment success)**
   - Per user request: fires when they press Pay (after Zod validation passes, before Razorpay opens)
   - Logged-in users only (`isLoggedIn` flag set if addresses GET returns 200)
   - Duplicate check: skipped if `address_line1` + `pincode` already in saved addresses

### Key architecture decisions
- `session.user.id` = Google ID (NextAuth token.sub). `user_addresses.user_id` = Supabase UUID from `users` table. Bridge via `getOrCreateUserId(email)` in the addresses API.
- Image upload requires real admin JWT (`requireAdminAuth` — no DEV_SESSION bypass). Works when signed in to admin in any environment.
- New Arrivals query now branches: curated list (`.in('id', ids)` + client-side reorder) vs `is_new_arrival=true` flag.

### ⚠️ MANUAL DB ACTION REQUIRED for production

Run in Supabase SQL Editor:

```
supabase/migrations/026_addresses_default_unique.sql
```

This adds the `delivery_notes` column and the unique partial index that enforces one default address per user. Address book will function without it but two defaults could exist.

### Files created in Phase 3
- `supabase/migrations/026_addresses_default_unique.sql`
- `app/api/account/addresses/route.ts`
- `app/api/account/addresses/[id]/route.ts`
- `app/(shop)/account/addresses/page.tsx`
- `components/account/AddressCard.tsx`
- `components/account/AddressForm.tsx`
- `components/admin/ImageUploadField.tsx`

### Files edited in Phase 3
- `app/(shop)/account/page.tsx` — Addresses link added to ACCOUNT_LINKS
- `app/(shop)/checkout/CheckoutForm.tsx` — address picker, localStorage draft, auto-save, isLoggedIn state
- `app/(shop)/page.tsx` — New Arrivals curated order fix
- `app/admin/homepage/HomepageEditor.tsx` — ImageUploadField replacing URL text inputs
- `app/admin/products/page.tsx` — category filter + sort dropdowns + extended query

---

## PART B — Phase 4 plan

### Scope: 3 issues + 1 QA item

---

### P4-1 — Issue 19: Order status history + auto-emails

**Why:** Admin changes fulfillment status but there's no audit trail and no customer notification on Shipped/Delivered.

**DB — `supabase/migrations/028_order_status_history.sql`**
```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  note TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_order ON order_status_history(order_id, changed_at DESC);
```

**API — edit `app/api/admin/orders/[id]/route.ts` (PATCH handler)**
- Before update: read current `fulfillment_status` as `from_status`
- After update: insert row into `order_status_history` with `changed_by = 'admin:' + session.user.email`
- If `from_status → to_status` is `processing → shipped`: call `sendShippedEmail(order)`
- If `from_status → to_status` is `shipped → delivered`: call `sendDeliveredEmail(order)`
- De-dupe guard: skip email if same `to_status` has a history row for this order within last 1 hour

**Email — edit `lib/email.ts`**
- Add `sendShippedEmail(order)` — "Your order has shipped" with tracking_number + courier if set
- Add `sendDeliveredEmail(order)` — "Your order was delivered" (no review link yet — keep simple)
- Both use existing Resend client + brand template style from `sendOrderConfirmationEmail`

**Admin UI — edit `app/admin/orders/[id]/OrderDetailClient.tsx`**
- Add "Status History" collapsible section below fulfillment controls
- Each row: coloured dot, `from_status → to_status`, timestamp (relative + absolute), `changed_by`
- Reverse chronological (newest first)
- Empty state: "No status changes recorded yet"
- If setting status to `shipped`: surface tracking_number + courier inputs inline (save them to order row too)

**Files to create:** `supabase/migrations/028_order_status_history.sql`
**Files to edit:** `app/api/admin/orders/[id]/route.ts`, `app/admin/orders/[id]/OrderDetailClient.tsx`, `lib/email.ts`

---

### P4-2 — Issue 16: Resend confirmation button + email preview tool

**Admin resend button**

New endpoint: `app/api/admin/orders/[id]/resend-confirmation/route.ts`
- POST, admin-auth gated
- Load order by id
- Call existing `sendOrderConfirmationEmail` (from `lib/send-order-emails.ts`)
- Rate-limit: reject if a resend was logged for this order in the last 60 seconds (check `order_status_history` with `to_status='confirmation_resent'`)
- Log the resend as a history row (`changed_by = 'admin:' + email`, `note = 'Manual resend'`)
- Return `{ sent: true, to: email }` or error

In `OrderDetailClient.tsx`: add `[Resend confirmation email]` button near the customer email field. Click → POST → inline toast "Email resent to {email}" (green) or "Error: {message}" (red). Disabled for 10s after click.

**Dev email preview page**

New page: `app/admin/email-preview/page.tsx` (client component)
- Form: destination email input + order picker dropdown (load 20 most recent orders from DB, show `order_number + customer_name`)
- "Send test" button → POST to a new endpoint `app/api/admin/email-preview/route.ts`
- Endpoint loads selected order, calls `sendOrderConfirmationEmail` with test recipient override. Does NOT set `confirmation_email_sent_at` on the real order.
- Add `[{ name: 'test', value: 'true' }]` tag to the Resend call (keeps prod inbox clean)
- Response shows: "Sent to {email}" or Resend error detail
- Linked from `/admin` sidebar or header

**Files to create:** `app/api/admin/orders/[id]/resend-confirmation/route.ts`, `app/admin/email-preview/page.tsx`, `app/api/admin/email-preview/route.ts`
**Files to edit:** `app/admin/orders/[id]/OrderDetailClient.tsx`

---

### P4-3 — Issue 8: Hover magnifier on PDP

**New component: `components/pdp/MagnifierLens.tsx`** (client)

Props: `src: string, alt: string, zoom?: number` (default 2)

Behaviour:
- On mount: detect `window.matchMedia('(hover: hover) and (pointer: fine)')`. If false (touch device) → render plain `<Image>`, let parent lightbox handle taps.
- If hover-capable:
  - Wrap image in container with `cursor: crosshair`, `overflow: hidden`
  - On `mousemove`: compute cursor % of container → update zoomed panel `background-position`
  - Zoomed panel: absolute-positioned 180×220px box, shown to the right of image (or above on narrow viewports). Shows same `src` at `background-size: 200%`
  - Use `requestAnimationFrame` ref to throttle — cancel on `mouseleave`
  - Lens hidden on `mouseleave`
  - Click still opens lightbox (keep existing behaviour)

**Wire into `components/pdp/ProductGallery.tsx`**
- Import `MagnifierLens` and wrap the main displayed image
- Pass `src={currentImage.url}` and `alt={currentImage.alt ?? product.name}`
- Only wrap if image count > 0 (existing guard)
- `loading="eager"` already set for main PDP image — leave as-is

**Files to create:** `components/pdp/MagnifierLens.tsx`
**Files to edit:** `components/pdp/ProductGallery.tsx`

---

### P4-QA — G8: Cart size swap

**Problem:** Once an item is in cart, size is locked. User must remove + re-add to change.

**Fix in `components/cart/CartView.tsx`**

When a cart line item is rendered and the product has >1 size variant:
- Show current size with a small `<select>` dropdown (not a button — native select keeps it simple)
- On change: call `cartStore.updateVariant(itemId, newVariantId)` (or equivalent)
- Cart store needs a mutation that swaps variant_id + size string while keeping productId + qty + name + image

Data required per cart item: the list of available variants for that product. Two options:
- **Option A (simpler):** Extend cart item type to include `availableVariants: { variantId, size, stock_qty }[]`. Populate this when `addToCart` is called (already has access to the variant data at add-time).
- **Option B:** Fetch variants on-demand when dropdown is opened. More complex, skip.

Go with Option A. Requires updating `cartStore.ts` to store `availableVariants` and adding the `updateVariant` action.

Only show the dropdown if `availableVariants.length > 1`.

**Files to edit:** `lib/store/cartStore.ts`, `components/cart/CartView.tsx`, and wherever `addToCart` is called (to pass `availableVariants`)

---

## PART C — Phase 4 execution order

1. Run `028_order_status_history.sql` migration first (creates table)
2. Edit PATCH handler to insert history rows (no emails yet)
3. Add status timeline UI in admin order detail
4. Add email functions to `lib/email.ts` + wire into PATCH handler
5. Build resend confirmation endpoint + button (reuses history table for rate-limit log)
6. Build email preview page (independent — can run in parallel with 5)
7. Hover magnifier (fully independent — no DB, no API)
8. Cart size swap (independent — touch only `cartStore` + `CartView`)

---

## PART D — Open questions before Phase 4 ships

1. **Shipped email content:** what tracking info is typically available? (tracking_number + courier name) — confirm field names match DB columns
2. **Delivered email tone:** review-request link target? Just "Thank you" for now, or link somewhere?
3. **Magnifier position:** right of image, or overlay? On narrow screens, right panel may clip off — confirm preferred fallback

---

## PART E — Phase 4 continuation prompt

Copy from `--- BEGIN PROMPT ---` to `--- END PROMPT ---` and paste into Claude Code.

```
--- BEGIN PROMPT ---
You are continuing Possah e-commerce work. Phases 1, 2, and 3 are fully shipped.

Project rules:
- No filler. Complete code only. No partials.
- All edge cases: loading, error, empty state.
- Read existing files before editing.
- Don't touch out-of-scope files.
- TypeScript must pass clean (npx tsc --noEmit).

CONTEXT
Full plan: `docs/EXEC_PLAN_2026_06_11.md`. Read it.
Phase 3 handover: `docs/HANDOVER_PHASE3_TO_PHASE4.md`. Read it.

KEY FILES TO READ FIRST
- `app/api/admin/orders/[id]/route.ts` — PATCH handler to extend with history insert + email triggers
- `app/admin/orders/[id]/OrderDetailClient.tsx` — UI to extend with status timeline + resend button
- `lib/email.ts` — where to add sendShippedEmail + sendDeliveredEmail
- `lib/send-order-emails.ts` — pattern for sendOrderConfirmationEmail (use same pattern)
- `components/pdp/ProductGallery.tsx` — where to wire MagnifierLens
- `lib/store/cartStore.ts` — where to add availableVariants + updateVariant

KEY FACTS
- Admin auth: `requireAdminAuth(request)` from `lib/admin-auth.ts` — real JWT only, no DEV_SESSION bypass
- Page-level auth for admin pages: `getServerSession(authOptions)` + check `session.user.isAdmin`
- Order status history table: created by migration `028_order_status_history.sql` (run this first)
- Email: uses Resend. Client at `lib/email.ts`. `sendOrderConfirmationEmail` is the existing pattern.
- `createAdminClient()` for server-side DB writes that bypass RLS. `createServerClient()` for user-scoped reads.
- Dev session pattern for customer-facing API routes: `process.env.NODE_ENV === 'development' ? DEV_SESSION : await getServerSession(authOptions)`
- No cron. No CRON_SECRET needed.

PHASE 4 SCOPE — 3 issues + 1 QA item

ITEM 1 (Issue 19) — Order status history + auto-emails

DB — supabase/migrations/028_order_status_history.sql:
  CREATE TABLE order_status_history (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE, from_status TEXT, to_status TEXT NOT NULL, changed_by TEXT, note TEXT, changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  CREATE INDEX idx_status_history_order ON order_status_history(order_id, changed_at DESC);

Edit app/api/admin/orders/[id]/route.ts (PATCH handler):
  - Read current fulfillment_status before update (as from_status)
  - After update: insert row into order_status_history with changed_by = 'admin:' + session.user.email
  - If processing→shipped: call sendShippedEmail(order)
  - If shipped→delivered: call sendDeliveredEmail(order)
  - De-dupe: skip email if same to_status has a history row for this order within last 1 hour
  - If setting to shipped: save tracking_number + courier from request body to orders row

Edit lib/email.ts:
  - Add sendShippedEmail(order) — subject "Your Possah order has shipped"
  - Add sendDeliveredEmail(order) — subject "Your Possah order was delivered"
  - Both: brand template style, match sendOrderConfirmationEmail pattern

Edit app/admin/orders/[id]/OrderDetailClient.tsx:
  - Fetch order_status_history on mount (or server-fetch and pass as prop)
  - Show "Status History" section: dot timeline, from→to, relative timestamp, changed_by
  - If setting to shipped: show inline tracking_number + courier inputs before Save
  - "Resend confirmation email" button (wired in ITEM 2)

ITEM 2 (Issue 16) — Resend confirmation + email preview tool

New file: app/api/admin/orders/[id]/resend-confirmation/route.ts
  POST. requireAdminAuth. Load order. Call sendOrderConfirmationEmail (from lib/send-order-emails.ts).
  Rate-limit: check order_status_history for to_status='confirmation_resent' within last 60s. If found: 429.
  Log resend as history row (to_status='confirmation_resent', changed_by='admin:email', note='Manual resend').
  Return { sent: true, to: customer_email } or error.

Edit app/admin/orders/[id]/OrderDetailClient.tsx:
  - Add [Resend confirmation email] button next to customer email field
  - Click → POST → toast "Sent to {email}" or error. Disabled 10s after click.

New file: app/admin/email-preview/page.tsx (client component)
  - Load 20 recent orders (client-fetch from /api/admin/orders or a dedicated endpoint)
  - Form: destination email input + order picker dropdown
  - "Send test" → POST /api/admin/email-preview → show result inline

New file: app/api/admin/email-preview/route.ts
  POST. requireAdminAuth. Load order by id. Send email to override email (not order's email).
  Add Resend tag { name: 'test', value: 'true' }. Do NOT set confirmation_email_sent_at. Return { sent: true, to }.

ITEM 3 (Issue 8) — Hover magnifier on PDP

New file: components/pdp/MagnifierLens.tsx (client component)
  Props: src, alt, zoom? (default 2)
  - On mount: check (hover: hover) and (pointer: fine). If false → render plain <Image>, skip magnifier.
  - If hover: wrap in relative container cursor-crosshair. On mousemove → rAF → update zoomed panel background-position. Panel: 180x220px, absolute, right of image. background-size: 200%. Hidden on mouseleave.
  - Click still opens existing lightbox (don't break).
  - Use useRef for rAF id. Cancel on cleanup.

Edit components/pdp/ProductGallery.tsx:
  - Import MagnifierLens. Wrap main displayed image.
  - Pass src={currentImage.url} alt={...}

G8 (QA) — Cart size swap

Edit lib/store/cartStore.ts:
  - Add availableVariants: { variantId: string; size: string; stock_qty: number }[] to cart item type
  - Add updateVariant(itemId: string, newVariantId: string, newSize: string) action

Edit components/cart/CartView.tsx:
  - For each cart line item with availableVariants.length > 1: show <select> of sizes
  - On change → cartStore.updateVariant(item.id, newVariantId, newSize)
  - Show only in-stock variants (filter stock_qty > 0, keep current even if 0)

Edit wherever addToCart is called (find in ProductInfo.tsx or similar):
  - Pass availableVariants: product.variants.map(v => ({ variantId: v.id, size: v.size, stock_qty: v.stock_qty }))

VERIFICATION
npx tsc --noEmit must pass clean.
Walk through:
- Admin order detail: change status to shipped → history row appears in timeline → customer gets shipped email (check Resend dashboard)
- Same transition within 1 hour → no second email
- Resend confirmation button → email delivered → toast confirms
- /admin/email-preview → pick order → send test → visible in Resend tagged test=true
- PDP desktop: hover over main image → zoomed panel appears following cursor
- PDP mobile: tap → lightbox as before
- Cart: item with multiple sizes shows size <select>. Change → cart updates size.

After phase ships: update docs/EXEC_PLAN_2026_06_11.md Phase 4 status, create docs/HANDOVER_PHASE4_TO_PHASE5.md.
--- END PROMPT ---
```
