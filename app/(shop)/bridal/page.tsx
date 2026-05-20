import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { ProductCardData } from '@/app/(shop)/page'

export const metadata: Metadata = {
  title: 'Bridal — The Possah',
  description: 'Bridal and wedding occasion pieces from The Possah. Sarees, lehengas and co-ords handcrafted for your most memorable days.',
  alternates: { canonical: 'https://thepossah.com/bridal' },
}

async function getBridalProducts(): Promise<ProductCardData[]> {
  try {
    const supabase = createPublicClient()

    // Step 1: get product IDs that have any bridal tag
    const { data: tagRows } = await supabase
      .from('product_tags')
      .select('product_id')
      .in('tag', ['Wedding', 'Sangeet', 'Mehendi', 'Haldi'])

    const productIds = [...new Set(((tagRows ?? []) as { product_id: string }[]).map((r) => r.product_id))]
    if (productIds.length === 0) return []

    // Step 2: fetch those products
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
      .in('id', productIds)
      .order('created_at', { ascending: false })
      .limit(12)

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

const OCCASIONS = [
  { label: 'Mehendi', image: '/images/bridal-mehendi.jpg', tag: 'Mehendi' },
  { label: 'Haldi',   image: '/images/bridal-haldi.jpg',   tag: 'Haldi'   },
  { label: 'Sangeet', image: '/images/bridal-sangeet.jpg', tag: 'Sangeet' },
  { label: 'Wedding', image: '/images/bridal-wedding.jpg', tag: 'Wedding' },
]

export default async function BridalPage() {
  const products = await getBridalProducts()

  return (
    <>
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{ minHeight: 'clamp(280px, 40vw, 520px)' }}
      >
        <Image
          src="/images/bridal-hero.jpg"
          alt="The Possah Bridal"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.65) 0%, rgba(15,25,18,0.05) 60%, transparent 100%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-12 z-10">
          <p className="section-label" style={{ color: 'rgba(244,236,223,0.7)', marginBottom: 8 }}>
            THE POSSAH
          </p>
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
            BRIDAL
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              color: 'rgba(244,236,223,0.8)',
              marginTop: 12,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            For every ritual, a piece that carries the weight of the moment — and the lightness of joy.
          </p>
        </div>
      </div>

      {/* Occasion grid */}
      <section className="section-gap">
        <div className="container-site">
          <h2
            className="mb-8"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            Shop by occasion
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {OCCASIONS.map(({ label, image, tag }) => (
              <Link
                key={label}
                href={`/shop/sarees?occasion=${tag}`}
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
                  style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.6) 0%, transparent 50%)' }}
                  aria-hidden="true"
                />
                <span
                  className="absolute bottom-4 left-4"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--color-white)',
                  }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
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
              The Bridal Edit
            </h2>
          </div>
          <ProductGrid products={products} columns={3} />
        </div>
      </section>

      {/* MTM CTA */}
      <section
        className="section-gap border-t text-center"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(31,58,45,0.03)' }}
      >
        <div className="container-site flex flex-col items-center gap-5 max-w-[640px] mx-auto">
          <p className="section-label">MADE-TO-MEASURE</p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 48px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            Your bridal piece,<br />made for you alone.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-text-muted)',
            }}
          >
            Bespoke bridal trousseau — from fabric selection to final fitting. Every measurement considered, every detail intentional.
          </p>
          <Link
            href="/made-to-measure"
            className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            Enquire Now
          </Link>
        </div>
      </section>
    </>
  )
}
