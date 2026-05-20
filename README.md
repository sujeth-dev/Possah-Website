# The Possah

Luxury Indian fashion e-commerce built with Next.js, Supabase, NextAuth, Razorpay, and Resend.

## Current status

- `npm run lint`: passing
- `npm run build`: passing
- storefront and admin code are in the repo
- local Docker-backed Supabase reset still requires elevated Docker access on this machine

## Primary docs

Only these 2 documents are canonical:

- [POSSAH_MASTER_DOCUMENT.md](/C:/Users/user/OneDrive/Desktop/Tech/Live%20Projects/Possah/Possah_1.0/POSSAH_MASTER_DOCUMENT.md)
- [POSSAH_BUILD_STATUS_GUIDE.md](/C:/Users/user/OneDrive/Desktop/Tech/Live%20Projects/Possah/Possah_1.0/POSSAH_BUILD_STATUS_GUIDE.md)

Older planning and setup documents have been archived under `docs/archive/`.

## Core commands

```bash
npm install
npm run dev
npm run lint
npm run build
supabase start
supabase db reset
```

## Project structure

```text
app/(shop)/          storefront pages
app/admin/           admin dashboard
app/api/             API routes
components/          UI and feature components
lib/                 auth, integrations, Supabase clients, utilities
supabase/migrations/ schema source of truth
seeds/               local seed SQL
styles/              global styling
```
