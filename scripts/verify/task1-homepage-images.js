/**
 * Task 1 Verification Script — Admin Homepage Image CRUD
 *
 * Tests:
 *   1. PATCH /api/admin/homepage with each new field
 *   2. GET /api/admin/homepage and assert fields are persisted
 *   3. Log PASS/FAIL per field
 *
 * Usage:
 *   node scripts/verify/task1-homepage-images.js [BASE_URL]
 *   Default BASE_URL: http://localhost:3000
 *
 * Requires:
 *   - Dev server running (npm run dev)
 *   - Local Supabase running (supabase start) OR real DB
 *   - Admin session cookie OR ADMIN_COOKIE env var
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const ADMIN_COOKIE = process.env.ADMIN_COOKIE || ''

const TEST_URLS = {
  category_split: {
    ethnic_image:  'https://cdn.thepossah.com/ui/placeholder.svg',
    western_image: 'https://cdn.thepossah.com/ui/placeholder.svg',
  },
  category_circles: {
    sarees:     'https://cdn.thepossah.com/ui/placeholder.svg',
    lehengas:   'https://cdn.thepossah.com/ui/placeholder.svg',
    co_ords:    'https://cdn.thepossah.com/ui/placeholder.svg',
    dresses:    'https://cdn.thepossah.com/ui/placeholder.svg',
    kurta_sets: 'https://cdn.thepossah.com/ui/placeholder.svg',
    tops:       'https://cdn.thepossah.com/ui/placeholder.svg',
  },
  mtm_cta: {
    image_url: 'https://cdn.thepossah.com/ui/placeholder.svg',
  },
}

const headers = {
  'Content-Type': 'application/json',
  ...(ADMIN_COOKIE ? { Cookie: ADMIN_COOKIE } : {}),
}

let passed = 0
let failed = 0

function pass(msg) { console.log(`  ✓ PASS  ${msg}`); passed++ }
function fail(msg) { console.error(`  ✗ FAIL  ${msg}`); failed++ }

async function run() {
  console.log(`\nTask 1 Verification — ${BASE_URL}\n`)

  // ── 1. PATCH all three new fields ──────────────────────────────────────
  console.log('Step 1: PATCH category_split, category_circles, mtm_cta...')
  let patchOk = true
  for (const [field, value] of Object.entries(TEST_URLS)) {
    const res = await fetch(`${BASE_URL}/api/admin/homepage`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ [field]: value }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok && json.ok) {
      pass(`PATCH ${field} → 200 ok`)
    } else {
      fail(`PATCH ${field} → ${res.status} ${JSON.stringify(json)}`)
      patchOk = false
    }
  }

  if (!patchOk) {
    console.error('\n  Some PATCHes failed — cannot verify GET. Check auth (set ADMIN_COOKIE env var).\n')
    process.exit(1)
  }

  // ── 2. GET and assert fields are present ───────────────────────────────
  console.log('\nStep 2: GET and assert all three fields returned...')
  const getRes = await fetch(`${BASE_URL}/api/admin/homepage`, { headers })
  const data = await getRes.json().catch(() => null)

  if (!getRes.ok || !data) {
    fail(`GET /api/admin/homepage → ${getRes.status}`)
    process.exit(1)
  }

  // category_split
  if (data.category_split?.ethnic_image && data.category_split?.western_image) {
    pass('category_split has ethnic_image and western_image')
  } else {
    fail(`category_split missing fields — got: ${JSON.stringify(data.category_split)}`)
  }

  // category_circles
  const circleKeys = ['sarees', 'lehengas', 'co_ords', 'dresses', 'kurta_sets', 'tops']
  const allCircles = circleKeys.every(k => data.category_circles?.[k])
  if (allCircles) {
    pass('category_circles has all 6 keys')
  } else {
    fail(`category_circles missing keys — got: ${JSON.stringify(data.category_circles)}`)
  }

  // mtm_cta
  if (data.mtm_cta?.image_url) {
    pass('mtm_cta has image_url')
  } else {
    fail(`mtm_cta missing image_url — got: ${JSON.stringify(data.mtm_cta)}`)
  }

  // ── 3. Validate Zod rejects bad URLs ───────────────────────────────────
  console.log('\nStep 3: Validate Zod rejects non-URL values...')
  const badRes = await fetch(`${BASE_URL}/api/admin/homepage`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ category_split: { ethnic_image: 'not-a-url', western_image: 'also-not-a-url' } }),
  })
  if (badRes.status === 422) {
    pass('Zod correctly rejects non-URL image values (422)')
  } else {
    fail(`Expected 422 for invalid URL, got ${badRes.status}`)
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log(`${'─'.repeat(50)}\n`)

  if (failed > 0) process.exit(1)
}

run().catch(err => { console.error('Script error:', err.message); process.exit(1) })
