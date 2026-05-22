# Possah 1.0 — Plan 02: Deployment

**Type:** Deployment & Infrastructure Playbook  
**Scope:** Staging setup → Production go-live → Post-launch infrastructure  
**Based on:** Current deployment ambiguity (Vercel vs Cloudflare), missing CI/CD, missing env documentation  
**Last Updated:** May 2026

---

## Deployment Decision

**Target: Vercel**

Rationale:
- Zero-config Next.js 14 App Router support (no adapter required)
- Mumbai PoP (Vercel's `bom1` region) — lowest latency for Indian customers
- Built-in preview deployments for every PR
- Vercel Edge Network handles static asset caching automatically
- Supabase works natively — no compatibility shims needed
- Razorpay, Resend, NextAuth all work on Vercel's Node.js runtime without changes

Action: Remove the `build:cf` script from `package.json` and uninstall `@cloudflare/next-on-pages`. It is dead code that creates confusion about the deployment target.

---

## Infrastructure Overview

```
                    ┌─────────────────────────────────────────┐
                    │              Vercel (Production)         │
                    │  Region: bom1 (Mumbai)                  │
                    │  Runtime: Node.js 20.x                  │
                    │  Edge Functions: health check only       │
                    └────────────────┬────────────────────────┘
                                     │
           ┌─────────────────────────┼──────────────────────────┐
           │                         │                          │
    ┌──────▼──────┐          ┌───────▼───────┐         ┌──────▼──────┐
    │  Supabase   │          │   Razorpay    │         │   Resend    │
    │ (Production)│          │  (Live mode)  │         │   (Email)   │
    │ PostgreSQL  │          │               │         │             │
    │ Storage     │          │               │         │             │
    └─────────────┘          └───────────────┘         └─────────────┘
```

---

## Phase A: Supabase Production Setup

Complete before any code deployment.

### A.1 — Create Production Project

1. Log in to supabase.com
2. Create new project: "possah-production"
3. Select region: **South Asia (Mumbai)** — `ap-south-1`
4. Set a strong database password (store in 1Password or equivalent)
5. Wait for project to provision (~2 minutes)

---

### A.2 — Run All Migrations

From your local machine with the Supabase CLI authenticated:

```bash
# Authenticate CLI
supabase login

# Link to the new production project
supabase link --project-ref <your-production-project-ref>

# Push all migrations (001 through 021)
supabase db push

# Verify migrations applied
supabase db status
```

**Verify:** In Supabase dashboard → Table Editor, confirm all 17+ tables exist. Confirm `admin_users`, `product_variants`, `orders` tables are present.

---

### A.3 — Verify RLS Policies

```sql
-- Run this in Supabase SQL editor to confirm RLS is active
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Every table must show `rowsecurity = true`. If any shows false, re-check migration `018_rls_policies.sql`.

---

### A.4 — Seed Initial Data

```bash
# Run seeds in order
supabase db execute --file seeds/seed_categories.sql
supabase db execute --file seeds/seed_homepage_config.sql
# seed_products.sql is for local dev only — enter real products via admin panel
```

---

### A.5 — Seed Admin User

In Supabase SQL editor:

```sql
INSERT INTO admin_users (email, is_active)
VALUES ('thedenn0007@gmail.com', true);
```

Add any additional admin emails as needed.

---

### A.6 — Create Storage Bucket

In Supabase dashboard → Storage:
1. Create bucket: `product-images`
2. Set to **public** (images must be publicly accessible for product display)
3. Set allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
4. Set max file size: `5MB`

Create second bucket: `media` (for journal images, lookbook assets) — also public.

---

### A.7 — Collect Production Credentials

From Supabase dashboard → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon (public) key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (never expose to browser)

---

## Phase B: Staging Environment Setup

Set this up BEFORE production. Every change must hit staging first.

### B.1 — Create Staging Supabase Project

Same steps as A.1–A.6 but:
- Project name: "possah-staging"
- Same region: `ap-south-1`
- Run the same migrations
- Seed `admin_users` with your email

---

### B.2 — Razorpay Test Mode

Staging always uses Razorpay **test mode** keys:
- `RAZORPAY_KEY_ID` = `rzp_test_...`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` = `rzp_test_...`
- `RAZORPAY_KEY_SECRET` = test secret
- `RAZORPAY_WEBHOOK_SECRET` = test webhook secret

Set up a test webhook in Razorpay dashboard → Webhooks:
- URL: `https://staging.thepossah.com/api/payments/webhook`
- Events: `payment.captured`, `payment.failed`
- Active: yes

---

### B.3 — GitHub Repository

If not already on GitHub:

```bash
cd /path/to/Possah_1.0
git remote add origin https://github.com/<your-org>/possah.git
git branch -M main
git push -u origin main
```

Create a `staging` branch:

```bash
git checkout -b staging
git push -u origin staging
```

---

### B.4 — Vercel Project Setup

1. Log in to vercel.com
2. Click "Add New Project" → "Import Git Repository" → select `possah`
3. Framework Preset: **Next.js** (auto-detected)
4. Root Directory: `.` (project root)
5. Build Command: `npm run build`
6. Output Directory: `.next` (auto)
7. Install Command: `npm install`

---

### B.5 — Vercel Environment Variables (Staging)

In Vercel project → Settings → Environment Variables. Set scope to **Preview** for staging vars:

| Variable | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging Supabase URL | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key | Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service role key | Preview |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output | Preview |
| `NEXTAUTH_URL` | `https://staging.thepossah.com` | Preview |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Preview |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Preview |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Preview |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_...` | Preview |
| `RAZORPAY_KEY_SECRET` | test secret | Preview |
| `RAZORPAY_WEBHOOK_SECRET` | test webhook secret | Preview |
| `RESEND_API_KEY` | `re_...` | Preview |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | test GA4 property ID | Preview |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Preview |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Preview |
| `SENTRY_DSN` | Sentry DSN | Preview |

---

### B.6 — Custom Staging Domain

In Vercel project → Settings → Domains:
1. Add: `staging.thepossah.com`
2. Set to deploy from `staging` branch
3. Add DNS record in your domain registrar: `CNAME staging → cname.vercel-dns.com`

---

### B.7 — Google OAuth Staging Config

In Google Cloud Console → Credentials → OAuth 2.0 Client IDs:
1. Add `https://staging.thepossah.com` to **Authorized JavaScript origins**
2. Add `https://staging.thepossah.com/api/auth/callback/google` to **Authorized redirect URIs**

---

### B.8 — Staging Smoke Test

After staging is live, run the full smoke test from `SMOKE_TEST_RUNBOOK.md`. Every step must pass. If any step fails, fix in a PR against `staging` and redeploy before proceeding to production.

---

## Phase C: Production Go-Live

Only proceed after staging smoke test passes completely.

### C.1 — Vercel Production Environment Variables

In Vercel → Environment Variables. Set scope to **Production**:

| Variable | Value | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | production Supabase URL | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon key | |
| `SUPABASE_SERVICE_ROLE_KEY` | production service role key | 🔴 Never log or expose |
| `NEXTAUTH_SECRET` | new 32+ char random string | Different from staging |
| `NEXTAUTH_URL` | `https://thepossah.com` | |
| `GOOGLE_CLIENT_ID` | same Google OAuth client ID | |
| `GOOGLE_CLIENT_SECRET` | same Google OAuth secret | |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | 🔴 Live mode |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` | 🔴 Live mode |
| `RAZORPAY_KEY_SECRET` | live secret | 🔴 Never commit to git |
| `RAZORPAY_WEBHOOK_SECRET` | live webhook secret | |
| `RESEND_API_KEY` | `re_...` production | |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | production GA4 ID | |
| `UPSTASH_REDIS_REST_URL` | production Upstash URL | |
| `UPSTASH_REDIS_REST_TOKEN` | production Upstash token | |
| `SENTRY_DSN` | Sentry DSN | |
| `LOG_LEVEL` | `info` | |

---

### C.2 — Razorpay Live Mode Webhook

In Razorpay dashboard → Webhooks:
1. Add new webhook
2. URL: `https://thepossah.com/api/payments/webhook`
3. Secret: the value you set in `RAZORPAY_WEBHOOK_SECRET`
4. Events: check `payment.captured` and `payment.failed`
5. Active: yes
6. Copy the webhook secret — this must match `RAZORPAY_WEBHOOK_SECRET` exactly

---

### C.3 — Google OAuth Production Config

In Google Cloud Console → OAuth 2.0 Client IDs:
1. Add `https://thepossah.com` to **Authorized JavaScript origins**
2. Add `https://thepossah.com/api/auth/callback/google` to **Authorized redirect URIs**

---

### C.4 — Production Deployment

In Vercel project → Settings → Domains:
1. Add: `thepossah.com`
2. Add: `www.thepossah.com` (redirect to `thepossah.com`)
3. Connect to `main` branch

Deploy:
```bash
git checkout main
git push origin main
```

Vercel auto-deploys on push to `main`. Monitor the build log in Vercel dashboard. Build must succeed (lint + type-check run as part of `npm run build`).

---

### C.5 — DNS Cutover

In your domain registrar:

```
A     thepossah.com     →  76.76.21.21      (Vercel)
CNAME www               →  cname.vercel-dns.com
```

DNS propagation: 5 minutes to 48 hours depending on TTL. Set TTL to 300 (5 min) before making the change so propagation is fast. After confirming the site is live, increase TTL back to 3600.

---

### C.6 — Post-DNS Verification

Run these checks within 1 hour of DNS cutover:

```bash
# Confirm HTTPS is active
curl -I https://thepossah.com | grep -E "HTTP|Strict"

# Confirm security headers
curl -I https://thepossah.com | grep -E "X-Frame|X-Content|Referrer"

# Confirm health check
curl https://thepossah.com/api/health

# Confirm sitemap
curl https://thepossah.com/sitemap.xml | head -20

# Confirm robots.txt
curl https://thepossah.com/robots.txt

# Confirm OG image
curl -I https://thepossah.com/images/og-default.jpg | grep "HTTP"
```

All must return 200. HSTS header must be present.

---

### C.7 — First Production Transaction Test

Before announcing to customers:
1. Sign in with your admin Google account at `thepossah.com/auth/signin`
2. Add a real product to cart
3. Complete checkout with a real card (small amount — ₹100 test product)
4. Verify:
   - Order appears in Razorpay live dashboard
   - Order appears in `/admin/orders`
   - Admin email notification received
   - Order confirmation email received by customer email
   - Stock was decremented (check variant in admin)
5. Initiate a Razorpay refund for this test order

---

## Phase D: Post-Launch Infrastructure

### D.1 — Uptime Monitoring (Day 1)

Set up UptimeRobot (free):
- Monitor 1: `https://thepossah.com/` — HTTP — every 5 min
- Monitor 2: `https://thepossah.com/api/health` — HTTP — every 5 min
- Alert: email to admin on 2 consecutive failures

---

### D.2 — Sentry Alerts (Day 1)

In Sentry dashboard:
- Set alert rule: any new error with `level = error` → email immediately
- Set alert rule: error rate > 1% of requests in 5 minutes → email immediately
- Set performance alert: P95 response time > 3s → email within 1 hour

---

### D.3 — Google Search Console (Day 1)

Verify ownership of `thepossah.com` in Google Search Console via DNS TXT record. Submit `https://thepossah.com/sitemap.xml`. Request indexing of the homepage.

---

### D.4 — Supabase Backups (Day 1)

Upgrade Supabase project to **Pro** plan ($25/month) to enable:
- Point-in-time recovery (PITR) — restore to any point in last 7 days
- Daily automated backups
- Database branching for schema experiments

Without Pro, the free tier only has scheduled backups with no PITR. For a live ecommerce store, this is a non-negotiable cost.

---

### D.5 — Database Backup Verification (Weekly)

Every Friday:
1. In Supabase dashboard → Backups, find the most recent backup
2. Create a temporary "possah-backup-test" Supabase project (free tier)
3. Restore the backup to the test project
4. Run: `SELECT count(*) FROM orders; SELECT count(*) FROM products;`
5. Confirm counts match production
6. Delete the test project

Document this in a maintenance log.

---

### D.6 — Deployment Workflow (Ongoing)

```
Developer → PR against staging branch
    ↓
GitHub Actions CI runs (lint + typecheck + unit tests)
    ↓
Vercel Preview deployment auto-created for the PR
    ↓
Manual QA on the Preview URL
    ↓
Merge PR to staging
    ↓
staging.thepossah.com auto-deploys
    ↓
Run smoke test on staging
    ↓
Merge staging → main
    ↓
thepossah.com auto-deploys
    ↓
Monitor Sentry + UptimeRobot for 30 minutes
```

---

### D.7 — Database Migration Workflow (Ongoing)

Never run migrations directly on production without staging validation.

```bash
# On local development
supabase migration new <migration-name>
# Write the migration SQL
supabase db reset  # test locally

# Push to staging first
git checkout staging
git add supabase/migrations/<new>.sql
git commit -m "Add migration: <migration-name>"
git push origin staging
# Vercel redeploys staging with new migration via supabase db push in CI

# After staging validation
git checkout main
git merge staging
git push origin main
# Production deploy runs supabase db push
```

---

## Environment Variable Reference

Complete reference of all env vars, their purpose, and whether they differ between environments.

| Variable | Production | Staging | Local | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod URL | staging URL | `http://localhost:54321` | Differs per env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod key | staging key | local key | Differs per env |
| `SUPABASE_SERVICE_ROLE_KEY` | prod service key | staging service key | local service key | 🔴 Secret |
| `NEXTAUTH_SECRET` | 32+ char random | different 32+ char | any 32+ char | 🔴 Secret, differs per env |
| `NEXTAUTH_URL` | `https://thepossah.com` | `https://staging.thepossah.com` | `http://localhost:3000` | Differs per env |
| `GOOGLE_CLIENT_ID` | same | same | same | Shared |
| `GOOGLE_CLIENT_SECRET` | same | same | same | 🔴 Secret, shared |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | `rzp_test_...` | `rzp_test_...` | 🔴 Differs per env |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` | `rzp_test_...` | `rzp_test_...` | 🔴 Differs per env |
| `RAZORPAY_KEY_SECRET` | live secret | test secret | test secret | 🔴 Secret |
| `RAZORPAY_WEBHOOK_SECRET` | live webhook secret | test webhook secret | test secret | 🔴 Secret |
| `RESEND_API_KEY` | production `re_...` | same or staging domain | same | 🔴 Secret |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | prod GA4 property | test GA4 property | test or empty | Analytics |
| `UPSTASH_REDIS_REST_URL` | production Redis | staging Redis | local Redis or same | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | prod token | staging token | staging token | 🔴 Secret |
| `SENTRY_DSN` | production DSN | staging DSN | same or empty | Error monitoring |
| `SENTRY_AUTH_TOKEN` | for source maps | for source maps | — | Build-time only |
| `LOG_LEVEL` | `info` | `debug` | `debug` | |

---

## Rollback Procedure

If a production deployment causes a critical issue:

**Option 1 — Instant rollback via Vercel (no code change)**
1. Go to Vercel project → Deployments
2. Find the last known-good deployment
3. Click "..." → "Promote to Production"
4. Site reverts in ~60 seconds

**Option 2 — Git revert**
```bash
git revert HEAD
git push origin main
# Triggers new deployment
```

**Option 3 — Database rollback (if migration caused data issue)**
1. In Supabase → Backups, find pre-migration backup
2. Restore to a new Supabase project
3. Update env vars to point to the restored project
4. Re-deploy
5. Investigate the migration issue before re-applying

---

## Go-Live Checklist

### Pre-DNS cutover (all must be ✅)
- [ ] All CI gates passing on `main`
- [ ] All unit tests passing
- [ ] Staging smoke test passed completely
- [ ] Staging checkout completed successfully with test payment
- [ ] Production Supabase has all migrations applied
- [ ] Production Supabase has RLS policies active
- [ ] Production Supabase `admin_users` has admin email seeded
- [ ] Production Supabase storage buckets created
- [ ] All Vercel production env vars set
- [ ] Razorpay live mode webhook configured at correct URL
- [ ] Razorpay live mode key IDs in production env vars
- [ ] Google OAuth redirect URIs include `thepossah.com`
- [ ] NEXTAUTH_URL set to `https://thepossah.com`
- [ ] Upstash Redis instance provisioned
- [ ] Sentry DSN configured and receiving events (test with a deliberate error)
- [ ] HSTS header is present on staging (confirms it will be on production)
- [ ] Security headers verified on staging

### DNS cutover
- [ ] Domain TTL lowered to 300 before cutover
- [ ] A record pointed to Vercel IP
- [ ] CNAME for www configured
- [ ] SSL certificate auto-provisioned by Vercel (wait for green padlock)

### Post-DNS (within 1 hour of cutover)
- [ ] `https://thepossah.com` loads correctly
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Admin login works (`/auth/signin` → Google OAuth → redirect to `/admin`)
- [ ] First production test transaction completed and verified
- [ ] Admin notification email received for test transaction
- [ ] Sentry dashboard shows no unexpected errors
- [ ] UptimeRobot monitoring active and showing green
- [ ] Google Search Console ownership verified
- [ ] Sitemap submitted to GSC
