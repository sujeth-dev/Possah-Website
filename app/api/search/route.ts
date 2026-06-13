import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { ProductCardData } from '@/app/(shop)/page'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] })
  }

  // SECURITY (audit S-2): the value below is interpolated into a PostgREST
  // .or() filter string. Characters that PostgREST treats as syntax — commas
  // (condition separator), parentheses (grouping) — and LIKE wildcards
  // (%, _, \\) and the * splat are stripped so a crafted query cannot inject
  // additional filter conditions. Plain words/spaces remain for ilike matching.
  const safeQ = q.replace(/[,()%_*\\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (safeQ.length < 2) {
    return NextResponse.json({ products: [] })
  }

  try {
    const supabase = createServerClient()

    const { data } = await supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug),
        product_images (url, alt, position),
        product_tags (tag)
      `)
      .eq('is_active', true)
      .or(`name.ilike.%${safeQ}%,fabric.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      .order('created_at', { ascending: false })
      .limit(24)

    const products: ProductCardData[] = (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      category_slug: ((p.categories as unknown) as { slug: string } | null)?.slug ?? 'sarees',
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

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
