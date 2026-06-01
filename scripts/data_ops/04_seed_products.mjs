/**
 * PHASE 4 — SEED 42 PRODUCTS
 *
 * Reads category_map.json + image_manifest.json produced by phases 1 and 3.
 * For each product inserts:
 *   1. products row
 *   2. product_images rows (one per URL, position = 1-indexed)
 *   3. product_variants rows (S / M / L / XL × 10 stock)
 *   4. product_tags rows (one per occasion tag)
 *
 * Idempotent: uses upsert on slug for products. Re-running is safe.
 *
 * Run: node scripts/data_ops/04_seed_products.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { supabase, check } from './lib/db.mjs'
import { ALL_PRODUCTS, SIZES, STOCK_PER_VARIANT } from './lib/products.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadJson(filename) {
  const p = resolve(__dirname, filename)
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch (e) {
    throw new Error(`Cannot read ${filename} — did phase 1 and 3 complete?\n  ${e.message}`)
  }
}

async function seedProducts() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 4 — SEED PRODUCTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const categoryMap = loadJson('category_map.json')
  const imageManifest = loadJson('image_manifest.json')

  let inserted = 0
  let skipped = 0
  const errors = []

  for (const product of ALL_PRODUCTS) {
    const catId = categoryMap[product.category]
    if (!catId) {
      console.error(`  ✗ [${product.slug}] category '${product.category}' not in category_map.json`)
      errors.push({ slug: product.slug, error: `unknown category ${product.category}` })
      continue
    }

    const imageUrls = imageManifest[product.slug]
    if (!imageUrls || imageUrls.length === 0) {
      console.error(`  ✗ [${product.slug}] no images in manifest — did phase 3 complete?`)
      errors.push({ slug: product.slug, error: 'no images in manifest' })
      continue
    }

    process.stdout.write(`  [${product.skuCode}] ${product.name} ...`)

    try {
      // ── 1. UPSERT product ──────────────────────────────────────────────────
      const { data: productRow, error: productErr } = await supabase
        .from('products')
        .upsert(
          {
            name: product.name,
            slug: product.slug,
            description: product.description,
            category_id: catId,
            price: product.price,
            sub_line: product.subLine,
            fabric: product.fabric,
            care_instructions: product.care,
            is_active: true,
            is_new_arrival: true,
            is_festive: product.is_festive ?? false,
            is_bridal:  product.is_bridal  ?? false,
          },
          { onConflict: 'slug' },
        )
        .select('id')
        .single()
      check(`upsert product ${product.slug}`, productErr)
      const productId = productRow.id

      // ── 2. DELETE + INSERT images (fresh on each run) ──────────────────────
      const { error: delImgErr } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
      check(`delete images ${product.slug}`, delImgErr)

      const imageRows = imageUrls.map((url, i) => ({
        product_id: productId,
        url,
        position: i + 1,
        alt: `${product.name} — image ${i + 1}`,
      }))
      const { error: imgErr } = await supabase.from('product_images').insert(imageRows)
      check(`insert images ${product.slug}`, imgErr)

      // ── 3. DELETE + INSERT variants (fresh on each run) ───────────────────
      const { error: delVarErr } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)
      check(`delete variants ${product.slug}`, delVarErr)

      const variantRows = SIZES.map(size => ({
        product_id: productId,
        size,
        colour_name: product.colour,
        stock_qty: STOCK_PER_VARIANT,
      }))
      const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
      check(`insert variants ${product.slug}`, varErr)

      // ── 4. DELETE + INSERT tags (fresh on each run) ───────────────────────
      const { error: delTagErr } = await supabase
        .from('product_tags')
        .delete()
        .eq('product_id', productId)
      check(`delete tags ${product.slug}`, delTagErr)

      if (product.tags && product.tags.length > 0) {
        const tagRows = product.tags.map(tag => ({ product_id: productId, tag }))
        const { error: tagErr } = await supabase.from('product_tags').insert(tagRows)
        check(`insert tags ${product.slug}`, tagErr)
      }

      console.log(` ✓  (${imageUrls.length} img, ${SIZES.length} variants)`)
      inserted++
    } catch (e) {
      console.log(` ✗`)
      console.error(`    Error: ${e.message}`)
      errors.push({ slug: product.slug, error: e.message })
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Inserted : ${inserted} products`)
  console.log(`  Skipped  : ${skipped}`)
  console.log(`  Errors   : ${errors.length}`)

  if (errors.length > 0) {
    console.error('\n  Errors:')
    for (const e of errors) console.error(`    ${e.slug}: ${e.error}`)
    process.exit(1)
  }

  // Quick counts
  const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
  const { count: vCount } = await supabase.from('product_variants').select('*', { count: 'exact', head: true })
  const { count: iCount } = await supabase.from('product_images').select('*', { count: 'exact', head: true })
  console.log(`\n  DB counts → products:${pCount} variants:${vCount} images:${iCount}`)
  console.log('\n  PHASE 4 COMPLETE ✓\n')
}

seedProducts().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
