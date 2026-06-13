# The Possah Verification Matrix

**Date:** 2026-06-12

## Coverage Snapshot

| Area | Count | Verification status | Evidence |
|---|---:|---|---|
| Storefront page routes | 27 | Partial | route inventory + HTTP smoke |
| Admin page routes | 15 | Partial | route inventory only; admin harness blocked by auth drift |
| API routes total | 29 | Partial | vitest + payment suite + smoke |
| Admin API routes | 17 | Blocked for deep verification | current harness unauthenticated |
| Playwright E2E specs | 1 | Insufficient | `tests/e2e/checkout.spec.ts` only |

## Public Route Smoke Matrix

| Route | Result | Notes |
|---|---|---|
| `/` | `200` during repeated smoke | previously saw transient `500` while server was under load; did not reproduce on repeat |
| `/about` | `200` | runtime route works locally, but build still fails for `/about` |
| `/women` | `200` during repeated smoke | same transient instability note as homepage |
| `/auth/signin` | `200` | public auth entry loads |
| `/robots.txt` | `200` | route healthy |
| `/sitemap.xml` | `500` | hard failure; release blocker |
| `/api/health` | `200` | DB connected |

## Admin/API Smoke Matrix

| Route | Expected unauthenticated result | Actual |
|---|---|---|
| `/api/admin/products` | `401` | `401` |
| `/api/admin/orders` | `401` | `401` |
| `/admin` | redirect to sign-in or homepage based on auth state | not fully browser-verified in this audit |

## Connected Test Matrix

| Command | Result | Notes |
|---|---|---|
| `npm run lint` | Pass with warning | missing `alt` enforcement in `ImageWithFallback` |
| `npm run typecheck` | Pass | no TS errors |
| `npx vitest run` | `69/69` pass | stderr still shows mocked Supabase issues |
| `npm run test:payment` | `102/104` pass | two failures are status-code expectation drift |
| `npm run test:api` | `5/92` pass | dominated by auth/test-harness mismatch |
| `npm run build` | Fail | `Failed to collect page data for /about` |

## Dependency Graph

### Storefront and content

`app/(shop)/* -> components/homepage|shop|layout|pdp -> lib/utils + lib/store + lib/supabase/public|server -> Supabase -> R2/Supabase storage`

### Authentication and admin

`Google OAuth -> lib/auth.ts -> admin_users allowlist -> JWT isAdmin -> middleware.ts + lib/admin-auth.ts -> app/admin/* + app/api/admin/* -> lib/supabase/admin -> Supabase`

### Checkout and payment recovery

`CheckoutForm -> /api/orders/create -> lib/razorpay.ts -> Razorpay Orders API`

`Razorpay client callback -> /api/payments/verify -> orders`

`Razorpay webhook -> /api/payments/webhook -> orders + RPC decrement_variant_stock + send-order-emails -> Resend`

`IncompleteOrderCard -> lib/razorpay-client.ts -> /api/orders/[orderNumber]/retry-payment`

## Critical Paths

1. Storefront merchandising:
   `home/women/category/search -> public Supabase reads -> product/category rendering`
2. Purchase funnel:
   `PDP -> cart -> checkout -> order create -> Razorpay -> verify/webhook -> confirmation email`
3. Order recovery:
   `account incomplete order -> retry payment -> Razorpay modal -> verify/webhook`
4. Admin operations:
   `Google sign-in -> isAdmin JWT -> /admin pages -> /api/admin/* -> revalidatePath -> storefront updates`

## Blocked or Partial Areas

| Area | Status | Why |
|---|---|---|
| Full admin CRUD verification | Blocked | harness does not authenticate under current auth model |
| Browser-led responsive/accessibility audit | Partial | no maintained multi-route E2E/browser suite in repo |
| Production-safe load validation | Partial | k6 script exists, but this audit did not run a separate staging target |
| Production observability review | Partial | no monitoring/backup runbook artifacts found in repo |
