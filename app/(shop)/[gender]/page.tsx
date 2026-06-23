import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { ProductCardData } from '@/app/(shop)/page'

export const revalidate = 3600

const VALID_GENDERS = ['women', 'men', 'kids', 'unisex']

interface PageProps {
  params: { gender: string }
}

const ETHNIC_CATEGORY_SLUGS = ['sarees', 'lehengas', 'kurta-sets', 'dress-material', 'fabrics', 'blouses']
const WESTERN_CATEGORY_SLUGS = ['co-ords', 'dresses', 'tops', 'bottoms']

const CATEGORY_META: Record<string, { label: string; description: string }> = {
  sarees:          { label: 'Sarees',        description: 'Handwoven. Handcrafted. Heirloom.' },
  lehengas:        { label: 'Lehengas',      description: 'For every celebration.' },
  'kurta-sets':    { label: 'Kurta Sets',    description: 'Effortless everyday elegance.' },
  'dress-material':{ label: 'Dress Material',description: 'Craft your own story.' },
  fabrics:         { label: 'Fabrics',       description: 'The raw material of luxury.' },
  blouses:         { label: 'Blouses',       description: 'The detail that defines it.' },
  'co-ords':       { label: 'Co-Ords',       description: 'Composed. Contemporary.' },
  dresses:         { label: 'Dresses',       description: 'One piece. Every occasion.' },
  tops:            { label: 'Tops',          description: 'Effortless on its own.' },
  bottoms:         { label: 'Bottoms',       description: 'Ground every look.' },
}

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('categories').select('gender')
  const genders = [...new Set((data ?? []).map((c) => c.gender).filter(Boolean))]
  return genders.map((gender) => ({ gender }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const label = params.gender.charAt(0).toUpperCase() + params.gender.slice(1)
  return {
    title: label,
    description: `Shop ${label.toLowerCase()}'s ethnic and western fashion at The Possah — sarees, lehengas, kurta sets, dress material, fabrics, blouses, co-ords, dresses, tops and bottoms.`,
    alternates: { canonical: `https://thepossah.com/${params.gender}` },
  }
}

const HOMEPAGE_SINGLETON = '00000000-0000-0000-0000-000000000001'

async function getGenderHubHero(gender: string): Promise<string | null> {
  if (gender !== 'women') return null
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('homepage_config')
      .select('page_heroes')
      .eq('id', HOMEPAGE_SINGLETON)
      .maybeSingle()
    return (data?.page_heroes as { women_hub_hero?: string | null } | null)?.women_hub_hero ?? null
  } catch { return null }
}

async function getNewArrivalsPreview(gender: string): Promise<ProductCardData[]> {
  try {
    const supabase = createPublicClient()
    const { data: categoryIds } = await supabase
      .from('categories')
      .select('id')
      .eq('gender', gender)
    const ids = (categoryIds ?? []).map((c) => c.id)

    let query = supabase
      .from('products')
      .select(`
        id, slug, name, fabric, price, compare_price,
        is_new_arrival, is_top_selling,
        categories (slug, gender),
        product_images (url, alt, position),
        product_tags (tag)
      `)
      .eq('is_new_arrival', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (ids.length > 0) {
      query = query.in('category_id', ids)
    }

    const { data } = await query

    return (data ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      category_slug:   ((p.categories as unknown) as { slug: string; gender: string } | null)?.slug   ?? 'sarees',
      category_gender: ((p.categories as unknown) as { slug: string; gender: string } | null)?.gender ?? gender,
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

async function getCategoryData(gender: string): Promise<{ slug: string; hero_image_url: string | null }[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('categories')
      .select('slug, hero_image_url')
      .eq('gender', gender)
    return data ?? []
  } catch {
    return []
  }
}

function CategoryCard({
  label,
  href,
  description,
  heroImage,
}: {
  label: string
  href: string
  description: string
  heroImage: string | null | undefined
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden block"
      style={{ borderRadius: 'var(--radius-card)', aspectRatio: '2/3' }}
    >
      <Image
        src={heroImage || 'https://cdn.thepossah.com/ui/placeholder.svg'}
        alt={label}
        fill
        className="object-cover object-center img-hover-scale"
        sizes="(max-width: 768px) 50vw, 33vw"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.7) 0%, rgba(15,25,18,0.1) 55%, transparent 100%)' }}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(18px, 2.2vw, 26px)',
            fontWeight: '400',
            color: 'var(--color-white)',
            letterSpacing: '0.03em',
            lineHeight: 1,
          }}
        >
          {label}
        </p>
        <p
          className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.75)',
            fontStyle: 'italic',
          }}
        >
          {description}
        </p>
        <div
          className="mt-3 inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-white)',
          }}
        >
          Shop {label}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 5h6M5 2l3 3-3 3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

export default async function GenderHubPage({ params }: PageProps) {
  if (!VALID_GENDERS.includes(params.gender)) notFound()

  const genderLabel = params.gender.charAt(0).toUpperCase() + params.gender.slice(1)

  const [newArrivals, categories, hubHero] = await Promise.all([
    getNewArrivalsPreview(params.gender),
    getCategoryData(params.gender),
    getGenderHubHero(params.gender),
  ])

  const heroImageMap = Object.fromEntries(categories.map((c) => [c.slug, c.hero_image_url]))

  const ethnicCats = ETHNIC_CATEGORY_SLUGS
    .filter((slug) => categories.some((c) => c.slug === slug))
    .map((slug) => ({ slug, ...CATEGORY_META[slug], href: `/${params.gender}/${slug}` }))

  const westernCats = WESTERN_CATEGORY_SLUGS
    .filter((slug) => categories.some((c) => c.slug === slug))
    .map((slug) => ({ slug, ...CATEGORY_META[slug], href: `/${params.gender}/${slug}` }))

  // Any category not in the predefined lists (e.g. future additions)
  const knownSlugs = new Set([...ETHNIC_CATEGORY_SLUGS, ...WESTERN_CATEGORY_SLUGS])
  const otherCats = categories
    .filter((c) => !knownSlugs.has(c.slug))
    .map((c) => ({
      slug: c.slug,
      label: c.slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      description: '',
      href: `/${params.gender}/${c.slug}`,
    }))

  const firstEthnicSlug = ethnicCats[0]?.slug ?? 'sarees'
  const firstWesternSlug = westernCats[0]?.slug ?? 'co-ords'

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home',      item: 'https://thepossah.com' },
              { '@type': 'ListItem', position: 2, name: genderLabel, item: `https://thepossah.com/${params.gender}` },
            ],
          }),
        }}
      />

      {/* Hero */}
      <div
        className="relative w-full overflow-hidden flex items-end"
        style={{
          minHeight: 'clamp(300px, 42vw, 560px)',
          background: 'linear-gradient(135deg, #1a3326 0%, #2c4a35 50%, #0d1f17 100%)',
        }}
        aria-label={`${genderLabel} — The Possah`}
      >
        <Image
          src={hubHero || 'https://cdn.thepossah.com/ui/placeholder.svg'}
          alt={`The Possah ${genderLabel}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.7) 0%, rgba(15,25,18,0.1) 60%, transparent 100%)' }}
          aria-hidden="true"
        />
        <div className="relative container-site pb-14 z-10">
          <p className="section-label" style={{ color: 'rgba(244,236,223,0.65)', marginBottom: 10 }}>
            THE POSSAH
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 7vw, 96px)',
              fontWeight: '400',
              color: 'var(--color-white)',
              lineHeight: 0.95,
              letterSpacing: '0.04em',
            }}
          >
            {genderLabel.toUpperCase()}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              color: 'rgba(244,236,223,0.75)',
              marginTop: 14,
              maxWidth: 460,
              lineHeight: 1.65,
              fontStyle: 'italic',
            }}
          >
            For every occasion — from the everyday to the extraordinary.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container-site py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <li><Link href="/" className="hover:opacity-70">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" style={{ color: 'var(--color-text)' }}>{genderLabel}</li>
          </ol>
        </nav>
      </div>

      {/* Ethnic section */}
      {ethnicCats.length > 0 && (
        <section className="section-gap">
          <div className="container-site">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>{genderLabel.toUpperCase()}</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(26px, 3.5vw, 48px)',
                    fontWeight: '400',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Ethnic
                </h2>
              </div>
              <Link
                href={`/${params.gender}/${firstEthnicSlug}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                }}
                className="hover:opacity-70 transition-opacity hidden md:block"
              >
                Shop all Ethnic →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {ethnicCats.map(({ slug, label, href, description }) => (
                <CategoryCard
                  key={slug}
                  label={label}
                  href={href}
                  description={description}
                  heroImage={heroImageMap[slug]}
                />
              ))}
            </div>
            <div className="mt-4 md:hidden text-right">
              <Link
                href={`/${params.gender}/${firstEthnicSlug}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Shop all Ethnic →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Divider quote */}
      {(ethnicCats.length > 0 && westernCats.length > 0) && (
        <div className="border-y py-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(16px, 2.5vw, 28px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              fontStyle: 'italic',
              maxWidth: 640,
              margin: '0 auto',
              lineHeight: 1.4,
            }}
          >
            &ldquo;Designed to flatter. Made to be remembered.&rdquo;
          </p>
        </div>
      )}

      {/* Western section */}
      {westernCats.length > 0 && (
        <section className="section-gap">
          <div className="container-site">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>{genderLabel.toUpperCase()}</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(26px, 3.5vw, 48px)',
                    fontWeight: '400',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Western
                </h2>
              </div>
              <Link
                href={`/${params.gender}/${firstWesternSlug}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                }}
                className="hover:opacity-70 transition-opacity hidden md:block"
              >
                Shop all Western →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {westernCats.map(({ slug, label, href, description }) => (
                <CategoryCard
                  key={slug}
                  label={label}
                  href={href}
                  description={description}
                  heroImage={heroImageMap[slug]}
                />
              ))}
            </div>
            <div className="mt-4 md:hidden text-right">
              <Link
                href={`/${params.gender}/${firstWesternSlug}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Shop all Western →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Other/future categories */}
      {otherCats.length > 0 && (
        <section className="section-gap">
          <div className="container-site">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
              {otherCats.map(({ slug, label, href, description }) => (
                <CategoryCard
                  key={slug}
                  label={label}
                  href={href}
                  description={description}
                  heroImage={heroImageMap[slug]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals preview */}
      {newArrivals.length > 0 && (
        <section
          className="section-gap border-t"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(31,58,45,0.02)' }}
        >
          <div className="container-site">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>JUST ARRIVED</p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(22px, 3vw, 40px)',
                    fontWeight: '400',
                    color: 'var(--color-text)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  New this season
                </h2>
              </div>
              <Link
                href="/new-in"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
                className="hover:opacity-70 transition-opacity hidden md:block"
              >
                View all New In →
              </Link>
            </div>
            <ProductGrid products={newArrivals} columns={4} />
            <div className="mt-6 text-center md:hidden">
              <Link
                href="/new-in"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                View all New In →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Made-to-Measure CTA */}
      <section className="section-gap border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site flex flex-col items-center gap-5 max-w-[600px] mx-auto">
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
            A piece made<br />for you alone.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-text-muted)',
            }}
          >
            Every measurement considered. Every detail intentional. A garment that fits the exact version of you.
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
            Explore Made-to-Measure
          </Link>
        </div>
      </section>
    </>
  )
}
