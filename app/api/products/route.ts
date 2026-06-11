import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'
import type { ProductCardData } from '@/app/(shop)/page'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 24

function getString(val: string | null): string | undefined {
  return val ?? undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const categorySlug = getString(searchParams.get('category'))
    const occasion     = getString(searchParams.get('occasion'))
    const fabric       = getString(searchParams.get('fabric'))
    const size         = getString(searchParams.get('size'))
    const subLine      = getString(searchParams.get('sub_line'))
    const sort         = getString(searchParams.get('sort')) ?? 'newest'
    const page         = parseInt(searchParams.get('page') ?? '1', 10)
    // Optional: filter by is_top_selling (used by best-sellers page)
    const topSellingOnly = searchParams.get('top_selling') === 'true'
    const newInOnly      = searchParams.get('new_in') === 'true'

    const supabase = createPublicClient()

    let categoryId: string | null = null
    if (categorySlug) {
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()
      if (!category) {
        return NextResponse.json({ products: [], total: 0 }, { status: 200 })
      }
      categoryId = category.id
    }

    let query = supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug),
        product_images (url, alt, position),
        product_tags (tag)
      `, { count: 'exact' })
      .eq('is_active', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (topSellingOnly) {
      query = query.eq('is_top_selling', true)
    }
    if (newInOnly) {
      query = query.eq('is_new_arrival', true)
    }

    if (subLine) {
      query = query.eq('sub_line', subLine)
    }

    if (size) {
      const { data: sizeRows } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('size', size)
        .gt('stock_qty', 0)
      const sizeIds = [...new Set((sizeRows ?? []).map((r) => r.product_id))]
      if (sizeIds.length === 0) {
        return NextResponse.json({ products: [], total: 0 }, { status: 200 })
      }
      query = query.in('id', sizeIds)
    }

    switch (sort) {
      case 'price-asc':   query = query.order('price', { ascending: true });  break
      case 'price-desc':  query = query.order('price', { ascending: false }); break
      case 'bestselling': query = query.eq('is_top_selling', true).order('created_at', { ascending: false }); break
      default:            query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * PAGE_SIZE
    const to   = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data: products, count } = await query

    let mapped: ProductCardData[] = (products ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      category_slug: ((p.categories as unknown) as { slug: string } | null)?.slug ?? categorySlug ?? 'sarees',
      name: p.name,
      fabric: p.fabric,
      price: p.price,
      compare_price: p.compare_price ?? null,
      is_new_arrival: p.is_new_arrival,
      is_top_selling: p.is_top_selling,
      images: ((p.product_images as { url: string; alt: string | null; position: number }[]) ?? [])
        .sort((a, b) => a.position - b.position)
        .map((img) => ({ url: img.url, alt: img.alt })),
      tags: ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
    }))

    if (occasion) {
      mapped = mapped.filter((p) => p.tags.includes(occasion))
    }
    if (fabric) {
      mapped = mapped.filter((p) => p.fabric?.toLowerCase().includes(fabric.toLowerCase()))
    }

    return NextResponse.json({ products: mapped, total: count ?? 0 }, { status: 200 })
  } catch (err) {
    console.error('[/api/products]', err)
    return NextResponse.json({ products: [], total: 0 }, { status: 500 })
  }
}
