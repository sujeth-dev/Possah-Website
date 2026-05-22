# The Possah

Luxury Indian fashion e-commerce. Next.js 14 · Supabase · NextAuth · Razorpay · Resend.

**Build:** `npm run lint` ✅ `npm run build` ✅ · Phase 1 ✅ · Phase 2 ✅ · Sprint in progress

---

## Canonical Documents

| Document | Read when |
|---|---|
| `POSSAH_MASTER_DOCUMENT.md` | Starting anything. Architecture, routes, schema, auth model. |
| `SPRINT.md` | Doing work. Every remaining fix with exact code + go-live gate checklist. |
| `docs/archive/POSSAH_CREATIVE_DIRECTION.md` | Building any UI. Colours, fonts, voice, logo, layout rules. |
| `docs/archive/POSSAH_BUILD_GUIDE.md` | Referencing Phase 1+2 build steps and test checklists. |
| `TESTING_PLAN.md` | Setting up Vitest or Playwright. Tool config + test structure. |
| `scripts/admin_test/GUIDE.md` | Running the admin API test suite. |

---

## Commands

```bash
npm install
npm run dev          # :3000
npm run lint
npm run build
npm run typecheck    # tsc --noEmit

supabase start       # requires Docker (run as Admin on Windows)
supabase db reset    # applies all migrations + seeds
supabase status      # prints local URL + keys → paste into .env.local
```
