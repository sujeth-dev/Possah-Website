# The Possah — Master Project Document

**Version:** 1.1 — Phase 1 Complete  
**Last Updated:** May 2026  
**Project:** thepossah.com — Luxury Indian Fashion E-Commerce  
**Stack:** Next.js 14 · Supabase · Razorpay · Resend · Vercel / Cloudflare Pages

> **For humans:** Read top-to-bottom. Skip sections you know.  
> **For AI agents:** This document is the ground truth. When making any change — check the relevant section here first. Never assume a schema, route, or component interface — verify here. Section 12 lists everything not yet built.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Status — What's Done, What's Not](#2-current-status)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend — Pages & Routes](#4-frontend-pages--routes)
5. [Frontend — Components](#5-frontend-components)
6. [Backend — API Routes](#6-backend-api-routes)
7. [Database Schema](#7-database-schema)
8. [State Management](#8-state-management)
9. [Payment System](#9-payment-system)
10. [Authentication & Security](#10-authentication--security)
11. [SEO Implementation](#11-seo-implementation)
12. [Phase 2 — Admin Dashboard (Not Yet Built)](#12-phase-2--admin-dashboard-not-yet-built)
13. [Environment Variables](#13-environment-variables)
14. [Key Patterns & Rules](#14-key-patterns--rules)
15. [File Map](#15-file-map)

---

## 1. Project Overview

The Possah is a luxury Indian fashion e-commerce brand based in Lucknow. The website is a fully custom Next.js application — not a Shopify or WooCommerce template. Every page is pixel-faithful to the design mockups in `creatives/website/`.

**Brand positioning:** Editorial, woman-first, luxury Indian fashion. Sarees, lehengas, co-ords, dresses, kurta sets. Made-to-measure available.

**Business address:** The Possah Atelier, 14 Hanenganj Lane, Lucknow 226001, Uttar Pradesh, India

**Domain:** thepossah.com

**What the site does:**
- Customers browse, filter, and purchase fashion products
- Razorpay handles all payments (INR, UPI, cards, net banking)
- Order confirmations go out via Resend email
- Admin dashboard manages all content (Phase 2 — not yet built)
- Google OAuth for customer accounts (Phase 3 — not yet built)

---

## 2. Current Status

### ✅ Phase 1 — Complete (All public-facing pages)

Every customer-facing page is built, fully responsive, connected to Supabase, and production-ready.

| Area | Status | Notes |
|---|---|---|
| Homepage | ✅ Done | Hero slider, New Arrivals, Occasion grid, M2M CTA |
| Shop / Category pages | ✅ Done | Filters, sort, pagination, mobile drawer |
| Product Detail Page (PDP) | ✅ Done | Gallery, variants, audio player, reviews, related |
| Cart | ✅ Done | Zustand store, promo codes, gift wrap |
| Checkout | ✅ Done | Razorpay integration, form validation |
| Order Confirmation | ✅ Done | Post-payment page |
| About / Our Story | ✅ Done | Static editorial page |
| Bridal landing | ✅ Done | Occasion tiles, product grid, M2M CTA |
| Festive landing | ✅ Done | Occasion tiles, product grid |
| Made-to-Measure | ✅ Done | Process steps, pricing, WhatsApp CTA |
| Lookbook | ✅ Done | Grid of collections linked by ID |
| Journal / Blog list | ✅ Done | Featured article, article grid |
| Journal article | ✅ Done | Full article view |
| Search | ✅ Done | Full-text Supabase search |
| Wishlist | ✅ Done | Zustand store, guest + logged-in |
| Account / Orders | ✅ Done | Dev mock session; real OAuth = Phase 3 |
| Contact | ✅ Done | Form → Resend email |
| FAQ | ✅ Done | Tabbed accordion |
| Size Guide | ✅ Done | Static size chart |
| 404 | ✅ Done | Custom not-found page |
| sitemap.xml | ✅ Done | Dynamic — all products, categories, articles |
| robots.txt | ✅ Done | Blocks admin, api, cart, checkout, account |
| Razorpay payments | ✅ Done | Order create, modal, signature verify, webhook |
| Order confirmation email | ✅ Done | HTML email via Resend |
| All bugs fixed | ✅ Done | See bug audit below |

### Bug Audit — Fixed in Phase 1

These bugs were caught and fixed during the static audit:

| Bug | File | Fix |
|---|---|---|
| `ProductCardData` missing `category_slug` | `app/(shop)/page.tsx` | Added `category_slug: string` to interface + all 6 data-creation sites |
| Product URLs wrong (`/products/slug`) | `components/shop/ProductCard.tsx` | Changed to `/shop/${category_slug}/${slug}` |
| Cart/wishlist slug incomplete (just `slug`, no category prefix) | `ProductCard.tsx`, `ProductInfo.tsx` | Changed to `` `${category_slug}/${slug}` `` |
| `bridal/page.tsx` filtering on related table column (PostgREST can't do this) | `bridal/page.tsx` | Two-step query: get IDs from `product_tags`, then `.in('id', ids)` |
| `journal/page.tsx` using wrong DB columns | `journal/page.tsx` + `journal/[slug]/page.tsx` | Rewrote to match actual schema (`featured_image`, `published_at`, no `excerpt`) |
| `lookbook/page.tsx` using wrong DB columns | `lookbook/page.tsx` | Rewrote to match actual schema (`collection_name`, `chapter_number`, etc.) |
| `shop/[category]/page.tsx` — `size` and `sub_line` URL params parsed but never applied to query | `shop/[category]/page.tsx` | Wired both filters: size via two-step variant lookup, sub_line via direct `.eq()` |
| `ProductInfo.tsx` — `addToCart` slug was `product.slug` not full path | `ProductInfo.tsx` | Changed to `` `${product.category_slug}/${product.slug}` `` |
| `search/route.ts` — missing `categories (slug)` and `category_slug` in mapping | `search/route.ts` | Added both |

### ❌ Phase 2 — Not Built (Admin Dashboard)

See [Section 12](#12-phase-2--admin-dashboard-not-yet-built) for full spec.

### ❌ Phase 3 — Not Built (Accounts, Payments polish, SEO pass)

- Google OAuth real session (currently dev mock only)
- Wishlist sync: guest → account on login
- Saved measurements for M2M pre-fill
- Razorpay live key activation steps
- GA4 + Search Console setup
- Lighthouse audit & performance tuning

### ❌ Phase 4 — Not Built (Production deployment)

- Vercel / Cloudflare Pages production deploy
- DNS configuration
- Supabase RLS policies
- Admin user creation in `admin_users` table

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                         │
│                                                              │
│  React Client Components  ←→  Zustand Stores (cart, wish,  │
│  (checkout, filters,              mobile-filter)             │
│   product selection)                                         │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTP / Server Actions
┌───────────────▼──────────────────────────────────────────────┐
│               NEXT.JS 14 APP ROUTER (Server)                 │
│                                                              │
│  Server Components  → read DB directly (no API needed)       │
│  API Routes         → payment, orders, coupons, search       │
│  Middleware         → admin auth guard                       │
│                                                              │
│  Routes:                                                     │
│  app/(shop)/           ← all public pages                    │
│  app/api/              ← REST endpoints                      │
│  app/admin/            ← Phase 2, not yet built              │
└───────┬───────────────────────────┬──────────────────────────┘
        │                           │
┌───────▼────────┐        ┌────────▼────────────────────────┐
│   SUPABASE      │        │   EXTERNAL SERVICES              │
│   (PostgreSQL)  │        │                                  │
│                 │        │  Razorpay  — payments            │
│  14 tables      │        │  Resend    — transactional email │
│  PostgREST API  │        │  Google    — OAuth (Phase 3)     │
│  Storage        │        │  GA4       — analytics (Phase 4) │
└─────────────────┘        └──────────────────────────────────┘
```

### Rendering strategy

| Content type | Strategy | Why |
|---|---|---|
| Product pages | Server Components + `createServerClient()` | SEO — needs full HTML on first load |
| Category page | Server Component + URL-param filters | Shareable filtered URLs via server |
| Homepage | Server Component | SEO + editorial content |
| Cart, Checkout | Client Component | Zustand state, Razorpay modal |
| Wishlist | Client Component | Zustand store |
| Admin (Phase 2) | Client Components (data tables, forms) | Heavy interactivity |

### Data flow for a product page

```
User visits /shop/sarees/the-noor-saree
→ Next.js Server Component renders
→ createServerClient() creates Supabase client (uses cookie-based auth)
→ Supabase query fetches product + variants + reviews + related
→ Returns full HTML to browser (SSR — good for SEO)
→ Client hydrates — ProductGallery and ProductInfo become interactive
→ User clicks "Add to Bag" → Zustand cartStore.addItem() called
→ Cart icon count updates immediately (no server call)
→ User goes to /cart → cart state reads from Zustand
→ User submits → POST /api/orders/create → Razorpay order created
→ Razorpay modal opens → user pays
→ onSuccess fires → POST /api/payments/verify (HMAC check)
→ clearCart() → redirect to /order/confirmation
```

---

## 4. Frontend — Pages & Routes

All pages live under `app/(shop)/` using Next.js App Router. The `(shop)` route group applies the shared layout (Header + Footer + AnnouncementBar) without adding to the URL.

| Route | File | Type | Data Source |
|---|---|---|---|
| `/` | `app/(shop)/page.tsx` | Server | `products`, `homepage_config`, `categories` |
| `/shop/[category]` | `app/(shop)/shop/[category]/page.tsx` | Server | `categories`, `products`, `product_variants` |
| `/shop/[category]/[slug]` | `app/(shop)/shop/[category]/[slug]/page.tsx` | Server | `products`, `product_variants`, `reviews` |
| `/cart` | `app/(shop)/cart/page.tsx` | Client | Zustand `cartStore` |
| `/checkout` | `app/(shop)/checkout/page.tsx` + `CheckoutForm.tsx` | Client | Zustand + API |
| `/order/confirmation` | `app/(shop)/order/confirmation/page.tsx` | Client | URL params |
| `/about` | `app/(shop)/about/page.tsx` | Server | Static |
| `/bridal` | `app/(shop)/bridal/page.tsx` | Server | `product_tags`, `products` |
| `/festive` | `app/(shop)/festive/page.tsx` | Server | `products` |
| `/made-to-measure` | `app/(shop)/made-to-measure/page.tsx` | Server | Static |
| `/lookbook` | `app/(shop)/lookbook/page.tsx` | Server | `lookbooks` |
| `/journal` | `app/(shop)/journal/page.tsx` | Server | `journal_articles` |
| `/journal/[slug]` | `app/(shop)/journal/[slug]/page.tsx` | Server | `journal_articles` |
| `/search` | `app/(shop)/search/page.tsx` | Client | `GET /api/search` |
| `/wishlist` | `app/(shop)/wishlist/page.tsx` | Client | Zustand `wishlistStore` |
| `/account` | `app/(shop)/account/page.tsx` | Server | Dev mock / Phase 3 real |
| `/account/orders` | `app/(shop)/account/orders/page.tsx` | Server | Dev mock / Phase 3 real |
| `/contact` | `app/(shop)/contact/page.tsx` | Client | `POST /api/contact` |
| `/faq` | `app/(shop)/faq/page.tsx` | Server | Static |
| `/size-guide` | `app/(shop)/size-guide/page.tsx` | Server | Static |

### URL Pattern — Products

```
/shop/[category-slug]/[product-slug]
e.g. /shop/sarees/the-noor-saree
     /shop/lehengas/the-amber-lehenga
```

The `[category]` segment is the category `slug` column from the `categories` table.  
The `[slug]` segment is the product `slug` column from the `products` table.  
Both are unique. Product slug alone is sufficient to fetch the product — category in URL is for SEO and breadcrumbs only.

### Category slugs (seeded)

```
sarees · lehengas · co-ords · dresses · kurta-sets · separates
```

### Filter URL params — `/shop/[category]`

```
?occasion=Diwali       → post-filter on product_tags
?fabric=silk           → post-filter on product.fabric (ilike)
?size=M                → pre-filter via product_variants (two-step query)
?sub_line=THE+DRAPE    → direct .eq('sub_line', value)
?sort=newest           → created_at DESC (default)
?sort=price-asc        → price ASC
?sort=price-desc       → price DESC
?sort=bestselling      → is_top_selling=true + created_at DESC
?page=2                → pagination (PAGE_SIZE=24)
```

All params combine. Shareable URLs.

---

## 5. Frontend — Components

### Layout (`components/layout/`)

| Component | Purpose |
|---|---|
| `AnnouncementBar.tsx` | Green strip at top. "FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE" |
| `Header.tsx` | Desktop: centred logo + nav + icons. Mobile: symbol logo + hamburger + bag. Reads cart count from Zustand |
| `Footer.tsx` | Deep green bg, 4-column grid, social, payment badges |
| `MobileNav.tsx` | Full-screen overlay. Triggered by hamburger in Header |

### Homepage (`components/homepage/`)

| Component | Props | Purpose |
|---|---|---|
| `HeroSlider.tsx` | `slides: HeroSlide[]` | Full-screen editorial hero. Auto-advance + dot navigation |
| `CategorySplit.tsx` | — | Static 2-panel ethnic/western split |
| `CategoryCircles.tsx` | `categories: Category[]` | Circular image thumbnails, links to `/shop/[slug]` |
| `NewArrivals.tsx` | `products: ProductCardData[]` | 2-row product grid, "View All" |
| `CollectionBanner.tsx` | `banner: CollectionBannerData` | Full-width editorial image + CTA |
| `OccasionGrid.tsx` | `tiles: OccasionTile[]` | 8-tile occasion grid. Links to `/shop/sarees?occasion=[label]` |
| `MtmCta.tsx` | — | Made-to-Measure callout strip |

### Shop (`components/shop/`)

| Component | Props | Key behaviour |
|---|---|---|
| `ProductCard.tsx` | `product: ProductCardData` | Image → `/shop/${category_slug}/${slug}`. Hover shows Add to Bag. Cart/wishlist slug stored as `category_slug/slug` (full path) |
| `ProductGrid.tsx` | `products: ProductCardData[], columns: 2\|3\|4` | Responsive grid. Empty state with message |
| `FilterSidebar.tsx` | — | Reads/writes URL search params. Occasion, fabric, size, sub_line, sort |
| `MobileFilterDrawer.tsx` | — | Zustand `mobileFilterStore`. Renders FilterSidebar inside Radix Dialog |
| `SortBar.tsx` | `resultCount: number, showFilterButton?: boolean` | Result count + sort dropdown + "Filters" button on mobile |
| `YouMightAlsoLike.tsx` | `products: ProductCardData[], heading: string` | Horizontal scroll row |

### PDP (`components/pdp/`)

| Component | Props | Key behaviour |
|---|---|---|
| `ProductGallery.tsx` | `images: {url, alt}[], productName: string` | Desktop: primary + 4 thumbnails. Mobile: Swiper carousel |
| `ProductInfo.tsx` | `product: ProductInfoProduct, variants: Variant[]` | Colour swatches, size selector, Add to Bag, Wishlist. Cart slug: `` `${category_slug}/${slug}` `` |
| `CraftBehind.tsx` | `craftStory: string, imageUrl?: string, productName: string` | Editorial story section |
| `CompleteTheLook.tsx` | `products: ProductCardData[]` | 4-product horizontal row |
| `ReviewsSection.tsx` | `reviews[], averageRating: number, totalCount: number` | Star ratings + review list |

### UI (`components/ui/`)

| Component | Variants / Props |
|---|---|
| `Button.tsx` | `variant: 'primary'\|'secondary'\|'ghost'`, `size`, `href` or `onClick` |
| `Input.tsx` | `label`, `error`, `type`, full ref-forwarding |
| `Accordion.tsx` + `AccordionGroup.tsx` | `title`, `children`, `defaultOpen?` — Radix accordion |
| `Badge.tsx` | `variant: 'new'\|'sale'\|'low-stock'\|'delivered'` |
| `AudioPlayer.tsx` | `src: string` — "The Possah Note" — shows on `is_new_arrival` or `is_top_selling` products only |
| `Modal.tsx` | `open`, `onClose`, `title`, `children` — Radix Dialog |

### ProductCardData interface (canonical definition)

```typescript
// Defined in app/(shop)/page.tsx — imported everywhere else
export interface ProductCardData {
  id: string
  slug: string           // product slug only (e.g. "the-noor-saree")
  category_slug: string  // needed to build URLs (/shop/[category_slug]/[slug])
  name: string
  fabric: string | null
  price: number
  compare_price: number | null
  is_new_arrival: boolean
  is_top_selling: boolean
  images: { url: string; alt: string | null }[]
  tags: string[]         // from product_tags table
}
```

**Rule:** Every data-creation site that returns `ProductCardData[]` MUST include `categories (slug)` in its Supabase select and map to `category_slug`. There are 6 such sites: homepage, category page, PDP (two selects), festive page, bridal page, search route. All verified correct.

---

## 6. Backend — API Routes

All API routes live under `app/api/`. Every route validates input with Zod before touching the database. No raw string concatenation into queries.

### `GET /api/search`

Searches products by name, fabric, description using Supabase `ilike`.

**Input:** `?q=silk` (query string, min 2 chars)  
**Output:** `{ products: ProductCardData[] }`  
**Caching:** `s-maxage=60, stale-while-revalidate=300`  
**Max results:** 24

---

### `POST /api/orders/create`

Creates a Razorpay order and saves the order to the database. Called before the Razorpay modal opens.

**Input (Zod validated):**
```typescript
{
  contact: { first_name, last_name, email, phone }  // phone: /^[6-9]\d{9}$/
  address: { line1, line2?, city, state, pincode }  // pincode: /^\d{6}$/
  items: [{
    product_id: UUID
    variant_id: string
    name: string
    image: string
    price: number
    qty: number (1–10)
    colour: string
    size: string
  }]
  delivery_option: 'standard' | 'express'
  gift_wrap: boolean
  coupon_code: string | null
  notes: string
  subtotal: number
  shipping: number
  coupon_discount: number
  gift_wrap_cost: number
  total: number
}
```

**Output:**
```typescript
{
  success: true
  order_id: UUID            // internal DB id
  order_number: string      // e.g. "PSH-2026-4821"
  razorpay_order_id: string // e.g. "order_xxxxx"
  amount: number            // total in paise
}
```

**Server-side total check:** Recalculates `subtotal + shipping + gift_wrap - coupon`. Rejects if client total differs by more than ₹1.  
**Coupon re-validation:** Checks `coupons` table on every submit — prevents expired codes.  
**Email:** `sendOrderConfirmationEmail()` called non-blocking (`.catch(() => {})`) — email failure never blocks the order.

---

### `POST /api/payments/verify`

Verifies Razorpay payment HMAC signature server-side. Called immediately after Razorpay modal `onSuccess` fires. Webhook is the fallback if this fails.

**Input:**
```typescript
{
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  order_number: string
}
```

**Output:** `{ success: boolean }`

**What it does:**
1. HMAC-SHA256 verify using `RAZORPAY_KEY_SECRET`
2. `crypto.timingSafeEqual()` — constant-time comparison (prevents timing attacks)
3. Updates `orders.payment_status = 'paid'` only if currently `'pending'` (idempotent)

---

### `POST /api/payments/webhook`

Razorpay webhook handler. Backup to `/api/payments/verify`. Fires even if browser closes before redirect.

**Verification:** `x-razorpay-signature` header checked against `RAZORPAY_WEBHOOK_SECRET`.  
**Events handled:** `payment.captured` (mark paid, send email), `payment.failed` (mark failed)  
**Idempotent:** Won't overwrite already-paid orders.  
**Register in Razorpay Dashboard:** Settings → Webhooks → URL: `https://thepossah.com/api/payments/webhook`

---

### `POST /api/coupons/validate`

Validates a promo code at cart and checkout. Called client-side.

**Input:** `{ code: string, subtotal: number }`  
**Output:** `{ valid: boolean, discount_type: 'percent'|'fixed', discount_value: number, message: string }`  
**Checks:** Active status, expiry date, usage limit, minimum order value

---

### `POST /api/contact`

Sends contact form submissions to `hello@thepossah.com` via Resend.

**Input (Zod):** `{ name, phone, email, subject, message }`  
**Output:** `{ success: boolean }`

---

### `POST /api/auth/[...nextauth]`

NextAuth route for Google OAuth. Provider: Google. Configured in `lib/auth.ts`. Session strategy: JWT.  
In dev: admin routes bypass auth entirely (middleware). `/account` uses `DEV_SESSION` mock.  
In prod: Google login required for `/account`.

---

## 7. Database Schema

14 tables. All migrations in `supabase/migrations/`. Never edit a run migration — add a new numbered one.

### products

```
id                UUID PK
slug              TEXT UNIQUE NOT NULL
name              TEXT NOT NULL
description       TEXT
fabric            TEXT
craft_description TEXT
care_instructions TEXT
drape_guide       TEXT
price             NUMERIC(10,2) NOT NULL
compare_price     NUMERIC(10,2)
category_id       UUID → categories.id (FK)
sub_line          TEXT: 'THE DRAPE'|'THE EDIT'|'THE ATELIER'|'THE VAULT'
stock_qty         INTEGER DEFAULT 0
is_featured       BOOLEAN DEFAULT FALSE
is_new_arrival    BOOLEAN DEFAULT FALSE
is_top_selling    BOOLEAN DEFAULT FALSE
is_active         BOOLEAN DEFAULT TRUE
meta_title        TEXT
meta_description  TEXT
audio_url         TEXT               ← "The Possah Note" audio file
craft_story_title TEXT
craft_story_body  TEXT
craft_story_image TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### product_variants (not a migration file — verify in Supabase)

```
id           UUID PK
product_id   UUID → products.id
colour_name  TEXT
colour_hex   TEXT
size         TEXT: 'XS'|'S'|'M'|'L'|'XL'|'XXL'|'Free Size'|'Made-to-Measure'
stock_qty    INTEGER
```

### product_images

```
id         UUID PK
product_id UUID → products.id
url        TEXT
alt        TEXT
position   INTEGER    ← sort order for gallery
```

### product_tags

```
id         UUID PK
product_id UUID → products.id
tag        TEXT    ← e.g. 'Diwali', 'Wedding', 'Mehendi', 'Sangeet', 'Haldi', 'Eid', 'Navratri'
```

**PostgREST filtering rule:** Cannot use `.in('product_tags.tag', [...])` or `.eq('product_tags.tag', ...)` in a join. Must use two-step: first query `product_tags` for product IDs, then `.in('id', productIds)` on `products`. See `bridal/page.tsx` for reference implementation.

### categories

```
id             UUID PK
name           TEXT NOT NULL
slug           TEXT UNIQUE NOT NULL
parent_id      UUID → categories.id (self-ref, nullable)
hero_image_url TEXT
nav_section    TEXT    ← e.g. 'Women > Ethnic'
position       INTEGER DEFAULT 0
created_at     TIMESTAMPTZ
```

**Seeded slugs:** `sarees`, `lehengas`, `co-ords`, `dresses`, `kurta-sets`, `separates`

### orders

```
id                 UUID PK
order_number       TEXT UNIQUE NOT NULL    ← format: PSH-YYYY-XXXX
customer_name      TEXT NOT NULL
customer_email     TEXT NOT NULL
customer_phone     TEXT NOT NULL
shipping_address   JSONB {line1, line2, city, state, pincode}
line_items         JSONB [{product_id, variant_id, name, image, price, qty, colour, size}]
subtotal           NUMERIC(10,2)
shipping_fee       NUMERIC(10,2)
discount_amount    NUMERIC(10,2)
coupon_code        TEXT
tax                NUMERIC(10,2)
total              NUMERIC(10,2)
payment_status     TEXT: 'pending'|'paid'|'failed'|'refunded'
fulfillment_status TEXT: 'unfulfilled'|'processing'|'shipped'|'delivered'|'cancelled'
payment_gateway    TEXT
gateway_order_id   TEXT    ← Razorpay order_id (set at order creation)
gateway_payment_id TEXT    ← Razorpay payment_id (set after payment)
tracking_number    TEXT
courier            TEXT
internal_notes     TEXT
is_gift            BOOLEAN DEFAULT FALSE
gift_message       TEXT
created_at         TIMESTAMPTZ
```

### coupons

```
id              UUID PK
code            TEXT UNIQUE NOT NULL    ← uppercase
type            TEXT: 'percent'|'flat'|'free_shipping'
value           NUMERIC(10,2)
min_order_value NUMERIC(10,2) DEFAULT 0
expiry_date     DATE
usage_limit     INTEGER (NULL = unlimited)
usage_count     INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ
```

### reviews

```
id             UUID PK
product_id     UUID → products.id
reviewer_name  TEXT NOT NULL
reviewer_city  TEXT
rating         INTEGER 1–5
body           TEXT NOT NULL
is_approved    BOOLEAN DEFAULT FALSE    ← admin must approve before public
created_at     TIMESTAMPTZ
```

### journal_articles

```
id             UUID PK
slug           TEXT UNIQUE NOT NULL
title          TEXT NOT NULL
category       TEXT: 'Style'|'Craft'|'Culture'|'Women'|'Occasions'|'Behind the Scenes'|'Inspiration'
author         TEXT DEFAULT 'The Possah Atelier'
body           TEXT (plain text or markdown)
featured_image TEXT    ← URL
is_featured    BOOLEAN DEFAULT FALSE    ← shows as hero on journal index
published_at   TIMESTAMPTZ (NULL = draft)
created_at     TIMESTAMPTZ
```

**Published filter:** `.not('published_at', 'is', null)` — NOT `.eq('is_published', true)` (that column doesn't exist).

### lookbooks

```
id              UUID PK
collection_name TEXT NOT NULL
season          TEXT NOT NULL    ← 'Spring', 'Festive', 'Resort'
year            INTEGER NOT NULL
theme_word      TEXT NOT NULL    ← e.g. 'Veil', 'Ember'
chapter_number  INTEGER NOT NULL UNIQUE
hero_image      TEXT
concept_text    TEXT
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ
```

**No `slug` column.** Links use `/lookbook/${id}`.  
**Filter:** `.eq('is_active', true).order('chapter_number', { ascending: false })`

### lookbook_looks

```
id          UUID PK
lookbook_id UUID → lookbooks.id
look_number INTEGER
image_url   TEXT
product_id  UUID → products.id (nullable)
created_at  TIMESTAMPTZ
UNIQUE (lookbook_id, look_number)
```

### users (customer accounts — Phase 3)

```
id         UUID PK
email      TEXT UNIQUE NOT NULL
name       TEXT
google_id  TEXT UNIQUE
avatar_url TEXT
phone      TEXT
created_at TIMESTAMPTZ
```

### user_measurements (Phase 3)

```
id        UUID PK
user_id   UUID → users.id UNIQUE
bust_cm   NUMERIC(5,1)
waist_cm  NUMERIC(5,1)
hips_cm   NUMERIC(5,1)
height_cm NUMERIC(5,1)
updated_at TIMESTAMPTZ
```

### user_addresses (Phase 3)

```
id            UUID PK
user_id       UUID → users.id
label         TEXT    ← 'Home', 'Work'
full_name     TEXT
phone         TEXT
address_line1 TEXT
address_line2 TEXT
city          TEXT
state         TEXT
pincode       TEXT
is_default    BOOLEAN DEFAULT FALSE
created_at    TIMESTAMPTZ
```

### wishlists (Phase 3 — sync)

```
id         UUID PK
user_id    UUID → users.id
product_id UUID → products.id
variant_id UUID (nullable)
created_at TIMESTAMPTZ
UNIQUE (user_id, product_id)
```

### admin_users (Phase 2)

```
id            UUID PK
email         TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
role          TEXT: 'super_admin'|'admin'|'editor'
is_active     BOOLEAN DEFAULT TRUE
created_at    TIMESTAMPTZ
```

### homepage_config (single-row)

```
id                UUID PK
hero_slides       JSONB [{image, headline, sub_headline, cta_label, cta_link}]
collection_banner JSONB {image, headline, subtitle, cta_link}
new_arrival_ids   JSONB [UUID, ...]
occasion_tiles    JSONB [{image, label, filter_link}]
updated_at        TIMESTAMPTZ
```

### gift_sets

```
id          UUID PK
name        TEXT NOT NULL
slug        TEXT UNIQUE NOT NULL
description TEXT
price       NUMERIC(10,2)
image_url   TEXT
includes    JSONB []    ← array of items in the gift box
is_active   BOOLEAN DEFAULT TRUE
created_at  TIMESTAMPTZ
```

---

## 8. State Management

Three Zustand stores. All in `lib/store/`.

### `cartStore.ts`

```typescript
interface CartItem {
  productId: string
  variantId: string
  name: string
  image: string
  price: number
  colour: string
  colourHex: string
  size: string
  qty: number
  slug: string    // ← FULL PATH: "category_slug/product_slug" e.g. "sarees/the-noor-saree"
                  //   Used to build /shop/${slug} links in cart page
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void  // merges if same variantId
  removeItem: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clearCart: () => void
  subtotal: () => number
  itemCount: () => number
}
```

**Persistence:** `localStorage` via Zustand `persist` middleware.  
**Cart URL construction in cart page:** `/shop/${item.slug}` — slug is already the full path.

### `wishlistStore.ts`

```typescript
interface WishlistItem {
  productId: string
  variantId: string | null
  name: string
  image: string
  price: number
  slug: string    // ← FULL PATH: same as CartItem.slug
}

interface WishlistStore {
  items: WishlistItem[]
  toggleItem: (item: WishlistItem) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
}
```

**Persistence:** `localStorage`. Phase 3 will add DB sync on login.

### `mobileFilterStore.ts`

```typescript
interface MobileFilterStore {
  isOpen: boolean
  open: () => void
  close: () => void
}
```

Drives the mobile filter drawer (MobileFilterDrawer component). No persistence.

---

## 9. Payment System

### Flow (end-to-end)

```
1. User fills checkout form → clicks "Pay ₹X,XXX"

2. POST /api/orders/create
   ├── Zod validates input
   ├── Server recalculates total (±₹1 tolerance)
   ├── Revalidates coupon against DB
   ├── createRazorpayOrder({ amount: totalPaise, receipt: orderNumber })
   │     → calls api.razorpay.com/v1/orders (Basic auth with key+secret)
   │     → returns { id: "order_xxx", amount, currency }
   ├── Inserts order to DB: payment_status='pending', gateway_order_id=rzOrder.id
   └── Returns { razorpay_order_id, order_number, amount }

3. Browser opens Razorpay modal
   ├── key: NEXT_PUBLIC_RAZORPAY_KEY_ID (public — safe for browser)
   ├── User pays (UPI / card / net banking / wallet)
   └── Razorpay calls onSuccess({ razorpay_payment_id, razorpay_signature })

4. POST /api/payments/verify (client calls this immediately)
   ├── HMAC-SHA256: verify(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
   ├── crypto.timingSafeEqual() — timing-safe
   ├── Updates orders.payment_status='paid' WHERE payment_status='pending'
   └── Returns { success: true }

5. clearCart() → router.push(/order/confirmation?order=PSH-2026-XXXX)

6. POST /api/payments/webhook (Razorpay → server, async backup)
   ├── Verifies x-razorpay-signature header against RAZORPAY_WEBHOOK_SECRET
   ├── On payment.captured: marks paid if still pending + sends email
   ├── On payment.failed: marks failed if still pending
   └── Idempotent — won't overwrite already-paid orders
```

### Security rules

- `RAZORPAY_KEY_SECRET` — server-only, never in `NEXT_PUBLIC_*`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — public, browser-safe (identifies merchant only)
- `RAZORPAY_WEBHOOK_SECRET` — server-only, webhook verification
- HMAC signature ALWAYS verified server-side before marking order paid
- Client result NEVER trusted alone — webhook is the backup

### Test cards (Razorpay test mode)

```
Card (success): 4111 1111 1111 1111 | any future expiry | any CVV
Card (failure): 4000 0000 0000 0002
UPI (success):  success@razorpay
UPI (failure):  failure@razorpay
```

### Key files

```
lib/razorpay.ts                          ← verifyRazorpayWebhookSignature()
                                           verifyRazorpayPaymentSignature()
                                           createRazorpayOrder()
app/api/orders/create/route.ts           ← creates Razorpay order + DB row
app/api/payments/verify/route.ts         ← HMAC verify after modal
app/api/payments/webhook/route.ts        ← Razorpay webhook backup handler
app/(shop)/checkout/CheckoutForm.tsx     ← initRazorpay() helper + onSubmit
```

---

## 10. Authentication & Security

### Dev vs Production behaviour

```
NODE_ENV=development:
  - middleware.ts passes ALL /admin/* routes (no session check)
  - /account shows DEV_SESSION (mock user, no Google login)
  - Missing optional keys: warn only, don't crash
  - Yellow dev banner on every admin page (Phase 2)

NODE_ENV=production:
  - middleware.ts: /admin/* requires next-auth.session-token cookie
  - /account: unauthenticated → redirect to /auth/signin
  - All missing keys throw at startup (or at first use)
```

One variable. No other flags.

### Admin auth (Phase 2 — to be built)

```
Route: /admin/login
Strategy: Email + password
Storage: admin_users table (password_hash via bcrypt)
Session: NextAuth JWT
Roles: super_admin > admin > editor
Middleware: middleware.ts already guards /admin/*
```

### Customer auth (Phase 3 — not yet built)

```
Route: /auth/signin → Google OAuth
Provider: Google (lib/auth.ts)
Session: NextAuth JWT, stored in cookie
User creation: first login creates row in users table
```

### Security measures in place

| Threat | Mitigation |
|---|---|
| Razorpay payment forgery | HMAC signature verified server-side on every payment |
| Timing attack on HMAC | `crypto.timingSafeEqual()` used |
| SQL injection | Supabase PostgREST parameterised queries. No string concatenation |
| Invalid order total | Server recalculates and rejects if mismatch > ₹1 |
| Expired coupon codes | Re-validated server-side on every order create |
| CSRF | NextAuth CSRF token on all auth mutations |
| Secret leak | `NEXT_PUBLIC_*` prefix only on truly public values. All payment secrets server-only |
| Admin access | Middleware blocks unauthenticated requests to `/admin/*` in production |
| Form input abuse | Zod schemas on every API route. Character limits enforced |

### Still needed (Phase 3/4)

- Supabase RLS policies on all tables (critical before launch)
- Rate limiting on `/api/payments/*`, `/api/orders/*`, `/api/auth/*`
- Admin user created in `admin_users` table via Supabase dashboard

---

## 11. SEO Implementation

### Per-page metadata

Every page exports `generateMetadata()` (Server Components) with:
- Unique `title` — format: `"Product Name — The Possah"`
- `description` — product description or page-specific copy
- `alternates.canonical` — `https://thepossah.com/[path]`
- `openGraph.images` — first product image for PDP pages

### Structured data (JSON-LD)

| Page | Schema type |
|---|---|
| PDP | `Product` (name, price, availability, images, aggregateRating if reviews exist) |
| PDP | `BreadcrumbList` |
| Category page | `BreadcrumbList` |
| Homepage | (Phase 3 — add `Organization`) |

### sitemap.xml

Auto-generated by `app/sitemap.ts`. Includes:
- Static routes (homepage, about, bridal, festive, etc.)
- All active products (with `lastModified` from `updated_at`)
- All categories
- All published journal articles

Access: `https://thepossah.com/sitemap.xml`

### robots.txt

`app/robots.ts`:
```
Allow: /
Disallow: /admin/, /api/, /cart/, /checkout/, /order/, /account/
Sitemap: https://thepossah.com/sitemap.xml
```

### Still needed (Phase 3)

- `Organization` JSON-LD on homepage
- Google Search Console — submit sitemap
- GA4 — `NEXT_PUBLIC_GA_MEASUREMENT_ID` (env var exists, tracking script not yet wired)
- Lighthouse audit — targets: Homepage >90, Category >90, PDP >85

---

## 12. Phase 2 — Admin Dashboard (Not Yet Built)

Phase 2 scope: full admin dashboard at `/admin/*`. No new public pages. No payment changes.

### Routes to build

| Route | Purpose |
|---|---|
| `/admin` | Dashboard: summary cards, recent orders, quick links |
| `/admin/login` | Email + password sign-in (in prod) |
| `/admin/products` | Product list table |
| `/admin/products/new` | Add product form |
| `/admin/products/[id]/edit` | Edit product form |
| `/admin/orders` | Orders list with filters |
| `/admin/orders/[id]` | Order detail + fulfillment actions |
| `/admin/categories` | Category list + add/edit/reorder |
| `/admin/coupons` | Coupon CRUD |
| `/admin/reviews` | Pending/approved review moderation |
| `/admin/homepage` | Homepage config editor |
| `/admin/journal` | Article list + add/edit |
| `/admin/media` | Image upload + library |
| `/admin/settings` | Announcement bar text, WhatsApp number, shipping thresholds |

### API routes to build for Phase 2

```
GET    /api/admin/products         → paginated product list
POST   /api/admin/products         → create product
PATCH  /api/admin/products/[id]    → update product
DELETE /api/admin/products/[id]    → soft-delete (set is_active=false)

GET    /api/admin/orders           → paginated order list with filters
GET    /api/admin/orders/[id]      → single order detail
PATCH  /api/admin/orders/[id]      → update fulfillment_status, tracking_number

GET    /api/admin/categories       → all categories
POST   /api/admin/categories       → create category
PATCH  /api/admin/categories/[id]  → update category
DELETE /api/admin/categories/[id]  → delete category

POST   /api/admin/coupons          → create coupon
PATCH  /api/admin/coupons/[id]     → update / toggle active
DELETE /api/admin/coupons/[id]     → delete coupon

GET    /api/admin/reviews          → pending reviews
PATCH  /api/admin/reviews/[id]     → approve / reject

GET    /api/admin/homepage         → current config
PUT    /api/admin/homepage         → replace config

POST   /api/admin/journal          → create article
PATCH  /api/admin/journal/[id]     → update / publish
DELETE /api/admin/journal/[id]     → delete article

POST   /api/admin/media/upload     → Supabase Storage upload
DELETE /api/admin/media/[id]       → delete image
```

### Product form — all fields

The add/edit product form covers every column in the `products` table plus related tables:

```
BASIC
  name           TEXT
  slug           TEXT (auto from name, editable)
  sub_line       'THE DRAPE' | 'THE EDIT' | 'THE ATELIER' | 'THE VAULT'
  category_id    UUID (dropdown from categories)
  description    TEXT

PRICING
  price          NUMERIC
  compare_price  NUMERIC (optional — shows strikethrough on PDP)

VARIANTS (product_variants table)
  colour_name    TEXT
  colour_hex     TEXT (color picker)
  size           XS|S|M|L|XL|XXL|Free Size|Made-to-Measure
  stock_qty      INTEGER per variant

IMAGES (product_images table)
  url            TEXT (upload to Supabase Storage)
  alt            TEXT per image
  position       INTEGER (drag-to-reorder)

TAGS (product_tags table)
  tag            TEXT[] — occasion tags for filtering

CRAFT STORY
  craft_story_title TEXT
  craft_story_body  TEXT
  craft_story_image TEXT (upload)

DETAILS
  fabric            TEXT
  craft_description TEXT
  care_instructions TEXT
  drape_guide       TEXT

AUDIO (visible only when is_new_arrival OR is_top_selling)
  audio_url TEXT (upload MP3, max 2MB)

SEO
  meta_title       TEXT
  meta_description TEXT

FLAGS
  is_new_arrival  BOOLEAN
  is_top_selling  BOOLEAN
  is_featured     BOOLEAN
  is_active       BOOLEAN
```

### Admin auth implementation (Phase 2)

```typescript
// New file: lib/admin-auth.ts
// Credentials provider — email + password against admin_users table
// bcrypt password comparison
// Returns session with { id, email, role }

// middleware.ts already handles:
// dev → bypass, prod → check next-auth.session-token cookie
// Just needs the NextAuth Credentials provider wired up
```

### Dev mode in admin

Every admin page must show this banner:
```tsx
{process.env.NODE_ENV === 'development' && (
  <div style={{ background: '#FFF3CD', color: '#856404', padding: '8px 16px', fontSize: 12 }}>
    ⚠️ DEV MODE — Auth bypassed. Remove before shipping.
  </div>
)}
```

---

## 13. Environment Variables

Full list — all must be set in production. In dev, some are optional (app warns but doesn't crash).

```env
# ─── Node ──────────────────────────────────
NODE_ENV=development                    # Switch to production for real guards

# ─── Supabase ──────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=              # Project URL (safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Anon key (safe for browser — RLS enforced)
SUPABASE_SERVICE_ROLE_KEY=             # Service role — SERVER ONLY. Bypasses RLS.

# ─── Auth ──────────────────────────────────
NEXTAUTH_SECRET=                       # Random 32-char string. openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000     # Change to https://thepossah.com in prod

GOOGLE_CLIENT_ID=                      # Optional in dev (/account uses mock)
GOOGLE_CLIENT_SECRET=                  # Optional in dev

# ─── Payments ──────────────────────────────
RAZORPAY_KEY_ID=                       # Server-side reference (matches NEXT_PUBLIC below)
NEXT_PUBLIC_RAZORPAY_KEY_ID=           # Browser Razorpay modal — must match above
RAZORPAY_KEY_SECRET=                   # SERVER ONLY. Never NEXT_PUBLIC.
RAZORPAY_WEBHOOK_SECRET=               # From Razorpay Dashboard → Webhooks

# ─── Email ─────────────────────────────────
RESEND_API_KEY=                        # From resend.com

# ─── Analytics ─────────────────────────────
NEXT_PUBLIC_GA_MEASUREMENT_ID=         # G-XXXXXXXXXX — optional, safe to leave blank
```

### Production checklist

- All values filled (no blanks, no placeholder text)
- `NODE_ENV=production`
- `NEXTAUTH_URL=https://thepossah.com`
- `RAZORPAY_KEY_ID` = live key (not `rzp_test_*`)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` = same live key
- `GOOGLE_CLIENT_ID` redirect URI updated to `https://thepossah.com/api/auth/callback/google`
- Resend domain `thepossah.com` verified
- Supabase service role key is the full service_role key (not anon)

---

## 14. Key Patterns & Rules

These rules were established during development. Breaking any of them will introduce bugs.

### PostgREST related-table filtering

**WRONG — PostgREST cannot do this:**
```typescript
// This silently returns wrong results or errors
.in('product_tags.tag', ['Wedding', 'Sangeet'])
.eq('categories.slug', 'sarees')
```

**RIGHT — two-step query:**
```typescript
// Step 1: get product IDs from junction table
const { data: tagRows } = await supabase
  .from('product_tags')
  .select('product_id')
  .in('tag', ['Wedding', 'Sangeet'])

const productIds = [...new Set(tagRows.map(r => r.product_id))]

// Step 2: use those IDs
const { data } = await supabase
  .from('products')
  .select('...')
  .in('id', productIds)
```

### ProductCardData — must include category_slug

Every Supabase query that returns products for a `ProductCardData[]` array MUST:
1. Include `categories (slug)` in the `.select()` string
2. Map to `category_slug: (p.categories as { slug: string } | null)?.slug ?? 'sarees'`

Without this, every product URL and cart slug will be wrong.

### Published articles filter

```typescript
// WRONG — column doesn't exist
.eq('is_published', true)

// RIGHT
.not('published_at', 'is', null)
```

### Cart/wishlist slug format

```typescript
// WRONG — will build URL /shop/the-noor-saree (missing category)
slug: product.slug

// RIGHT — builds URL /shop/sarees/the-noor-saree
slug: `${product.category_slug}/${product.slug}`
```

### Image component

Never `<img>`. Always `<Image>` from `next/image`. Always set `sizes` prop on images inside layouts. Always set `priority` on above-the-fold images (hero, first product image).

### Colours

Never hardcoded hex. Always CSS variables. Background is never `#FFFFFF` — always `var(--color-bg)` = `#F4ECDF`.

### TypeScript

No `any` anywhere. Use `as` casts only when PostgREST returns untyped JSONB — always cast to a named interface, not `any`.

---

## 15. File Map

```
Possah_1.0/
│
├── SETUP.md                        ← Start here. 5 steps. One run command.
├── POSSAH_MASTER_DOCUMENT.md       ← This file. Full project truth.
├── POSSAH_BUILD_GUIDE.md           ← Step-by-step build order + test checklists
├── POSSAH_PROJECT_PLAN.md          ← Feature specs, admin specs, DB schema
├── POSSAH_CREATIVE_DIRECTION.md    ← Brand: colours, fonts, voice, components
├── POSSAH_KICKOFF_PROMPT.md        ← Paste at session start for any AI build session
│
├── .env.local.example              ← Copy → .env.local, fill all values
├── .gitignore                      ← *.local, node_modules, .next, .wrangler
│
├── next.config.ts                  ← Image domains: **.supabase.co, res.cloudinary.com
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── middleware.ts                   ← Admin auth guard. Dev bypass on NODE_ENV=development
│
├── styles/
│   └── globals.css                 ← ALL CSS custom properties (colours, fonts, spacing, radii)
│
├── app/
│   ├── layout.tsx                  ← Root layout: fonts, providers, AnnouncementBar, Header, Footer
│   ├── not-found.tsx               ← Custom 404
│   ├── sitemap.ts                  ← Dynamic XML sitemap
│   ├── robots.ts                   ← Robots.txt
│   │
│   ├── (shop)/                     ← All public pages (shared Header/Footer layout)
│   │   ├── page.tsx                ← Homepage + ProductCardData interface definition
│   │   ├── about/page.tsx
│   │   ├── bridal/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx
│   │   │   └── CheckoutForm.tsx    ← Client. Razorpay modal, form, payment flow
│   │   ├── contact/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── festive/page.tsx
│   │   ├── journal/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── lookbook/page.tsx
│   │   ├── made-to-measure/page.tsx
│   │   ├── order/confirmation/
│   │   │   ├── page.tsx
│   │   │   └── OrderConfirmationView.tsx
│   │   ├── search/page.tsx
│   │   ├── shop/
│   │   │   └── [category]/
│   │   │       ├── page.tsx        ← Category listing + all filters
│   │   │       └── [slug]/page.tsx ← PDP
│   │   ├── size-guide/page.tsx
│   │   ├── wishlist/page.tsx
│   │   └── account/
│   │       ├── page.tsx
│   │       └── orders/page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── contact/route.ts
│       ├── coupons/validate/route.ts
│       ├── orders/create/route.ts
│       ├── payments/
│       │   ├── verify/route.ts
│       │   └── webhook/route.ts
│       └── search/route.ts
│
├── components/
│   ├── layout/
│   │   ├── AnnouncementBar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   ├── homepage/
│   │   ├── HeroSlider.tsx
│   │   ├── CategorySplit.tsx
│   │   ├── CategoryCircles.tsx
│   │   ├── NewArrivals.tsx
│   │   ├── CollectionBanner.tsx
│   │   ├── OccasionGrid.tsx
│   │   └── MtmCta.tsx
│   ├── shop/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── MobileFilterDrawer.tsx
│   │   ├── SortBar.tsx
│   │   └── YouMightAlsoLike.tsx
│   ├── pdp/
│   │   ├── ProductGallery.tsx
│   │   ├── ProductInfo.tsx
│   │   ├── CraftBehind.tsx
│   │   ├── CompleteTheLook.tsx
│   │   └── ReviewsSection.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Accordion.tsx
│       ├── Badge.tsx
│       ├── AudioPlayer.tsx
│       └── Modal.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← createClient() — Client Components
│   │   ├── server.ts           ← createServerClient() — Server Components + API routes
│   │   └── types.ts            ← Supabase generated types
│   ├── store/
│   │   ├── cartStore.ts        ← Zustand. CartItem.slug = "category_slug/product_slug"
│   │   ├── wishlistStore.ts    ← Zustand. WishlistItem.slug = same format
│   │   └── mobileFilterStore.ts
│   ├── auth.ts                 ← NextAuth config + DEV_SESSION mock
│   ├── razorpay.ts             ← createRazorpayOrder(), verifyRazorpayPaymentSignature(), verifyRazorpayWebhookSignature()
│   ├── email.ts                ← sendOrderConfirmationEmail() via Resend
│   └── utils.ts                ← formatPrice(), generateOrderNumber(), slugify(), whatsappUrl(), cn(), calculateDiscount(), etc.
│
├── supabase/
│   └── migrations/
│       ├── 001_products.sql
│       ├── 002_categories.sql
│       ├── 003_orders.sql
│       ├── 004_users.sql
│       ├── 005_user_measurements.sql
│       ├── 006_user_addresses.sql
│       ├── 007_wishlists.sql
│       ├── 008_coupons.sql
│       ├── 009_reviews.sql
│       ├── 010_homepage_config.sql
│       ├── 011_admin_users.sql
│       ├── 012_gift_sets.sql
│       ├── 013_journal_articles.sql
│       └── 014_lookbooks.sql
│
└── seeds/
    ├── seed_categories.sql
    ├── seed_products.sql
    └── seed_homepage_config.sql
```
