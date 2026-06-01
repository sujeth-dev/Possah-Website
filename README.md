# The Possah

Luxury Indian fashion e-commerce — handcrafted pieces, bespoke tailoring, editorial brand.

**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · NextAuth · Razorpay · Resend · TypeScript

---

## Quick start

```bash
cp .env.local.example .env.local   # fill in values — see docs/env-setup.md
npm install
npm run dev                         # localhost:3000
```

Admin panel: `localhost:3000/admin`

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest unit tests
npm run test:api     # admin API test suite
npm run test:payment # payment flow test suite
```

---

## Where everything lives

| What you need | Go to |
|---|---|
| **Start here — architecture, schema, routes** | [`POSSAH_MASTER_DOCUMENT.md`](./POSSAH_MASTER_DOCUMENT.md) |
| **Project folder map** | [`docs/project-structure.md`](./docs/project-structure.md) |
| **Making any kind of change** | [`docs/change-flow.md`](./docs/change-flow.md) |
| **Managing products / categories / data** | [`docs/data-manager-guide.md`](./docs/data-manager-guide.md) |
| **SQL to run in Supabase** | [`docs/supabase-sql-actions.md`](./docs/supabase-sql-actions.md) |
| **QA checklist after deploy** | [`docs/qa-checklist.md`](./docs/qa-checklist.md) |
| **42-product pipeline** | [`Possah_Data_Operations_Plan.md`](./Possah_Data_Operations_Plan.md) |
| **Local env setup** | [`docs/env-setup.md`](./docs/env-setup.md) |
| **Sprint + open fixes** | [`SPRINT.md`](./SPRINT.md) |
| **Test setup** | [`TESTING_PLAN.md`](./TESTING_PLAN.md) |
| **Admin test suite** | [`scripts/admin_test/GUIDE.md`](./scripts/admin_test/GUIDE.md) |
| **Creative direction, colours, fonts** | [`docs/archive/POSSAH_CREATIVE_DIRECTION.md`](./docs/archive/POSSAH_CREATIVE_DIRECTION.md) |

---

## Database

Run all migrations in order, then seeds:

```
supabase/migrations/001 → 024   run once each, in order
seeds/seed_categories.sql       run after migrations
seeds/seed_homepage_config.sql  run after seed_categories
```

Real product data (42 products) is managed by the pipeline — not SQL seeds.
See [`Possah_Data_Operations_Plan.md`](./Possah_Data_Operations_Plan.md).

---

## Current state (June 2026)

- 42 products live — 16 dresses, 13 tops, 4 co-ords, 1 kurta set, 4 sarees, 4 lehengas
- 13 categories active (8 original + 5 new: dress-material, fabrics, blouses, tops, bottoms)
- Admin: full CRUD — products, orders, categories, coupons, reviews, journal, homepage, settings
- Payments: Razorpay — captured + failed webhooks handled
- Taxonomy: occasion (9 tags incl. Cocktail), fabric (14 options), size (XS–3XL + Free Size + MtM)
- Festive + Bridal pages: editorially curated via `is_festive` / `is_bridal` product flags

