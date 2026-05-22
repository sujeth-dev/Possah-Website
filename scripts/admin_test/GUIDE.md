# Admin API Test Suite — Agent Guide

This folder is a self-contained, iteratable test suite for every Possah admin API endpoint.
Any agent can follow this guide end-to-end, produce a full pass/fail report, and propose fixes for anything that fails.

---

## Folder map

```
scripts/admin_test/
  GUIDE.md                ← this file
  run.mjs                 ← orchestrator (seed → test → report → cleanup)
  seed.mjs                ← inserts test data into live Supabase via service role
  cleanup.mjs             ← removes all test rows, restores singleton defaults
  lib/
    env.mjs               ← parses .env.local
    db.mjs                ← Supabase client (service role, bypasses RLS)
    http.mjs              ← fetch wrapper for API calls (localhost:3000)
    assert.mjs            ← assertion helpers + result collector
    report.mjs            ← writes markdown report to reports/
  tests/
    01-categories.mjs     ← LIST, CREATE, BULK REORDER, UPDATE, DELETE, DELETE blocked
    02-products.mjs       ← LIST+filters, CREATE, GET, UPDATE scalars+variants, SOFT DELETE
    03-orders.mjs         ← LIST+filters, CSV export, GET, UPDATE fulfillment+tracking
    04-coupons.mjs        ← LIST, CREATE, UPDATE, DELETE, dupe code
    05-reviews.mjs        ← LIST filters, APPROVE single, REJECT, BULK APPROVE, DELETE
    06-journal.mjs        ← LIST, CREATE, GET, UPDATE publish/draft, DELETE
    07-settings.mjs       ← GET, PATCH, validation errors, restore
    08-homepage.mjs       ← GET, PATCH hero/tiles/arrivals, validation, restore
  reports/
    test-results-{ts}.md  ← generated on each run
```

---

## Prerequisites

### 1. Node version
Requires Node 18+ (native fetch + top-level await in `.mjs` files).
Check: `node --version`  →  must be ≥ `v18.0.0`

### 2. Dev server must be running
The test suite hits HTTP endpoints at `http://localhost:3000`.
The route auth guard bypasses only when `NODE_ENV=development`.

```bash
# Terminal 1 — keep this running during tests
NODE_ENV=development npm run dev
```

Wait for `✓ Ready in ...ms` before running tests.

### 3. Supabase credentials
The seed and cleanup scripts use the service role key from `.env.local`.
Both variables must be present:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Check: `cat .env.local | grep -E '(SUPABASE_URL|SERVICE_ROLE)'`

### 4. No additional installs needed
`@supabase/supabase-js` is already in `node_modules`.
Scripts run directly with `node` (no `tsx`, no transpiler).

---

## Running the tests

### Full run (recommended)

```bash
# Terminal 2
npm run test:api
```

Equivalent to:
```bash
NODE_ENV=development node scripts/admin_test/run.mjs
```

This will:
1. Check NODE_ENV=development
2. Ping `GET /api/health` — fails fast if server isn't up
3. Seed all test data into Supabase
4. Run all 8 test modules in order
5. Print live pass/fail output to terminal
6. Write full report to `scripts/admin_test/reports/test-results-{timestamp}.md`
7. Clean up all test rows + restore singleton defaults
8. Exit code `0` if all pass, `1` if any fail

---

### Keep seed data for manual inspection

```bash
npm run test:api:keep
# or
NODE_ENV=development SKIP_CLEANUP=1 node scripts/admin_test/run.mjs
```

After manual inspection, clean up:
```bash
node scripts/admin_test/cleanup.mjs
```

---

### Seed only (without running tests)

```bash
npm run seed:test
# or
node scripts/admin_test/seed.mjs
```

Idempotent — safe to re-run. Upserts by slug/code so no duplicates.

---

### Cleanup only

```bash
npm run cleanup:test
# or
node scripts/admin_test/cleanup.mjs
```

Deletes all rows where:
- `slug ILIKE 'test-%'` (products, categories, journal)
- `order_number ILIKE 'TEST-%'` (orders)
- `code ILIKE 'TEST%'` (coupons)
- Restores `store_settings` and `homepage_config` to safe defaults

---

### Run a single test module

```bash
# Seed first, then run just one module manually
node scripts/admin_test/seed.mjs
NODE_ENV=development node -e "
  import('./tests/02-products.mjs').then(m => m.run({ product_a_id: 'PASTE_ID_HERE' }))
"
```

For most modules you need the `ctx` IDs from seed output.
Run `node scripts/admin_test/seed.mjs` and copy the printed IDs.

---

## Reading the terminal output

Live output while tests run:
```
────────────────────────────────────────────────
  2 / 8  PRODUCTS
────────────────────────────────────────────────
  ✓ [LIST] GET /products → 200
  ✓ [LIST search] test-product-alpha found in search results
  ✗ [UPDATE variants] variants replaced (count = 1)
       expected  1
       actual    2
       fix       Expected 1 variant after replace, got 2. Check delete+reinsert logic.
```

- `✓` green = assertion passed
- `✗` red = assertion failed, expected/actual printed, fix hint shown

---

## Reading the report

Report is written to `scripts/admin_test/reports/test-results-{timestamp}.md`.

### Summary table
One row per resource. Shows pass/fail count at a glance.

### Fix plan
Only present when failures exist. Each failure gets its own section:
```md
### ✗ Products → UPDATE variants → variants replaced (count = 1)
- Expected: `1`
- Actual: `2`
- Fix: Expected 1 variant after replace, got 2. Check delete+reinsert logic.
```

### Detailed results
Full table of every assertion across all resources.

---

## Common failures and their fixes

### `401 Unauthorized` on every request
**Cause:** `NODE_ENV` is not `development` — the auth guard did not bypass.
**Fix:** Run dev server with `NODE_ENV=development npm run dev`. Confirm with `echo $NODE_ENV`.

### `[http] Timeout` on every request
**Cause:** Dev server is not running or crashed.
**Fix:** Start it — `NODE_ENV=development npm run dev`. Check Terminal 1 for errors.

### `[db] FATAL: Missing env vars`
**Cause:** `.env.local` not found or variables missing.
**Fix:** Confirm `.env.local` is in the project root and contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### `Seed failed: insert or update on table "products" violates foreign key constraint`
**Cause:** Category insert failed before product insert.
**Fix:** Run `node scripts/admin_test/seed.mjs` standalone and check which step fails. Category slug `test-cat-001` must insert first.

### `seeded test-cat-001 present` FAIL
**Cause:** Seed ran but category row is missing.
**Fix:** Run seed standalone. Check Supabase dashboard `categories` table manually for `slug = test-cat-001`.

### `all returned products are inactive` FAIL
**Cause:** `productB` was seeded with `is_active: true` instead of `false`.
**Fix:** Check `SEEDS.productB.is_active` in `seed.mjs` — must be `false`.

### CSV export tests fail
**Cause:** Auth guard blocking, or no orders in DB.
**Fix:** Confirm seed ran. Check `orders` table in Supabase for `order_number ILIKE 'TEST-%'`.

### `occasion_tiles with 6 items → 422` FAIL (got 200)
**Cause:** The Zod `.length(8)` validation is not enforced on the occasion_tiles field.
**Fix:** In `app/api/admin/homepage/route.ts`, check `HomepageUpdateSchema`:
```ts
occasion_tiles: z.array(OccasionTileSchema).length(8).optional()
```
The `.length(8)` must be present on the schema.

### Settings `free_shipping_threshold updated` FAIL
**Cause:** Supabase returns numeric fields as strings from some column types.
**Fix:** In the verify GET, compare `Number(res.data?.free_shipping_threshold) === 9999` not strict equality.
The assertion already does `Number(...)` coercion — if it fails, the PATCH itself didn't save.

### `published_at is null` FAIL after `PATCH { published_at: null }`
**Cause:** The PATCH handler may be skipping `null` values.
**Fix:** In `app/api/admin/journal/[id]/route.ts`, check the updates builder:
```ts
if (d.published_at !== undefined) updates.published_at = d.published_at
```
The condition must be `!== undefined` not `!== null` — null is a valid value meaning "draft".

---

## How to add a new test case to an existing module

1. Open the relevant test file, e.g. `tests/02-products.mjs`.
2. Add a new block inside the `run(ctx)` function:
```js
// ── MY NEW TEST ──────────────────────────────────────────────────────────────
{
  const res = await api('GET', '/api/admin/products?active=true')
  A.status('LIST active=true', 'GET /products?active=true → 200', res, 200)
  if (Array.isArray(res.data?.products)) {
    const allActive = res.data.products.every(p => p.is_active === true)
    A.ok('LIST active=true', 'all returned products are active', allActive,
      'active=true filter not applied. Check .eq("is_active", true).')
  }
}
```
3. Run `npm run test:api` to see it execute.

### Assert method reference

| Method | Signature | Use for |
|--------|-----------|---------|
| `A.status` | `(action, label, res, expectedStatus)` | HTTP status code checks |
| `A.field`  | `(action, label, obj, key, expectedVal)` | Deep-equal field value check |
| `A.isArray`| `(action, label, val)` | Verify response is an array |
| `A.ok`     | `(action, label, passed, fixHint)` | Any boolean assertion |
| `A.hasError`| `(action, label, res)` | Error response has `error` string field |

---

## How to add a new resource

1. Create `tests/09-your-resource.mjs`:
```js
import { api } from '../lib/http.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

export async function run(ctx) {
  printHeader('9 / 9  YOUR RESOURCE')
  const A = makeAssertCollection('YourResource')

  // ... your tests ...

  return A.results
}
```

2. Add the API route to `app/api/admin/your-resource/route.ts`.

3. Import and register in `run.mjs`:
```js
import { run as runYourResource } from './tests/09-your-resource.mjs'
// ...
const modules = [
  // ... existing ...
  ['YourResource', runYourResource],
]
```

4. If the resource needs seed data, add it to `seed.mjs` and `cleanup.mjs`.

---

## Seed data reference

All test data uses these stable identifiers:

| Resource | Identifier | Value |
|----------|-----------|-------|
| Category | slug | `test-cat-001` |
| Product A | slug | `test-product-alpha` |
| Product B | slug | `test-product-beta` (inactive) |
| Order A | order_number | `TEST-001` (paid, unfulfilled) |
| Order B | order_number | `TEST-002` (pending, processing) |
| Coupon A | code | `TESTPCT10` (10% percent) |
| Coupon B | code | `TESTFLAT200` (₹200 flat) |
| Reviews | reviewer_name | `Test Reviewer One/Two/Three` |
| Article A | slug | `test-article-alpha` (published) |
| Article B | slug | `test-article-beta` (draft) |

Products and orders NOT created by the test runner (seeded directly):
- Tests CREATE additional rows with `test-product-gamma-{timestamp}` slugs and `TESTNEW{N}` coupon codes
- These are cleaned up either by the DELETE test assertions or by `cleanup.mjs`

---

## CI integration

The run script exits with code `1` on any failure — works with any CI system:
```yaml
# GitHub Actions example
- name: Test admin APIs
  run: npm run test:api
  env:
    NODE_ENV: development
    NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

The report is written to `scripts/admin_test/reports/` — add it as a CI artifact to keep history.

---

## Cleanup behaviour summary

`cleanup.mjs` deletes by stable markers — never touches non-test data:

| Table | Deletion criteria |
|-------|------------------|
| `journal_articles` | slug IN (article slugs) |
| `reviews` | product_id IN (test product IDs) |
| `products` | slug ILIKE `test-product-%` (cascade → images/variants/tags) |
| `categories` | slug ILIKE `test-cat-%` |
| `orders` | order_number ILIKE `TEST-%` |
| `coupons` | code ILIKE `TEST%` |
| `store_settings` | upsert singleton back to defaults |
| `homepage_config` | upsert singleton back to defaults |
