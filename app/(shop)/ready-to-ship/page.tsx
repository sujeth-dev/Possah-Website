import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'
import { FilterSidebar } from '@/components/shop/FilterSidebar'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { SortBar } from '@/components/shop/SortBar'
import { YouMightAlsoLike } from '@/components/shop/YouMightAlsoLike'
import { MobileFilterDrawer } from '@/components/shop/MobileFilterDrawer'
import type { ProductCardData } from '@/app/(shop)/page'

const PAGE_SIZE = 24

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>
}

function getString(val: string | string[] | undefined): string | undefined {
  if (Array.isArray(val)) return val[0]
  return val
}

async function getReadyToShip(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const supabase = createPublicClient()

    const occasion = getString(searchParams.occasion)
    const fabric   = getString(searchParams.fabric)
    const size     = getString(searchParams.size)
    const subLine  = getString(searchParams.sub_line)
    const page     = parseInt(getString(searchParams.page) ?? '1', 10)
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
      .eq('is_ready_to_ship', true)
      .eq('is_active', true)

    if (subLine) query = query.eq('sub_line', subLine)

    if (size) {
      const { data: sizeRows } = await supabase
        .from('product_variants')
        .select('product_id')
        .eq('size', size)
        .gt('stock_qty', 0)
      const sizeIds = [...new Set((sizeRows ?? []).map((r) => r.product_id))]
      if (sizeIds.length === 0) return { products: [], total: 0, relatedProducts: [] }
      query = query.in('id', sizeIds)
    }

    switch (sort) {
      case 'price-asc':   query = query.order('price', { ascending: true });  break
      case 'price-desc':  query = query.order('price', { ascending: false }); break
      case 'bestselling': query = query.eq('is_top_selling', true).order('created_at', { ascending: false }); break
      default:            query = query.order('created_at', { ascending: false })
    }

    const from = (page - 1) * PAGE_SIZE
    query = query.range(from, from + PAGE_SIZE - 1)

    const { data: products, count } = await query

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
      .eq('is_ready_to_ship', false)
      .order('created_at', { ascending: false })
      .limit(5)

    const mapProducts = (raw: typeof products): ProductCardData[] =>
      (raw ?? []).map((p) => ({
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

    let mapped = mapProducts(products)
    if (occasion) mapped = mapped.filter((p) => p.tags.includes(occasion))
    if (fabric)   mapped = mapped.filter((p) => p.fabric?.toLowerCase().includes(fabric.toLowerCase()))

    return { products: mapped, total: count ?? 0, relatedProducts: mapProducts(related) }
  } catch {
    return { products: [], total: 0, relatedProducts: [] }
  }
}

export const metadata: Metadata = {
  title: 'Ready to Ship — The Possah',
  description: 'In-stock pieces ready to ship immediately — no wait, no crafting time. Shop sarees, lehengas and more.',
  alternates: { canonical: 'https://thepossah.com/ready-to-ship' },
}

export default async function ReadyToShipPage({ searchParams }: PageProps) {
  const { products, total, relatedProducts } = await getReadyToShip(searchParams)

  const page    = parseInt(getString(searchParams.page) ?? '1', 10)
  const hasMore = page * PAGE_SIZE < total

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home',          item: 'https://thepossah.com' },
              { '@type': 'ListItem', position: 2, name: 'Ready to Ship', item: 'https://thepossah.com/ready-to-ship' },
            ],
          }),
        }}
      />

      {/* Hero */}
      <div
        className="relative w-full flex items-end overflow-hidden"
        style={{
          minHeight: 'clamp(180px, 28vw, 360px)',
          background: 'linear-gradient(135deg, #2c4a35 0%, var(--color-green) 60%, #1a3326 100%)',
        }}
        aria-label="Ready to Ship"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
          aria-hidden="true"
        />

        {/* Right-side decorative label */}
        <div
          className="absolute right-8 bottom-8 hidden md:block"
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
          }}
        >
          Ships in 2–3 days
        </div>

        <div className="relative container-site pb-10 z-10">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.25em',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            In Stock · Ships Immediately
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(30px, 5vw, 72px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 1,
              letterSpacing: '0.04em',
            }}
          >
            READY TO SHIP
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(13px, 1.4vw, 15px)',
              color: 'rgba(255,255,255,0.65)',
              marginTop: '12px',
              fontStyle: 'italic',
            }}
          >
            No crafting wait. These pieces are packed and ready to leave the atelier.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container-site py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <li><Link href="/" className="hover:opacity-70">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" style={{ color: 'var(--color-text)' }}>Ready to Ship</li>
          </ol>
        </nav>
      </div>

      {/* Promise strip */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-site py-3">
          <div className="flex flex-wrap items-center gap-6 md:gap-10">
            {[
              { icon: '⚡', text: 'Ships in 2–3 business days' },
              { icon: '📦', text: 'Signature Possah packaging' },
              { icon: '↩', text: '7-day easy returns' },
              { icon: '🔒', text: 'Secure checkout' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.06em', color: 'var(--color-text-muted)' }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="container-site pb-20">
        <MobileFilterDrawer />
        <div className="flex gap-10 lg:gap-14">
          <div className="hidden md:block sticky top-[104px] self-start">
            <FilterSidebar />
          </div>
          <div className="flex-1 min-w-0">
            <SortBar resultCount={total} showFilterButton />
            <ProductGrid products={products} columns={3} />

            {hasMore && (
              <div className="flex justify-center mt-12">
                <Link
                  href={`/ready-to-ship?${new URLSearchParams({
                    ...Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? (v[0] ?? '') : (v ?? '')])),
                    page: String(page + 1),
                  }).toString()}`}
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
