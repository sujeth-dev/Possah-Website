# Possah — Phase 2 Summary + Phase 3 Continuation Prompt

**Date:** 2026-06-12
**Status:** Phase 2 shipped. Phase 3 ready to start.
**Reference:** Full execution plan at `docs/EXEC_PLAN_2026_06_11.md`.

---

## PART A — What phases 1 and 2 delivered

### Phase 1 — Foundation fixes (commit `4ce2da1`)
1. ISSUE 6 — Lucknow → Bengaluru everywhere (footer, emails, forms)
2. ISSUE 7 — Favicon set (ico, png, apple-icon)
3. ISSUE 9 — Footer category matrix layout
4. ISSUE 11 — Festive page smooth scroll + scroll-margin-top
5. ISSUE 13 — Size guide mobile sticky SIZE column
6. ISSUE 17 — My Orders link in header dropdown + mobile drawer

### Phase 2 — Customer order experience (commits `be0bd9d` + `f9a8ff9` + `91c8f16`)
1. **Duplicate-order kill** — one open pending per customer; lazy expiry on each checkout attempt (no cron needed — handled inline in create route)
2. **Confirmation email post-payment** — email now fires in verify/webhook, not on order create
3. **Soft-hide orders (X)** — `customer_hidden_at` column + hide API
4. **Progress bar + detail page** — 5-step bar on list, full detail at `/account/orders/[orderNumber]`
5. **Paid vs Incomplete split + retry** — two sections on orders page, retry-payment + cancel endpoints
6. **Admin Attempted tab + revenue fix** — paid-only revenue stat, Abandoned(7d) card, Attempted tab

### Key architecture decisions locked in Phase 2
- Pending orders: one per customer email (unique partial index `one_pending_per_email`)
- Retry = update existing row, not new row — order_number stays stable
- Confirmation email: guarded by `confirmation_email_sent_at` to prevent duplicates across verify + webhook race
- Dev session mock: always reads `process.env.ADMIN_EMAIL` (never hardcoded email)
- **Lazy expiry** (no cron): `app/api/orders/create/route.ts` cancels expired pending rows inline on each new checkout

### ⚠️ MANUAL ACTION REQUIRED before Phase 2 features work in production

Run these SQL scripts in Supabase SQL Editor (in order):

1. `supabase/migrations/025_orders_pending_dedupe_schema.sql` — adds 5 columns + 3 indexes. Safe on live table.
2. `scripts/dedupe/01_preview.sql` — shows how many duplicate rows exist (read-only, no changes).
3. `scripts/dedupe/02_finalize.sql` — cancels duplicate pending rows + adds the unique partial index.

Until step 1 runs: `confirmation_email_sent_at` column doesn't exist → verify route may error on email send → no confirmation emails. Steps 2–3 clean up existing duplicates before the index is applied.

### Atelier address (single source of truth)
> Shop No. 1, Ground Floor, No. 30, 1st Main Road, Behind Maharaja Furniture Store, Munireddy Layout, Horamavu, Bengaluru, Karnataka 560113, India

### Files created in Phase 2
- `supabase/migrations/025_orders_pending_dedupe_schema.sql`
- `scripts/dedupe/01_preview.sql`, `02_finalize.sql`
- `lib/cart-fingerprint.ts`, `lib/send-order-emails.ts`, `lib/razorpay-client.ts`
- `app/api/orders/hide/route.ts`
- `app/api/orders/[orderNumber]/retry-payment/route.ts`
- `app/api/orders/[orderNumber]/cancel/route.ts`
- `app/(shop)/account/orders/[orderNumber]/page.tsx`
- `components/account/OrderProgressBar.tsx`, `OrderCardActions.tsx`, `IncompleteOrderCard.tsx`
- `docs/ORDER_PAGE_SPACING.md`

### Files edited in Phase 2
- `app/api/orders/create/route.ts` — upsert flow, lazy expiry
- `app/api/payments/verify/route.ts` — email on paid update
- `app/api/payments/webhook/route.ts` — same with de-dupe guard
- `app/(shop)/account/orders/page.tsx` — paid/incomplete split, mini progress bar, X actions
- `app/admin/orders/page.tsx` — Attempted tab
- `app/admin/page.tsx` — paid-only revenue, Abandoned(7d) stat
- `lib/database.types.ts` — new columns
- `lib/email.ts` — typo fix
- `vercel.json` — cron block removed (expiry is lazy)
- `.env.local.example` — no CRON_SECRET needed

### Open follow-ups for Phase 4+
- Status emails on shipped + delivered
- Order status history table (migration 028)
- Admin manual resend confirmation button
- DB field cleanup (Phase 5)

---

## PART B — Phase 3 continuation prompt

Copy from `--- BEGIN PROMPT ---` to `--- END PROMPT ---` and paste into Claude Code.

```
--- BEGIN PROMPT ---
You are continuing Possah e-commerce work. Phase 1 + Phase 2 are fully shipped.
Project rules:
- No filler. Complete code only. No partials.
- All edge cases: loading, error, empty state.
- Read existing files before editing.
- Don't touch out-of-scope files.

CONTEXT
Full plan: `docs/EXEC_PLAN_2026_06_11.md`. Read it.
Phase 2 handover: `docs/HANDOVER_PHASE2_TO_PHASE3.md`. Read it.
Phase 2 delivery: `docs/PHASE2_DELIVERY.md`. Read it.

KEY FACTS
- `user_addresses` table already exists (migration 006). Has: id, user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default, created_at. Migration 026 adds `delivery_notes` + unique partial index.
- `lib/r2.ts` exports: `r2Upload(path, buffer, contentType)` → returns public CDN URL. Use this for image upload.
- Dev session: always use `process.env.NODE_ENV === 'development' ? DEV_SESSION : await getServerSession(authOptions)` pattern from `lib/auth.ts`.
- No cron. Pending order expiry is lazy (inline in create route).
- Checkout form uses React Hook Form + Zod. Field component is inline in CheckoutForm.tsx.

PHASE 3 SCOPE — 3 items + pre-flight fixes

PRE-FLIGHT (ship first as small commit):
- Create `app/(shop)/privacy/page.tsx` and `app/(shop)/terms/page.tsx` (placeholder content, match /faq layout)
- Fix footer anchors: `/faq#shipping` → `/faq#faq-shipping-&-delivery`, add `id="atelier"` to about page atelier section
- Copy `public/images/logo.png` content to `public/images/logo-rp.png` (Razorpay logo)
- Add `onError` fallback (→ `/images/placeholder-product.jpg`) to broken images in bridal/page.tsx, festive/page.tsx, about/page.tsx

ITEM 1 (Issues 3+4+5) — Full address book

DB — new migration `supabase/migrations/026_addresses_default_unique.sql`:
  ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_user ON user_addresses(user_id) WHERE is_default = TRUE;

API (all session-gated, DEV_SESSION in dev):
  GET  /api/account/addresses — list user addresses, default first
  POST /api/account/addresses — create; if first OR is_default=true, unset others first
  PATCH /api/account/addresses/[id] — update; ownership check; if is_default=true, unset others
  DELETE /api/account/addresses/[id] — delete; if default, promote oldest remaining

UI:
  app/(shop)/account/addresses/page.tsx — server list component
  components/account/AddressCard.tsx — client (edit/delete/default actions)
  components/account/AddressForm.tsx — client (shared create/edit form)
  Edit app/(shop)/account/page.tsx — add Addresses to ACCOUNT_LINKS

Checkout integration (app/(shop)/checkout/CheckoutForm.tsx):
  - If logged in: fetch saved addresses on mount, show "Use saved address" picker above fields
  - Default pre-selected; clicking fills form fields
  - "Add new address" clears fields
  - On successful order: if no saved address matches typed address AND user logged in → POST silently with is_default=(savedAddresses.length===0)
  - Guest: no change
  - Also: add localStorage draft persistence — watch() → debounce 500ms → localStorage.setItem('possah-checkout-draft', ...). On mount: restore if found + show "Continue where you left off" banner. Clear on order success.

Address fields to save: label, full_name, phone, address_line1, address_line2, city, state, pincode, delivery_notes.

ITEM 2 (Issue 18) — Homepage image upload to R2

New API: app/api/admin/upload/route.ts
  POST multipart/form-data. Admin-auth gated.
  Accept: jpg/jpeg/png/webp/avif. Max 5MB. Validate content-type + size server-side.
  Path: uploads/homepage/{Date.now()}-{filename}
  Upload via r2Upload() from lib/r2.ts. Return { url }.

New component: components/admin/ImageUploadField.tsx (client)
  Props: label, value, onChange(url: string), aspectHint?
  Shows thumbnail if value set. "Upload image" → file picker → POST → onChange(url).
  URL text input as fallback (keep existing paste flow).
  Spinner + error banner during/after upload.

Edit app/admin/homepage/HomepageEditor.tsx:
  Replace every <Field label="Image URL" ...> with <ImageUploadField ...>.
  Sections: hero slides, collection banner, occasion tiles.

ITEM 3 (Issue 21) — Admin products category filter + sort

Edit app/admin/products/page.tsx:
  URL params: ?category=<category_id> and ?sort=<sort_key>
  Fetch categories at page load for dropdown (with product count per category)
  Sort options: newest (default), name_asc, price_asc, price_desc, stock_asc
  Extend query: .eq('category_id', category) and .order(...) based on sort
  Pagination resets to page 1 on filter change

VERIFICATION
npx tsc --noEmit must pass clean.
Walk through:
- Pre-flight: /privacy and /terms render. /faq#faq-shipping-&-delivery scrolls correctly. Razorpay modal shows logo. Bridal/festive/about pages don't show broken images.
- Address book: logged-in user → checkout → address saved. Second checkout → picker shows. /account/addresses → full CRUD works.
- localStorage draft: fill checkout halfway → navigate away → come back → form restores with banner.
- Image upload: admin → homepage → drag/click image → uploads to R2 → URL fills → save → live site shows image.
- Products filter: pick category → list narrows. Pick sort → re-orders. Combined with search.

RULES
- All new API routes: server-side input validation, error handling, structured logging (see app/api/orders/hide/route.ts for pattern).
- All new files: TypeScript, inline style objects with var(--color-*) tokens, no emojis.
- After phase ships: create docs/HANDOVER_PHASE3_TO_PHASE4.md with: status, manual actions, verification checklist, Phase 4 continuation prompt.
--- END PROMPT ---
```
