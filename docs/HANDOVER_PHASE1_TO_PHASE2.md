# Possah — Phase 1 Summary + Phase 2 Continuation Prompt

**Date:** 2026-06-11
**Status:** Phase 1 shipped. Phase 2 ready to start.
**Reference:** Full plan at `docs/EXEC_PLAN_2026_06_11.md`.

---

## PART A — Plan summary

### Goal
Fix 21 issues from DEN's punch list. Split into 5 phases, low-risk first, DB-changing last.

### The 21 issues by phase

**Phase 1 — DONE (foundation, no DB risk)**
1. ISSUE 6 — Lucknow → Bengaluru everywhere
2. ISSUE 7 — Favicon
3. ISSUE 9 — Footer category matrix layout
4. ISSUE 11 — Festive page smooth scroll
5. ISSUE 13 — Size guide mobile sticky column
6. ISSUE 17 — Orders link in header + mobile drawer

**Phase 2 — NEXT (customer order experience)**
7. ISSUE 1 — Delete order with X (soft-hide, cancelled/unpaid only) — needs migration 025
8. ISSUE 2 — Order list progress bar + new detail page
9. ISSUE 14 — Paid vs incomplete sections + retry payment flow + admin "Attempted" tab
10. ISSUE 20 — Blank space audit across all order-related pages

**Phase 3 — account + checkout polish**
11. ISSUE 3 + 4 + 5 — Address book (migration 026)
12. ISSUE 18 — Homepage image upload to R2
13. ISSUE 21 — Admin products category filter + sort

**Phase 4 — admin tooling + status flow**
14. ISSUE 19 — Status update polish + history table + auto-emails (migration 028)
15. ISSUE 16 — Resend confirmation button + dev preview tool
16. ISSUE 8 — Hover magnifier on PDP

**Phase 5 — performance, SEO, DB cleanup**
17. ISSUE 10 — SEO (JSON-LD, meta, sitemap, alts)
18. ISSUE 12 — Speed (code-split, AVIF only if helps)
19. ISSUE 15 — DB field audit + migration 027 (after sign-off)

### What was decided (Phase 1 Q&A locked these)

- **Delete order X:** only cancelled/unpaid; soft-hide via `customer_hidden_at` column.
- **Address book:** auto-save first checkout as default; prefill next; add/edit/delete in account; pick at checkout.
- **Unpaid orders:** customer-side ask user to retry or cancel ("cross it"). Admin gets new "Attempted" tab. Revenue stat excludes non-paid.
- **Order access:** header account hover dropdown + mobile drawer footer link.
- **Zoom:** hover magnifier on desktop, keep lightbox for mobile (touch).
- **Image upload:** Cloudflare R2 (existing `lib/r2.ts`).
- **Footer:** real city is **Bengaluru** (not Lucknow). Categories rearranged into matrix, NOT trimmed.
- **Resend testing:** both admin resend button + dev preview tool.
- **DB cleanup:** Claude audits + proposes, drops obvious unused after sign-off.
- **Speed/SEO:** bundle code-split + SEO meta/JSON-LD/alts. AVIF only if it helps.
- **Mobile/festive/admin/status:** audit and propose per item before changing.

### Atelier address (single source of truth)
> Shop No. 1, Ground Floor, No. 30, 1st Main Road, Behind Maharaja Furniture Store, Munireddy Layout, Horamavu, Bengaluru, Karnataka 560113, India

### Open questions still blocking later phases
1. Clean source logo file confirmed (using `public/images/logo.png` for now — favicon set already generated, but if a vector logo exists, regenerate).
2. "Interesting" SEO copy — DEN writes brand voice descriptions, or Claude drafts for review?
3. Festive page — only smooth anchor jumps (done), or also staggered fade-in reveals?
4. Status emails — tone + content for "shipped" and "delivered" emails. Review-request link target.
5. DB drops — accept rename-first-then-drop (1 week) vs immediate drop.

### Files touched in Phase 1
- `components/layout/Footer.tsx` — full rewrite
- `components/layout/Header.tsx` — account dropdown added
- `components/layout/MobileNav.tsx` — My Orders link added
- `app/(shop)/festive/page.tsx` — `scrollMarginTop: 112px` on `#products`
- `app/(shop)/size-guide/page.tsx` — sticky SIZE column + mobile hint
- `styles/globals.css` — `.anchor-offset` + `:target { scroll-margin-top }`
- `lib/email.ts` — Bengaluru address in email footer
- `app/(shop)/cart/CartView.tsx` — Bengaluru in "Ethically Made"
- `app/admin/products/ProductForm.tsx` — Bengaluru placeholders
- `app/(shop)/made-to-measure/page.tsx` — Bengaluru atelier mention
- `tests/integration/orders-create.test.ts` — Bengaluru fixture
- `tests/e2e/checkout.spec.ts` — Bengaluru fixture
- `app/favicon.ico` (new), `app/icon.png` (new), `app/apple-icon.png` (new)

`npx tsc --noEmit` clean. ESLint clean.

---

## PART B — Phase 2 continuation prompt (paste into Claude Code)

Copy from the `--- BEGIN PROMPT ---` line below to `--- END PROMPT ---` and paste into Claude Code at the root of `Possah_1.0`.

```
--- BEGIN PROMPT ---
You are continuing Possah e-commerce work from Phase 1 of a 5-phase plan.
Project rules:
- Talk like caveman. No filler, no pleasantries, no hedging.
- Code always complete, production-ready. No partial output, no skeleton.
- All edge cases included: loading, error, empty state.
- Don't repeat code already written; reference by name.
- Quality > token cost.

CONTEXT
Full execution plan lives at `docs/EXEC_PLAN_2026_06_11.md`. Read it first.
Phase 1 handover at `docs/HANDOVER_PHASE1_TO_PHASE2.md`. Read it too.
Phase 1 (Lucknow→Bengaluru sweep, favicon, footer matrix, festive scroll, size-guide mobile, orders link in header+drawer) is shipped. Verify by running `npx tsc --noEmit` before starting.

PHASE 2 SCOPE — customer-facing order experience
Execute these four items in order, with the locked decisions below.

ITEM 1 (Issue 1) — Soft-hide orders with X button
- New migration `supabase/migrations/025_orders_customer_hidden.sql`:
  ALTER TABLE orders ADD COLUMN customer_hidden_at TIMESTAMPTZ NULL;
  CREATE INDEX idx_orders_customer_hidden ON orders(customer_email, customer_hidden_at);
- New API: `app/api/orders/hide/route.ts`. POST { order_number }. Auth: session.user.email must match orders.customer_email. Reject if payment_status='paid' AND fulfillment_status NOT IN ('cancelled','unfulfilled'). Set customer_hidden_at=NOW().
- Edit `app/(shop)/account/orders/page.tsx` getOrders to add `.is('customer_hidden_at', null)`.
- New client component `components/account/OrderCardActions.tsx`: X button top-right of card. Only renders when payment_status IN ('pending','failed','refunded') OR fulfillment_status='cancelled'. Confirm modal "Hide order #X?" before delete. Optimistic UI + router.refresh().

ITEM 2 (Issue 2) — Order list progress bar + new detail page
- New component `components/account/OrderProgressBar.tsx` (server). Steps: Placed → Confirmed (paid) → Processing → Shipped → Delivered. Current step filled green, future grey. Cancelled = full red stripe instead of steps.
- Edit `app/(shop)/account/orders/page.tsx`: each card gets mini horizontal 5-dot progress bar under the badge.
- New page `app/(shop)/account/orders/[orderNumber]/page.tsx`: full detail.
  - Big progress bar with step labels + ETA per step (compute from created_at + courier estimate).
  - Tracking info if tracking_number set, link to courier site.
  - Line items with thumbnails, colour, size, qty, price.
  - Shipping address block.
  - Payment breakdown: subtotal, shipping, discount, gift, total, payment_status badge.
  - "Need help?" CTA → /contact?order=NUMBER.
  - "Hide order" button if eligible (reuse Item 1 API).
  - 404 if order_number not found or customer_email mismatch.
- Repoint "Details" link in list from `/order/confirmation?order=...` to `/account/orders/[orderNumber]`. Keep confirmation page for immediate post-checkout only.

ITEM 3 (Issue 14) — Paid vs incomplete + retry + admin Attempted tab
- Customer `/account/orders/page.tsx`: render two sections.
  - Top: orders with payment_status='paid'. Normal cards + progress bar.
  - Bottom (only if any exist): heading "Payment incomplete". Orders with payment_status IN ('pending','failed') AND fulfillment_status NOT IN ('cancelled'). Each row shows order#, items, amount, two CTAs: [Retry payment] + [Cancel] (sets fulfillment_status='cancelled' then soft-hide).
  - Cancelled hidden via Item 1 X.
- Retry endpoint: `app/api/orders/[orderNumber]/retry-payment/route.ts`. Re-creates Razorpay order for same total. Returns new razorpay_order_id. Client opens Razorpay modal with that id.
- Cancel endpoint: `app/api/orders/[orderNumber]/cancel/route.ts`. Sets fulfillment_status='cancelled'. Auth gate same as hide.
- Admin `/admin/orders/page.tsx`: add "Attempted" tab to TABS array, between "All" and "Unfulfilled". Filter: payment_status IN ('pending','failed') AND created_at > NOW() - INTERVAL '14 days'.
- Audit and patch: find where the admin dashboard's revenue widget is computed (likely `app/admin/page.tsx`). Filter to payment_status='paid' only. CSV export also respects the filter.

ITEM 4 (Issue 20) — Blank space audit and tighten
- Screenshot at 1440px + 375px for: `/account/orders`, `/account/orders/[orderNumber]` (the new one), `/order/confirmation`, `/admin/orders`, `/admin/orders/[id]`.
- Output `docs/ORDER_PAGE_SPACING.md`: list gaps >40px without grouping intent.
- Tighten by removing excess py-/mb-/gap-. Keep brand 8/16/24/40 rhythm.

VERIFICATION
After all four items: `npx tsc --noEmit` must pass clean. Run `npx eslint --quiet <touched files>` clean. Manually walk through:
  - guest user → orders page redirects to signin
  - logged-in user with 0 orders → empty state
  - logged-in user with paid + pending + cancelled → 2 sections, X on right ones only
  - click order → detail page → progress bar correct → tracking visible if shipped
  - retry pending order → Razorpay opens with new order id
  - admin → Attempted tab shows pending/failed only
  - admin revenue widget → excludes non-paid

RULES OF EXECUTION
- Caveman talk in summaries. Complete code in files.
- Use TaskCreate/TaskUpdate for the 4 items + verification.
- Ask DEN via AskUserQuestion if you hit ambiguity not covered above.
- Read existing files before editing.
- Don't touch other phases' scope.
- All new files in TypeScript, follow existing style (inline style objects, var(--color-*) tokens, no emojis unless requested).
- All API routes: server-side input validation, error handling, structured logging via existing patterns (look at `app/api/orders/create/route.ts` for the pattern).

START by reading `docs/EXEC_PLAN_2026_06_11.md` and `docs/HANDOVER_PHASE1_TO_PHASE2.md` in full, then `app/(shop)/account/orders/page.tsx`, `app/api/orders/create/route.ts`, `app/admin/orders/page.tsx`, `app/admin/orders/[id]/OrderDetailClient.tsx`, and `supabase/migrations/003_orders.sql`. Then create the migration first, then API routes, then UI.
--- END PROMPT ---
```

---

## Notes for whoever runs Phase 2

- The dev session fallback in `app/(shop)/account/orders/page.tsx` line 50 uses `dev@thepossah.com` when `NODE_ENV === 'development'`. Keep that pattern in any new auth-gated endpoint.
- `useCartStore` and `useCouponStore` patterns live in `lib/store/`. Use them for retry-payment client flow.
- Razorpay init helper is in `app/(shop)/checkout/CheckoutForm.tsx` — extract to shared util when retry-payment needs it.
- Tests live in `tests/integration/` and `tests/e2e/`. Add at least one integration test per new API route.

---

## Phase 2 complete — see `docs/HANDOVER_PHASE2_TO_PHASE3.md`

Shipped: 2026-06-12. All 6 Phase 2 items delivered. Delivery notes: `docs/PHASE2_DELIVERY.md`.
**IMPORTANT:** Run `supabase/migrations/025_orders_pending_dedupe_schema.sql` in Supabase SQL Editor before testing Phase 2 features.
