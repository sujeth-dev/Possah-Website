/**
 * Payment test cleanup — removes all seeded test data.
 * Never touches non-test rows. Safe to run multiple times.
 */

import { db } from './lib/db.mjs'

export async function cleanup() {
  console.log('\n🧹 Cleaning up payment test data…\n')

  const steps = [
    async () => {
      const { error, count } = await db
        .from('orders')
        .delete({ count: 'exact' })
        .ilike('order_number', 'PAY-TEST-%')
      if (error) throw new Error(`orders: ${error.message}`)
      console.log(`  ✓ orders deleted: ${count ?? '?'}`)
    },
    async () => {
      const { error, count } = await db
        .from('coupons')
        .delete({ count: 'exact' })
        .ilike('code', 'PAYTEST%')
      if (error) throw new Error(`coupons: ${error.message}`)
      console.log(`  ✓ coupons deleted: ${count ?? '?'}`)
    },
    async () => {
      const { data: products } = await db
        .from('products')
        .select('id')
        .ilike('slug', 'test-pay-product-%')
      if (!products?.length) { console.log(`  ✓ variants: none found`); return }
      const ids = products.map(p => p.id)
      const { error, count } = await db
        .from('product_variants')
        .delete({ count: 'exact' })
        .in('product_id', ids)
      if (error) throw new Error(`variants: ${error.message}`)
      console.log(`  ✓ variants deleted: ${count ?? '?'}`)
    },
    async () => {
      const { data: products } = await db
        .from('products')
        .select('id')
        .ilike('slug', 'test-pay-product-%')
      if (!products?.length) { console.log(`  ✓ product_images: none found`); return }
      const ids = products.map(p => p.id)
      const { error } = await db
        .from('product_images')
        .delete()
        .in('product_id', ids)
      if (error) throw new Error(`product_images: ${error.message}`)
      console.log(`  ✓ product_images deleted`)
    },
    async () => {
      const { error, count } = await db
        .from('products')
        .delete({ count: 'exact' })
        .ilike('slug', 'test-pay-product-%')
      if (error) throw new Error(`products: ${error.message}`)
      console.log(`  ✓ products deleted: ${count ?? '?'}`)
    },
    async () => {
      const { error, count } = await db
        .from('categories')
        .delete({ count: 'exact' })
        .ilike('slug', 'test-pay-cat-%')
      if (error) throw new Error(`categories: ${error.message}`)
      console.log(`  ✓ categories deleted: ${count ?? '?'}`)
    },
  ]

  let allOk = true
  for (const step of steps) {
    try {
      await step()
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
      allOk = false
    }
  }

  if (allOk) {
    console.log('\n✅ Cleanup complete.\n')
  } else {
    console.error('\n⚠️  Cleanup finished with errors. Check above.\n')
  }
}

// Allow running standalone: node scripts/payment_test/cleanup.mjs
if (process.argv[1].endsWith('cleanup.mjs')) {
  cleanup().catch(err => { console.error('\n❌ Cleanup failed:', err.message); process.exit(1) })
}
