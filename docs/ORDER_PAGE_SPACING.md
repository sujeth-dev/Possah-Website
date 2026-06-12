# Order pages — blank-space audit (Phase 2.12)

**Scope:** all customer + admin pages that render order data. Goal: cut dead
space without compromising the brand's airy rhythm. Target spacing tokens are
8, 16, 24, 40, 64 — anything in between is suspect.

## Pages audited

1. `app/(shop)/account/orders/page.tsx` — customer list (paid + incomplete sections)
2. `app/(shop)/account/orders/[orderNumber]/page.tsx` — customer detail (Phase 2.9)
3. `app/(shop)/order/confirmation/page.tsx` — post-checkout confirmation
4. `app/admin/orders/page.tsx` — admin list with tabs + filters
5. `app/admin/orders/[id]/page.tsx` — admin order detail

## Findings + edits

### Customer list (`/account/orders`)

- **Before edits:** outer `py-12 pb-24` + `mb-10` on title left ~96px between
  hero and first card on desktop. Empty state used `py-24 text-center`
  alongside `py-12` body padding — double dead space.
- **Applied this phase:**
  - Outer padding `py-12 pb-24` → `py-10 pb-20` (saves 16px each end).
  - Title `mb-10` → `mb-8` (saves 8px).
  - Back-to-account row `mb-8` → `mb-6` (saves 8px above title).
  - Incomplete section heading + lede block tightened: `mb-3` + `mb-4` are
    intentional grouping (caption → explanation → list), under 40px combined.
- **Mobile:** card padding `p-5` keeps thumb-target rhythm; no change needed.

### Customer detail (`/account/orders/[orderNumber]`)

Shipped this phase, already built lean:
- Outer `py-10 pb-24` (10/24 — not 12/24).
- Progress bar wrapper `py-6` not `py-12`.
- Two-column grid `gap-8 lg:gap-12` (24/40 tokens, no 32px outliers).
- Help row uses `gap-4 pt-2` to anchor to the items list above.

### Post-checkout confirmation (`/order/confirmation`)

- **Pre-existing layout** untouched in Phase 2 (no functional changes there).
- Single deviation found: between the order-number block and the "what's
  next" steps, the original card-shadow + 48px gap doubles up. Flagging this
  for a follow-up sweep in Phase 4 alongside the email-template touch-up.
  No change applied this phase to avoid coupling unrelated edits.

### Admin list (`/admin/orders`)

- **Before edits:** `mb-6` header + 12px filter pad + 16px gap to status tabs
  + 16px gap to table = ~60px between H1 and first row. Acceptable for admin
  density but the tabs row had no `flex-wrap`, so the new 7-tab layout
  (Attempted added) would have overflowed at <1100px.
- **Applied this phase:** Status tabs container gets `flexWrap: 'wrap'` so
  the additional Attempted tab line-wraps on narrow viewports without forcing
  horizontal scroll on the whole page.
- Other gaps inside the admin table left alone — admin density is correct.

### Admin detail (`/admin/orders/[id]`)

- Audited the existing OrderDetailClient layout. The section gaps follow the
  16/24 token rule. No bleeding dead space identified.
- The fulfilment-status update block + tracking-input block share a `gap-4`
  vertical rhythm that's intentional grouping.
- Flagged for Phase 4 (status history table): when the history feed lands
  below the status controls, ensure it sits on a 24px gap below the controls,
  not the 40px the current placeholder hints at.

## Rules of thumb captured for future edits

- Title `mb-` rule: 8 (within section), 24 (between sections), 40 (between
  major regions). Never 12, never 20.
- Card outer padding: `p-5` (20px) for customer cards, `p-6 md:p-8` (24/32)
  for admin chrome.
- Section grid gaps: `gap-4` for sub-list, `gap-6` for sibling sections,
  `gap-8` for column splits, `gap-10/12` for two-column desktop layouts.
- Always pair the section heading's `mb-` with the next sibling's first
  visible padding — never stack `mb-12` + `py-12`.

## What stays untouched

- Brand 8/16/24/40 rhythm — anywhere this was already correct.
- Mobile padding under 16px never tightened further (thumb targets matter).
- `container-site` outer constraint left alone.
