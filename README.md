# The Possah

Luxury Indian fashion e-commerce — thepossah.com

**Stack:** Next.js 14 · Supabase · Razorpay · Resend  
**Phase:** 1 complete (all public pages). Phase 2 next (admin dashboard).

---

## Quick start

```bash
cp .env.local.example .env.local   # fill in your keys
npm install
# Run supabase/migrations/* in order via Supabase SQL Editor
# Run seeds/* in order
npm run dev                         # localhost:3000
```

Full setup: see **SETUP.md**

---

## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm run start        # run production build
npm run lint         # ESLint
npm run build:cf     # Cloudflare Pages build
```

---

## Documentation

| File | Read when |
|---|---|
| SETUP.md | Getting the project running locally |
| POSSAH_MASTER_DOCUMENT.md | Full architecture, schema, component map, what's done/not done |
| POSSAH_BUILD_GUIDE.md | Step-by-step build order, test checklists per step |
| POSSAH_PROJECT_PLAN.md | Feature specs, admin specs, payment flow |
| POSSAH_CREATIVE_DIRECTION.md | Brand colours, fonts, voice, component design rules |
| POSSAH_KICKOFF_PROMPT.md | Paste at start of any AI build session |

---

## Project structure

```
app/(shop)/          ← all public pages
app/api/             ← REST endpoints
app/admin/           ← admin dashboard (Phase 2 — not yet built)
components/          ← layout, homepage, shop, pdp, ui
lib/                 ← supabase clients, stores, utils, auth, payments, email
supabase/migrations/ ← 14 DB migration files (run in order)
seeds/               ← seed data for dev
styles/globals.css   ← all CSS custom properties (colours, fonts, spacing)
```

---

## Build phases

| Phase | Status | Scope |
|---|---|---|
| Phase 1 | Complete | All public pages, cart, checkout, Razorpay payments, email, sitemap, SEO |
| Phase 2 | Next | Admin dashboard — full CRUD for products, orders, content, coupons |
| Phase 3 | Pending | Google OAuth, customer accounts, wishlist sync, Lighthouse audit |
| Phase 4 | Pending | Production deploy, DNS, Supabase RLS, go-live |

---

## Deploy

**Vercel (recommended):**
```bash
vercel --prod
```
Set all env vars in Vercel Dashboard. Cloudflare DNS: CNAME to cname.vercel-dns.com with proxy OFF.

**Cloudflare Pages:**
```bash
npm run build:cf
wrangler pages deploy .vercel/output/static --project-name=the-possah
```

Full pre-launch checklist in SETUP.md.
