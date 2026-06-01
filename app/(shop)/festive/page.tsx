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

async function getFestiveProducts(): Promise<ProductCardData[]> {
  try {
    const supabase = createPublicClient()
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

// Festive occasion tiles — confirmed set (Bridesmaid, Workwear, Everyday Wear excluded).
// Imagery is reused/fallback; swap src values once bespoke assets land.
const OCCASIONS = [
  { label: 'Cocktail & Party', image: '/images/festive-eid.jpg'       },
  { label: 'Vacation Glam',    image: '/images/festive-navratri.jpg'  },
  { label: 'Festive Edit',     image: '/images/festive-diwali.jpg'    },
  { label: 'Everyday Luxe',    image: '/images/festive-sangeet.jpg'   },
  { label: 'Custom Couture',   image: '/images/festive-hero.jpg'      },
]

export default async function FestivePage() {
  const products = await getFestiveProducts()

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
            {OCCASIONS.map(({ label, image }) => (
              <Link
                key={label}
                href={
                  label === 'Custom Couture'
                    ? '/made-to-measure'
                    : label === 'Everyday Luxe'
                    ? '/shop/kurta-sets'
                    : label === 'Vacation Glam'
                    ? '/shop/co-ords'
                    : label === 'Festive Edit'
                    ? '/shop/lehengas'
                    : '/shop/sarees?occasion=Cocktail'
                }
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
                <span
                  className="absolute bottom-4 left-4"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-white)' }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
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
              The Festive Edit
            </h2>
            <Link
              href="/shop/sarees"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
              className="hover:opacity-60 transition-opacity duration-200"
            >
              View All →
            </Link>
          </div>
          <ProductGrid products={products} columns={3} />
        </div>
      </section>
    </>
  )
}
