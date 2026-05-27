/**
 * PHASE 3 — UPLOAD IMAGES TO SUPABASE STORAGE
 *
 * Local products  : reads PNG files from Products/drive-1/ and drive-2/
 *                   converts to WebP via sharp, uploads to possah-media bucket
 * Ethnic products : fetches Unsplash CDN URL, converts to WebP, uploads
 *
 * Storage path: products/{slug}/{n}.webp  (1-indexed)
 * Output      : scripts/data_ops/image_manifest.json  { slug: [url, ...] }
 *
 * Idempotent  : uploads with upsert:true, re-running is safe.
 *
 * Prerequisite: npm install sharp --save-dev
 *
 * Run: node scripts/data_ops/03_upload_images.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { uploadToStorage } from './lib/db.mjs'
import { LOCAL_PRODUCTS, ETHNIC_PRODUCTS } from './lib/products.mjs'
import { PRODUCTS_ROOT } from './lib/env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Check sharp is installed ────────────────────────────────────────────────
let sharp
try {
  sharp = (await import('sharp')).default
} catch {
  console.error('\n✗ sharp is not installed.')
  console.error('  Run: npm install sharp --save-dev\n')
  process.exit(1)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert buffer to WebP at quality 85. */
async function toWebP(inputBuffer) {
  return sharp(inputBuffer).webp({ quality: 85 }).toBuffer()
}

/** Fetch a URL and return buffer. Uses native fetch (Node 18+). */
async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Get sorted PNG files from a product folder (skips JPG duplicates). */
function getPngFiles(drive, folder) {
  const dir = resolve(PRODUCTS_ROOT, drive, folder)
  const files = readdirSync(dir)
    .filter(f => extname(f).toLowerCase() === '.png')
    .sort()
  if (files.length === 0) throw new Error(`No PNG files in ${dir}`)
  return files.map(f => resolve(dir, f))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function uploadImages() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 3 — UPLOAD IMAGES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const manifest = {} // slug → [publicUrl, ...]
  let totalUploaded = 0
  const errors = []

  // ── LOCAL PRODUCTS ──────────────────────────────────────────────────────────
  console.log(`  LOCAL PRODUCTS (${LOCAL_PRODUCTS.length})\n`)

  for (const product of LOCAL_PRODUCTS) {
    const { slug, folder, drive } = product
    process.stdout.write(`  [${slug}]\n`)

    let pngFiles
    try {
      pngFiles = getPngFiles(drive, folder)
    } catch (e) {
      console.error(`    ✗ ${e.message}`)
      errors.push({ slug, error: e.message })
      continue
    }

    const urls = []
    for (let i = 0; i < pngFiles.length; i++) {
      const n = i + 1
      const storagePath = `products/${slug}/${n}.webp`
      try {
        const raw = readFileSync(pngFiles[i])
        const webpBuf = await toWebP(raw)
        const url = await uploadToStorage(storagePath, webpBuf)
        urls.push(url)
        totalUploaded++
        process.stdout.write(`    ✓ ${n}.webp\n`)
      } catch (e) {
        console.error(`    ✗ ${n}.webp: ${e.message}`)
        errors.push({ slug, file: pngFiles[i], error: e.message })
      }
    }

    if (urls.length > 0) manifest[slug] = urls
    else errors.push({ slug, error: 'No images uploaded' })
  }

  // ── ETHNIC PRODUCTS (Unsplash) ──────────────────────────────────────────────
  console.log(`\n  ETHNIC PRODUCTS (${ETHNIC_PRODUCTS.length})\n`)

  for (const product of ETHNIC_PRODUCTS) {
    const { slug, unsplashId } = product
    process.stdout.write(`  [${slug}]\n`)

    const url = `https://images.unsplash.com/${unsplashId}?w=1200&q=85&fm=jpg&fit=crop`
    const storagePath = `products/${slug}/1.webp`

    try {
      const raw = await fetchBuffer(url)
      const webpBuf = await toWebP(raw)
      const publicUrl = await uploadToStorage(storagePath, webpBuf)
      manifest[slug] = [publicUrl]
      totalUploaded++
      process.stdout.write(`    ✓ 1.webp (from Unsplash)\n`)
    } catch (e) {
      console.error(`    ✗ ${e.message}`)
      errors.push({ slug, error: e.message })
    }
  }

  // ── WRITE MANIFEST ──────────────────────────────────────────────────────────
  const manifestPath = resolve(__dirname, 'image_manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Uploaded : ${totalUploaded} images`)
  console.log(`  Products : ${Object.keys(manifest).length} / ${LOCAL_PRODUCTS.length + ETHNIC_PRODUCTS.length}`)
  console.log(`  Manifest : ${manifestPath}`)

  if (errors.length > 0) {
    console.error(`\n  ⚠ ${errors.length} error(s):`)
    for (const e of errors) console.error(`    ${e.slug}: ${e.error}`)
    console.error('\n  Fix errors above then re-run — uploads are idempotent.\n')
    process.exit(1)
  }

  console.log('\n  PHASE 3 COMPLETE ✓\n')
}

uploadImages().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
