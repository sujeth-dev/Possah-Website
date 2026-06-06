/**
 * Quick R2 connectivity test — uploads a tiny PNG, checks it's publicly accessible, then deletes it.
 * Run: node scripts/test-r2-connection.mjs
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const lines = readFileSync(envPath, 'utf8').split('\n')
for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  const val = trimmed.slice(eq + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

const { CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, NEXT_PUBLIC_R2_PUBLIC_URL } = process.env

const missing = ['CF_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'NEXT_PUBLIC_R2_PUBLIC_URL']
  .filter(k => !process.env[k])
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '))
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const BUCKET = R2_BUCKET_NAME
const TEST_KEY = 'test/r2-connection-check.txt'
const TEST_BODY = `R2 connection test — ${new Date().toISOString()}`

console.log('\n🔧 R2 Connection Test')
console.log(`   Bucket : ${BUCKET}`)
console.log(`   Account: ${CF_ACCOUNT_ID}`)
console.log(`   PubURL : ${NEXT_PUBLIC_R2_PUBLIC_URL}\n`)

// 1. Upload
process.stdout.write('1. Uploading test file ... ')
await client.send(new PutObjectCommand({
  Bucket: BUCKET,
  Key: TEST_KEY,
  Body: TEST_BODY,
  ContentType: 'text/plain',
  CacheControl: 'no-store',
}))
console.log('✅ uploaded')

// 2. Verify it exists in R2 via HeadObject
process.stdout.write('2. Verifying object exists in R2 ... ')
const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: TEST_KEY }))
console.log(`✅ found (${head.ContentLength} bytes, ETag: ${head.ETag})`)

// 3. Check public URL is reachable
const publicUrl = `${NEXT_PUBLIC_R2_PUBLIC_URL}/${TEST_KEY}`
process.stdout.write(`3. Fetching public URL ${publicUrl} ... `)
const res = await fetch(publicUrl)
if (!res.ok) {
  console.error(`❌ HTTP ${res.status} — bucket may not have public access enabled`)
  console.error('   → Go to Cloudflare R2 → possah-media → Settings → Public Access → Enable')
} else {
  const text = await res.text()
  console.log(`✅ HTTP ${res.status} — content: "${text.slice(0, 60)}"`)
}

// 4. Clean up
process.stdout.write('4. Deleting test file ... ')
await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: TEST_KEY }))
console.log('✅ deleted\n')

if (res.ok) {
  console.log('🎉 R2 is fully working — uploads, reads, and public access all OK.')
} else {
  console.log('⚠️  Upload/read works but public access needs to be enabled on the bucket.')
}
