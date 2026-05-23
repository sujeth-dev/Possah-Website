/**
 * scripts/audit-products.mjs
 *
 * Audits all products in the database:
 *   - Prints every product's live URL  (/shop/<category>/<slug>)
 *   - Flags bad craft_story_image values (page URLs, not real images)
 *   - Nulls the bad ones automatically
 *   - Flags products with no category assigned
 *
 * Run: node scripts/audit-products.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL       = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const IMAGE_EXTENSIONS = /\.(webp|jpg|jpeg|png|gif|svg|avif|tiff?|bmp)(\?|$)/i
const KNOWN_IMAGE_HOSTS = ['supabase.co', 'cloudinary.com', 'imagekit.io', 'imgix.net']

function isImageUrl(url) {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    if (KNOWN_IMAGE_HOSTS.some(h => hostname.endsWith(h))) return true
    return IMAGE_EXTENSIONS.test(pathname)
  } catch {
    return false
  }
}

async function main() {
  console.log('Fetching all products...\n')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, slug, is_active, craft_story_image, categories:category_id(name, slug)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Query failed:', error.message)
    process.exit(1)
  }

  console.log(`Found ${products.length} products\n`)
  console.log('─'.repeat(80))

  const badCraftImage  = []
  const noCategory     = []

  for (const p of products) {
    const cat     = Array.isArray(p.categories) ? p.categories[0] : p.categories
    const catName = cat?.name  ?? '(no category)'
    const catSlug = cat?.slug  ?? null
    const url     = catSlug ? `/shop/${catSlug}/${p.slug}` : `⚠ NO CATEGORY — /shop/?/${p.slug}`
    const csi     = p.craft_story_image

    const issues = []
    if (!catSlug)            issues.push('NO_CATEGORY')
    if (csi && !isImageUrl(csi)) issues.push(`BAD_CRAFT_IMG`)

    const icon = issues.length ? '⚠️ ' : '✓  '
    console.log(`${icon}${p.name}`)
    console.log(`   active : ${p.is_active}`)
    console.log(`   link   : ${url}`)
    console.log(`   cat    : ${catName}`)
    if (csi) {
      const label = isImageUrl(csi) ? 'craft_img' : 'craft_img ❌'
      console.log(`   ${label}: ${csi.slice(0, 90)}`)
    }
    if (issues.length) console.log(`   ISSUES : ${issues.join(' | ')}`)
    console.log()

    if (!catSlug) noCategory.push(p)
    if (csi && !isImageUrl(csi)) badCraftImage.push(p)
  }

  console.log('─'.repeat(80))
  console.log(`\nSummary`)
  console.log(`  Total        : ${products.length}`)
  console.log(`  No category  : ${noCategory.length}`)
  console.log(`  Bad craft img: ${badCraftImage.length}`)

  // ── Auto-fix bad craft_story_image values ─────────────────────────────────
  if (badCraftImage.length > 0) {
    console.log(`\nNulling ${badCraftImage.length} bad craft_story_image URL(s)...`)
    for (const p of badCraftImage) {
      const { error: fixErr } = await supabase
        .from('products')
        .update({ craft_story_image: null })
        .eq('id', p.id)

      if (fixErr) {
        console.error(`  ✗ ${p.name}: ${fixErr.message}`)
      } else {
        console.log(`  ✓ Fixed: ${p.name}`)
      }
    }
  }

  if (noCategory.length > 0) {
    console.log(`\n⚠ Products with no category (links will 404 — assign a category in the admin):`)
    for (const p of noCategory) {
      console.log(`  - ${p.name} (id: ${p.id})`)
    }
  }

  console.log('\nDone.')
}

main()
