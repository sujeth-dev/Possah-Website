import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { SortBar } from '@/components/shop/SortBar'
import { YouMightAlsoLike } from '@/components/shop/YouMightAlsoLike'
import { MobileFilterDrawer } from '@/components/shop/MobileFilterDrawer'
import type { ProductCardData } from '@/app/(shop)/page'

const PAGE_SIZE = 24

interface PageProps {
  params: { category: string }
  searchParams: Record<string, string | string[] | undefined>
}

function getString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0]
  return val
}

async function getCategoryAndProducts(
  slug: string,
  searchParams: Record<string, string | string[] | undefined>
) {
  try {
    const supabase = createServerClient()

    // Fetch category
    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!category) return { category: null, products: [], total: 0, relatedProducts: [] }

    // Build query
    let query = supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug),
        product_images (url, alt, position),
        product_tags (tag)
      `, { count: 'exact' })
      .eq('category_id', category.id)
      .eq('is_active', true)

    // Filters from URL
    const occasion = getString(searchParams.occasion)
    const fabric = getString(searchParams.fabric)
    const size = getString(searchParams.size)
    const subLine = getString(searchParams.sub_line)
    const page = parseInt(getString(searchParams.page) ?? '1', 10)
    const sort = getString(searchParams.sort) ?? 'newest'

    // sub_line — direct column on products, apply before exec
    if (subLine) {
      query = query.eq('sub_line', subLine)
    }

    // size — must pre-fetch product IDs that have a variant with this size
    if (size) {
      const { data: sizeRows } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('size', size)
        .gt('stock_qty', 0)
      const sizeIds = [...new Set((sizeRows ?? []).map((r) => r.product_id))]
      if (sizeIds.length === 0) {
        return { category, products: [], total: 0, relatedProducts: [] }
      }
      query = query.in('id', sizeIds)
    }

    // Sort
    switch (sort) {
      case 'price-asc':  query = query.order('price', { ascending: true });  break
      case 'price-desc': query = query.order('price', { ascending: false }); break
      case 'bestselling': query = query.eq('is_top_selling', true).order('created_at', { ascending: false }); break
      default:           query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data: products, count } = await query

    // Fetch related products for YouMightAlsoLike
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
      .neq('category_id', category.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const mapProducts = (raw: typeof products, fallbackCategorySlug?: string): ProductCardData[] =>
      (raw ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        category_slug: ((p.categories as unknown) as { slug: string } | null)?.slug ?? fallbackCategorySlug ?? 'sarees',
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

    // Post-filter by occasion (tag) and fabric (text match)
    let mapped = mapProducts(products, category.slug)
    if (occasion) {
      mapped = mapped.filter((p) => p.tags.includes(occasion))
    }
    if (fabric) {
      mapped = mapped.filter((p) => p.fabric?.toLowerCase().includes(fabric.toLowerCase()))
    }

    return {
      category,
      products: mapped,
      total: count ?? 0,
      relatedProducts: mapProducts(related),
    }
  } catch {
    return { category: null, products: [], total: 0, relatedProducts: [] }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createServerClient()
    const { data: category } = await supabase
      .from('categories')
      .select('name, slug')
      .eq('slug', params.category)
      .single()

    if (!category) return { title: 'Shop — The Possah' }

    return {
      title: `${category.name} — The Possah`,
      description: `Shop ${category.name} at The Possah — handcrafted luxury Indian fashion. Sarees, lehengas, co-ords and more.`,
      alternates: { canonical: `https://thepossah.com/shop/${category.slug}` },
    }
  } catch {
    return { title: 'Shop — The Possah' }
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category, products, total, relatedProducts } =
    await getCategoryAndProducts(params.category, searchParams)

  if (!category) notFound()

  const page = parseInt(getString(searchParams.page) ?? '1', 10)
  const hasMore = page * PAGE_SIZE < total

  return (
    <>
      {/* Structured data — BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thepossah.com' },
              { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://thepossah.com/shop/sarees' },
              { '@type': 'ListItem', position: 3, name: category.name, item: `https://thepossah.com/shop/${category.slug}` },
            ],
          }),
        }}
      />

      {/* Hero banner */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{ minHeight: 'clamp(200px, 30vw, 380px)' }}
        aria-label={`${category.name} category`}
      >
        <Image
          src={category.hero_image_url ?? '/images/placeholder-hero.jpg'}
          alt={category.name}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.6) 0%, rgba(15,25,18,0.1) 60%, transparent 100%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-10 z-10">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 1,
              letterSpacing: '0.04em',
            }}
          >
            {category.name.toUpperCase()}
          </h1>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container-site py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <li><Link href="/" className="hover:opacity-70">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/shop/sarees" className="hover:opacity-70">Shop</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" style={{ color: 'var(--color-text)' }}>{category.name}</li>
          </ol>
        </nav>
      </div>

      {/* Main content */}
      <div className="container-site pb-20">
        {/* Mobile: filter drawer trigger is in SortBar */}
        <MobileFilterDrawer />

        <div className="flex gap-10 lg:gap-14">
          {/* Sidebar — hidden on mobile (handled by drawer) */}
          <div className="hidden md:block sticky top-[104px] self-start">
            <FilterSidebar />
          </div>

          {/* Product area */}
          <div className="flex-1 min-w-0">
            <SortBar resultCount={total} showFilterButton />

            <ProductGrid products={products} columns={3} />

            {/* Show More */}
            {hasMore && (
              <div className="flex justify-center mt-12">
                <Link
                  href={`/shop/${params.category}?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? (v[0] ?? '') : (v ?? '')])), page: String(page + 1) }).toString()}`}
                  scroll={false}
                  className="inline-flex items-center gap-2 transition-opacity duration-200 hover:opacity-75 px-10 py-3.5"
                  style={{
                    border: '1.5px solid var(--color-green)',
                    color: 'var(--color-green)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-btn)',
                  }}
                >
                  Show More Pieces
                </Link>
              </div>
            )}

            {/* Pagination indicator */}
            {total > PAGE_SIZE && (
              <p
                className="text-center mt-4"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}
              >
                Page {page} of {Math.ceil(total / PAGE_SIZE)}
              </p>
            )}
          </div>
        </div>
      </div>

      <YouMightAlsoLike products={relatedProducts} heading="You might also like" />
    </>
  )
}
