/**
 * TEMPORARY DIAGNOSTIC ROUTE — DELETE AFTER DEBUGGING
 *
 * Hit: GET /api/admin/debug-products
 * Returns raw Supabase query result + any error details.
 * Shows exactly why admin/products shows empty.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}

  // ── 1. Can createAdminClient() even initialize? ──────────────────────────
  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
    results['1_client_init'] = 'OK'
  } catch (err: unknown) {
    return NextResponse.json({
      '1_client_init': 'FAILED',
      error: err instanceof Error ? err.message : String(err),
      fix: 'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing from environment',
    }, { status: 500 })
  }

  // ── 2. Simple products count (no joins) ──────────────────────────────────
  const { count: plainCount, error: plainErr } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  results['2_plain_count'] = plainErr
    ? { error: plainErr.message, code: plainErr.code, hint: plainErr.hint, details: plainErr.details }
    : { count: plainCount }

  // ── 3. products + categories join ────────────────────────────────────────
  const { data: joinCatData, error: joinCatErr } = await supabase
    .from('products')
    .select('id, name, categories:category_id ( name, slug )')
    .limit(1)

  results['3_join_categories'] = joinCatErr
    ? { error: joinCatErr.message, code: joinCatErr.code, hint: joinCatErr.hint, details: joinCatErr.details }
    : { ok: true, sample: joinCatData?.[0] }

  // ── 4. products + product_images join ────────────────────────────────────
  const { data: joinImgData, error: joinImgErr } = await supabase
    .from('products')
    .select('id, name, product_images ( url, position )')
    .limit(1)

  results['4_join_images'] = joinImgErr
    ? { error: joinImgErr.message, code: joinImgErr.code, hint: joinImgErr.hint, details: joinImgErr.details }
    : { ok: true, sample: joinImgData?.[0] }

  // ── 5. Full admin query (same as admin/products page) ────────────────────
  const { data: fullData, count: fullCount, error: fullErr } = await supabase
    .from('products')
    .select(`
      id, name, slug, price, compare_price, stock_qty, is_active, is_new_arrival, created_at,
      categories:category_id ( name, slug ),
      product_images ( url, position )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 4)

  results['5_full_query'] = fullErr
    ? { error: fullErr.message, code: fullErr.code, hint: fullErr.hint, details: fullErr.details }
    : { count: fullCount, rows_returned: fullData?.length, first_product: fullData?.[0]?.name }

  // ── 6. product_images count ──────────────────────────────────────────────
  const { count: imgCount, error: imgErr } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })

  results['6_image_count'] = imgErr
    ? { error: imgErr.message }
    : { count: imgCount }

  // ── 7. Environment sanity ────────────────────────────────────────────────
  results['7_env'] = {
    SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SERVICE_ROLE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(results, { status: 200 })
}
