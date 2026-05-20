# Phase 2 — Admin Dashboard: Complete

**Completed:** May 2026  
**Status:** ✅ All steps 2.1 → 2.10 done. Deploy-ready.

---

## What was built

### Step 2.1 — Admin Layout + Sidebar
- `app/admin/layout.tsx` — server component, passes `isDev` to client
- `components/admin/AdminLayoutClient.tsx` — mobile sidebar state, dev banner
- `components/admin/AdminSidebar.tsx` — 240px deep green sidebar, 10 nav items, active state, mobile drawer

### Step 2.2 — Dashboard Home
- `app/admin/page.tsx` — 4 stat cards, quick links, last 10 orders table
- `components/admin/AdminStatCard.tsx` — reusable stat card
- `components/admin/FulfillmentBadge.tsx` — `FulfillmentBadge` + `PaymentBadge` components

### Step 2.3 — Product Management
- `app/api/admin/products/route.ts` — GET (list, search, pagination) + POST (create)
- `app/api/admin/products/[id]/route.ts` — GET + PATCH + DELETE (soft)
- `app/admin/products/page.tsx` — list: search, pagination, stock colour-coding
- `app/admin/products/ProductListActions.tsx` — active toggle + soft delete
- `app/admin/products/ProductForm.tsx` — full product form: all fields, variants, images, audio, craft story, SEO, badges
- `app/admin/products/new/page.tsx` — new product page
- `app/admin/products/[id]/edit/page.tsx` — edit page with pre-filled data

### Step 2.4 — Category Management
- `app/api/admin/categories/route.ts` — GET + POST + PATCH (bulk reorder)
- `app/api/admin/categories/[id]/route.ts` — PATCH + DELETE (guarded)
- `app/admin/categories/page.tsx` — category list with product counts
- `app/admin/categories/CategoryManager.tsx` — drag-and-drop reorder + add/edit modal

### Step 2.5 — Order Management
- `app/api/admin/orders/route.ts` — GET (filters, search, date range, pagination, CSV export)
- `app/api/admin/orders/[id]/route.ts` — GET + PATCH (fulfillment fields only)
- `app/admin/orders/page.tsx` — list: status tabs, search, date range, CSV, pagination
- `app/admin/orders/[id]/page.tsx` — detail: customer, shipping address, line items, payment info, gift message
- `app/admin/orders/[id]/OrderDetailClient.tsx` — fulfillment dropdown (saves on change), tracking, notes

### Step 2.6 — Homepage Configuration
- `app/api/admin/homepage/route.ts` — GET + PATCH (singleton upsert)
- `app/admin/homepage/page.tsx` — loads config + all active products
- `app/admin/homepage/HomepageEditor.tsx` — 4 sections: hero slides (reorderable), collection banner, new arrivals picker, 8 occasion tiles

### Step 2.7 — Coupon Management
- `app/api/admin/coupons/route.ts` — GET + POST (uniqueness check)
- `app/api/admin/coupons/[id]/route.ts` — PATCH + DELETE
- `app/admin/coupons/page.tsx` — coupon list
- `app/admin/coupons/CouponManager.tsx` — add form, active toggle, expiry detection, hard delete

### Step 2.8 — Review Moderation
- `app/api/admin/reviews/route.ts` — GET (filtered) + PATCH (bulk approve)
- `app/api/admin/reviews/[id]/route.ts` — PATCH (approve/reject) + DELETE
- `app/admin/reviews/page.tsx` — review list by status
- `app/admin/reviews/ReviewManager.tsx` — pending/approved tabs, bulk select + approve, individual actions

### Step 2.9 — Journal Management
- `app/api/admin/journal/route.ts` — GET + POST (slug uniqueness)
- `app/api/admin/journal/[id]/route.ts` — GET + PATCH + DELETE
- `app/admin/journal/page.tsx` — article list with draft/published status
- `app/admin/journal/new/page.tsx` — new article page
- `app/admin/journal/[id]/edit/page.tsx` — edit page with pre-filled data
- `app/admin/journal/ArticleForm.tsx` — full article form: title, slug (auto), category, author, featured image, body (markdown textarea), publishing, is_featured

### Step 2.10 — Media Library + Settings
- `app/api/admin/settings/route.ts` — GET + PATCH (singleton upsert)
- `app/admin/settings/page.tsx` — settings page
- `app/admin/settings/SettingsEditor.tsx` — store settings + SEO defaults, saves per section
- `app/admin/media/page.tsx` — lists Supabase Storage bucket `possah-media`
- `app/admin/media/MediaLibrary.tsx` — drag-drop upload, grid/list views, copy URL, delete; uses `createClientComponentClient` for browser uploads direct to Supabase Storage

### Database
- `supabase/migrations/015_store_settings.sql` — singleton `store_settings` table with RLS
- `lib/supabase/types.ts` — added `store_settings` type

---

## Security model

| Rule | Implementation |
|------|---------------|
| Dev bypass | `NODE_ENV === 'development'` in every route handler + middleware |
| Prod auth | Checks `next-auth.session-token` / `__Secure-next-auth.session-token` cookie |
| payment_status | Never touched by admin — order detail PATCH schema explicitly excludes it |
| Soft delete | Products only: `is_active = false` |
| Hard delete | Categories (guarded by active product count), coupons, reviews, journal articles |
| Zod validation | Every POST/PATCH body validated before DB write |
| Slug uniqueness | Enforced on coupon codes and journal article slugs at API layer |

---

## Deploy checklist

### Supabase
- [ ] Run migration `015_store_settings.sql`
- [ ] Create Storage bucket `possah-media` → set to **Public**
- [ ] Set bucket file size limit to 10 MB
- [ ] Enable RLS policy on `store_settings` (already in migration)
- [ ] Confirm all tables from Phase 1 migrations exist

### Environment (production)
```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=strong_random_secret_min_32_chars
NEXTAUTH_URL=https://thepossah.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=re_...
```

### Admin user
- Insert a row into `admin_users` with `role = 'super_admin'` and a bcrypt-hashed password before going live.

---

## End-to-end test checklist (run before deploy)

### Products
- [ ] Create product with all fields → appears on `/products/[slug]`
- [ ] Toggle "New Arrival" → audio section appears
- [ ] Upload audio URL → audio player visible on PDP
- [ ] Toggle active off → product disappears from shop
- [ ] Edit product → all fields pre-populated correctly
- [ ] Soft delete → product gone from list + shop, row still in DB

### Categories
- [ ] Create category → appears in nav
- [ ] Drag reorder → order persists on page refresh
- [ ] Delete category with 0 products → succeeds
- [ ] Delete category with active products → blocked with error message

### Orders
- [ ] Submit test order from checkout → appears in admin orders list
- [ ] Change fulfillment status → badge updates immediately
- [ ] Add tracking number + courier → save persists on refresh
- [ ] Export CSV → file downloads with correct columns
- [ ] Search by order number and customer name both work

### Homepage
- [ ] Edit hero headline → visit `/` → headline updated
- [ ] Add slide → reorder → order reflected
- [ ] Change occasion tile label → visible on homepage

### Coupons
- [ ] Create 10% off coupon → apply at cart → discount shows
- [ ] Usage count increments after each use
- [ ] Expired coupon shows "(expired)" in admin
- [ ] Duplicate code → 409 error shown

### Reviews
- [ ] Submit review on PDP → doesn't appear on PDP
- [ ] Approve in admin → appears on PDP
- [ ] Bulk approve 3 reviews → all approved
- [ ] Unapprove → disappears from PDP

### Journal
- [ ] Create article → save draft → doesn't appear at `/journal`
- [ ] Publish → appears at `/journal` and `/journal/[slug]`
- [ ] Edit article → changes persist
- [ ] Featured toggle → featured badge shows in admin list

### Media
- [ ] Upload image → appears in grid
- [ ] Copy URL → URL in clipboard is valid and loads image
- [ ] Delete → removed from grid and bucket

### Settings
- [ ] Change announcement bar text → refresh homepage → new text shows
- [ ] Change WhatsApp number → all WA links use new number
- [ ] Change SEO title → visible in `<title>` on pages with no specific meta

### Mobile admin
- [ ] Sidebar collapses on < 768px
- [ ] Hamburger opens drawer
- [ ] Tables scroll horizontally on mobile
- [ ] All forms usable on touch

---

## What's next — Phase 3

- [ ] Razorpay: real payment flow (create order → verify webhook → update payment_status)
- [ ] Google OAuth: real login flow for shop customers
- [ ] User accounts: order history, saved addresses, measurements
- [ ] Rate limiting on `/api/payments/*`, `/api/auth/*`, `/api/orders/*`
- [ ] Supabase RLS on all public-facing tables
- [ ] Production deployment (Vercel or Cloudflare Pages)
- [ ] Lighthouse audit: all core pages > 90 mobile
