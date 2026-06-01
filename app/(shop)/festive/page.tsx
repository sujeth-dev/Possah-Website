import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { ProductCardData } from '@/app/(shop)/page'

export const metadata: Metadata = {
  title: 'Festive',
  description: 'Festive occasion pieces. Sarees, lehengas and co-ords for every celebration — weddings, sangeets, mehndi, cocktail evenings and more.',
  alternates: { canonical: 'https://thepossah.com/festive' },
}

type OccasionTile = {
  label: string
  image: string
  tag: string | null
  externalHref?: string
}

const OCCASIONS: OccasionTile[] = [
  { label: 'Cocktail & Party', image: '/images/festive-eid.jpg',      tag: 'Cocktail' },
  { label: 'Vacation Glam',    image: '/images/festive-navratri.jpg', tag: 'Evening'  },
  { label: 'Festive Edit',     image: '/images/festive-diwali.jpg',   tag: null       },
  { label: 'Everyday Luxe',    image: '/images/festive-sangeet.jpg',  tag: 'Everyday' },
  { label: 'Custom Couture',   image: '/images/festive-hero.jpg',     tag: null, externalHref: '/made-to-measure' },
]

async function getFestiveProducts(occasion: string | null): Promise<ProductCardData[]> {
  try {
    const supabase = createPublicClient()

    let productIds: string[] | null = null

    if (occasion) {
      const { data: tagged } = await supabase
        .from('product_tags')
        .select('product_id')
        .eq('tag', occasion)
      productIds = (tagged ?? []).map((t: { product_id: string }) => t.product_id)
      if (productIds.length === 0) return []
    }

    let query = supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug),
        product_images (url, alt, position),
        product_tags (tag)
      `)
      .eq('is_active', true)
      .eq('is_festive', true)
      .order('created_at', { ascending: false })
      .limit(24)

    if (productIds) {
      query = query.in('id', productIds)
    }

    const { data } = await query

    return (data ?? []).map((p) => ({
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
  } catch {
    return []
  }
}

export default async function FestivePage({
  searchParams,
}: {
  searchParams: { occasion?: string }
}) {
  const activeOccasion = searchParams.occasion ?? null
  const products = await getFestiveProducts(activeOccasion)

  return (
    <>
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{ minHeight: 'clamp(280px, 40vw, 520px)' }}
      >
        <Image
          src="/images/festive-hero.jpg"
          alt="The Possah Festive"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.65) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-12 z-10">
          <p className="section-label" style={{ color: 'rgba(244,236,223,0.7)', marginBottom: 8 }}>THE POSSAH</p>
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
            FESTIVE
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(244,236,223,0.8)', marginTop: 10, maxWidth: 420, lineHeight: 1.6 }}>
            From intimate mehndi evenings to grand wedding celebrations — pieces made to be worn, remembered, and passed on.
          </p>
        </div>
      </div>

      {/* Occasion tiles */}
      <section className="section-gap">
        <div className="container-site">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {OCCASIONS.map(({ label, image, tag, externalHref }) => {
              const isActive = tag !== null && tag === activeOccasion
              const href = externalHref ?? (tag ? (isActive ? '/festive#products' : `/festive?occasion=${tag}#products`) : '/festive#products')
              return (
                <Link
                  key={label}
                  href={href}
                  className="group relative overflow-hidden block"
                  style={{ borderRadius: 'var(--radius-card)', aspectRatio: '3/4' }}
                >
                  <Image
                    src={image}
                    alt={label}
                    fill
                    className="object-cover object-center img-hover-scale"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.55) 0%, transparent 50%)' }}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <div
                      className="absolute inset-0"
                      style={{
                        boxShadow: 'inset 0 0 0 2.5px var(--color-white)',
                        borderRadius: 'var(--radius-card)',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="absolute bottom-4 left-4"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-white)' }}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site">
          <div className="flex items-baseline justify-between mb-8">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 3vw, 36px)',
                fontWeight: '400',
                color: 'var(--color-text)',
                letterSpacing: '-0.01em',
              }}
            >
              The Festive Edit
            </h2>
            {activeOccasion && (
              <Link
                href="/festive"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
                className="hover:opacity-60 transition-opacity duration-200"
              >
                {activeOccasion} ×
              </Link>
            )}
          </div>
          {products.length > 0 ? (
            <ProductGrid products={products} columns={3} />
          ) : (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '48px 0' }}>
              No pieces in this occasion yet — check back soon.
            </p>
          )}
        </div>
      </section>
    </>
  )
}
