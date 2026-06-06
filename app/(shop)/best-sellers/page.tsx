import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { SortBar } from '@/components/shop/SortBar'
import { YouMightAlsoLike } from '@/components/shop/YouMightAlsoLike'
import { MobileFilterDrawer } from '@/components/shop/MobileFilterDrawer'
import { CategoryListing } from '@/components/shop/CategoryListing'
import type { ProductCardData } from '@/app/(shop)/page'

export const revalidate = 300

const PAGE_SIZE = 24

export const metadata: Metadata = {
  title: 'Best Sellers',
  description: 'Our most-loved pieces — the ones customers come back for. Shop The Possah\'s best-selling sarees, lehengas, co-ords and more.',
  alternates: { canonical: 'https://thepossah.com/best-sellers' },
}

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function getString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0]
  return val
}

async function getBestSellers(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const supabase = createPublicClient()

    const occasion = getString(searchParams.occasion)
    const fabric   = getString(searchParams.fabric)
    const size     = getString(searchParams.size)
    const subLine  = getString(searchParams.sub_line)
    const sort     = getString(searchParams.sort) ?? 'newest'

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
      .eq('is_top_selling', true)

    if (subLine) query = query.eq('sub_line', subLine)

    if (size) {
      const { data: sizeRows } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('size', size)
        .gt('stock_qty', 0)
      const sizeIds = [...new Set((sizeRows ?? []).map((r) => r.product_id))]
      if (sizeIds.length === 0) {
        return { products: [], total: 0, relatedProducts: [] }
      }
      query = query.in('id', sizeIds)
    }

    switch (sort) {
      case 'price-asc':  query = query.order('price', { ascending: true });  break
      case 'price-desc': query = query.order('price', { ascending: false }); break
      default:           query = query.order('created_at', { ascending: false })
    }

    query = query.range(0, PAGE_SIZE - 1)

    const { data: products, count } = await query

    const mapProducts = (raw: typeof products, fallbackSlug = 'sarees'): ProductCardData[] =>
      (raw ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        category_slug: ((p.categories as unknown) as { slug: string } | null)?.slug ?? fallbackSlug,
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

    let mapped = mapProducts(products)
    if (occasion) mapped = mapped.filter((p) => p.tags.includes(occasion))
    if (fabric)   mapped = mapped.filter((p) => p.fabric?.toLowerCase().includes(fabric.toLowerCase()))

    // Related: non-bestseller products
    const { data: related } = await supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug),
        product_images (url, alt, position),
        product_tags (tag)
      `)
      .eq('is_active', true)
      .eq('is_top_selling', false)
      .order('created_at', { ascending: false })
      .limit(5)

    return { products: mapped, total: count ?? 0, relatedProducts: mapProducts(related) }
  } catch {
    return { products: [], total: 0, relatedProducts: [] }
  }
}

export default async function BestSellersPage({ searchParams }: PageProps) {
  const { products, total, relatedProducts } = await getBestSellers(searchParams)

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thepossah.com' },
              { '@type': 'ListItem', position: 2, name: 'Best Sellers', item: 'https://thepossah.com/best-sellers' },
            ],
          }),
        }}
      />

      {/* Page header */}
      <div
        className="container-site pt-12 pb-8"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <p className="section-label mb-3">THE POSSAH</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          Best Sellers
        </h1>
        <p
          className="mt-3 max-w-md"
          style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}
        >
          Our most-loved pieces — the ones customers return for, season after season.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="container-site py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <li><Link href="/" className="hover:opacity-70">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" style={{ color: 'var(--color-text)' }}>Best Sellers</li>
          </ol>
        </nav>
      </div>

      {/* Main content */}
      <div className="container-site pb-20">
        <MobileFilterDrawer />

        <div className="flex gap-10 lg:gap-14">
          {/* Sidebar */}
          <div className="hidden md:block sticky top-[104px] self-start">
            <FilterSidebar />
          </div>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            <SortBar resultCount={total} showFilterButton />

            <CategoryListing
              key={[
                getString(searchParams.occasion),
                getString(searchParams.fabric),
                getString(searchParams.size),
                getString(searchParams.sub_line),
                getString(searchParams.sort) ?? 'newest',
              ].join('|')}
              initialProducts={products}
              total={total}
              categorySlug=""
              topSellingOnly
            />
          </div>
        </div>
      </div>

      <YouMightAlsoLike products={relatedProducts} heading="You might also like" />
    </>
  )
}
