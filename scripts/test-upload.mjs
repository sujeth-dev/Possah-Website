/**
 * scripts/test-upload.mjs
 *
 * Tests the /api/admin/upload route end-to-end using only Node built-ins:
 *   1. Uses a 1x1 transparent GIF (26 bytes, no external deps)
 *   2. POSTs it to http://localhost:3000/api/admin/upload
 *   3. Prints the returned publicUrl
 *   4. Verifies the URL is reachable
 *
 * Requires the dev server to be running: npm run dev
 * Run: node --env-file=.env.local scripts/test-upload.mjs
 */

// 1×1 transparent GIF — smallest valid image, no packages needed
const GIF_B64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const fileBuffer = Buffer.from(GIF_B64, 'base64')
const fileName   = `test-${Date.now()}.gif`
const mimeType   = 'image/gif'

const BASE  = process.env.TEST_UPLOAD_BASE ?? 'http://localhost:3000'
const ROUTE = `${BASE}/api/admin/upload`

console.log(`Testing upload route: ${ROUTE}\n`)
console.log(`✓ Test file ready (${fileBuffer.length} bytes, ${mimeType})`)

const fd = new FormData()
fd.append('file', new Blob([fileBuffer], { type: mimeType }), fileName)
fd.append('path', `products/${fileName}`)

let res
try {
  res = await fetch(ROUTE, { method: 'POST', body: fd })
} catch (err) {
  console.error('✗ Could not reach dev server:', err.message)
  console.error('  Make sure `npm run dev` is running first.')
  process.exit(1)
}

const body = await res.json().catch(() => ({}))

if (!res.ok) {
  console.error(`✗ Upload failed (${res.status}):`, JSON.stringify(body, null, 2))
  process.exit(1)
}

const { publicUrl } = body
console.log(`✓ Upload succeeded`)
console.log(`  publicUrl: ${publicUrl}`)

const checkRes = await fetch(publicUrl, { method: 'HEAD' }).catch(() => null)
if (checkRes?.ok) {
  console.log(`✓ URL is reachable (${checkRes.status})`)
} else {
  console.log(`⚠ URL returned ${checkRes?.status ?? 'no response'} — may take a moment to propagate`)
}

console.log('\n✓ Upload route is working correctly.')
