import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 3600

const PH = 'https://cdn.thepossah.com/ui/placeholder.svg'

interface Look {
  id: string
  look_number: number
  image_url: string | null
  product: {
    id: string
    slug: string
    name: string
    price: number
    category_slug: string
    category_gender: string
    primary_image: string | null
  } | null
}

interface LookbookDetail {
  id: string
  collection_name: string
  season: string
  year: number
  theme_word: string
  chapter_number: number
  hero_image: string | null
  concept_text: string | null
  looks: Look[]
}

async function getLookbook(chapter: number): Promise<LookbookDetail | null> {
  try {
    const supabase = createPublicClient()

    const { data: lb } = await supabase
      .from('lookbooks')
      .select('id, collection_name, season, year, theme_word, chapter_number, hero_image, concept_text')
      .eq('chapter_number', chapter)
      .eq('is_active', true)
      .single()

    if (!lb) return null

    const { data: rawLooks } = await supabase
      .from('lookbook_looks')
      .select(`
        id, look_number, image_url,
        products (
          id, slug, name, price,
          categories (slug, gender),
          product_images (url, position)
        )
      `)
      .eq('lookbook_id', lb.id)
      .order('look_number', { ascending: true })

    const looks: Look[] = (rawLooks ?? []).map((l: Record<string, unknown>) => {
      const p   = l.products as Record<string, unknown> | null
      const cat = p?.categories as Record<string, string> | null
      const imgs = (p?.product_images as { url: string; position: number }[] | null) ?? []
      const primary = imgs.sort((a, b) => a.position - b.position)[0]?.url ?? null

      return {
        id:          String(l.id),
        look_number: Number(l.look_number),
        image_url:   l.image_url ? String(l.image_url) : null,
        product: p ? {
          id:              String(p.id),
          slug:            String(p.slug),
          name:            String(p.name),
          price:           Number(p.price),
          category_slug:   cat?.slug   ?? '',
          category_gender: cat?.gender ?? 'women',
          primary_image:   primary,
        } : null,
      }
    })

    return { ...lb, looks } as LookbookDetail
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const chapter = parseInt((await params).chapter, 10)
  if (isNaN(chapter)) return { title: 'Lookbook — The Possah' }
  const lb = await getLookbook(chapter)
  if (!lb) return { title: 'Lookbook — The Possah' }
  return {
    title:       `${lb.collection_name} — The Possah Lookbook`,
    description: lb.concept_text ?? `Chapter ${lb.chapter_number}: ${lb.theme_word}. ${lb.season} ${lb.year} collection from The Possah.`,
    alternates:  { canonical: `https://thepossah.com/lookbook/${lb.chapter_number}` },
  }
}

export default async function LookbookDetailPage({ params }: { params: Promise<{ chapter: string }> }) {
  const chapter = parseInt((await params).chapter, 10)
  if (isNaN(chapter)) notFound()

  const lb = await getLookbook(chapter)
  if (!lb) notFound()

  const heroSrc  = lb.hero_image || PH
  const hasLooks = lb.looks.length > 0

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div
        className="relative w-full flex items-end"
        style={{ minHeight: 'clamp(480px, 65vw, 760px)' }}
      >
        <Image
          src={heroSrc}
          alt={lb.collection_name}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.82) 0%, rgba(15,25,18,0.2) 55%, transparent 100%)' }}
          aria-hidden="true"
        />

        <div className="relative container-site pb-14 z-10 w-full">
          <Link
            href="/lookbook"
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color:         'rgba(244,236,223,0.55)',
              display:       'inline-flex',
              alignItems:    'center',
              gap:           6,
              marginBottom:  20,
            }}
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M11 4H1M5 1L1 4l4 3" />
            </svg>
            Lookbook
          </Link>

          <p
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '10px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color:         'rgba(244,236,223,0.55)',
              marginBottom:  10,
            }}
          >
            Chapter {String(lb.chapter_number).padStart(2, '0')} — {lb.season} {lb.year}
          </p>

          <h1
            style={{
              fontFamily:    'var(--font-display)',
              fontSize:      'clamp(36px, 7vw, 88px)',
              fontWeight:    '400',
              color:         'var(--color-white)',
              lineHeight:    1,
              letterSpacing: '-0.01em',
              marginBottom:  14,
            }}
          >
            {lb.collection_name}
          </h1>

          <p
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color:         'rgba(244,236,246,0.45)',
            }}
          >
            {lb.theme_word}
          </p>
        </div>
      </div>

      {/* ── Concept ──────────────────────────────────────────────────── */}
      {lb.concept_text && (
        <section className="section-gap border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="container-site max-w-[640px]">
            <p
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         'var(--color-text-muted)',
                marginBottom:  20,
              }}
            >
              The Concept
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize:   'clamp(22px, 3.5vw, 40px)',
                fontWeight: '400',
                color:      'var(--color-text)',
                lineHeight: 1.35,
              }}
            >
              {lb.concept_text}
            </p>
          </div>
        </section>
      )}

      {/* ── Looks grid ───────────────────────────────────────────────── */}
      {hasLooks && (
        <section className="section-gap">
          <div className="container-site">
            <p
              style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      '10px',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color:         'var(--color-text-muted)',
                marginBottom:  40,
              }}
            >
              The Looks
            </p>

            <div className="grid sm:grid-cols-2 gap-6 lg:gap-10">
              {lb.looks.map((look) => {
                const imgSrc = look.image_url || look.product?.primary_image || PH
                const href   = look.product
                  ? `/${look.product.category_gender}/${look.product.category_slug}/${look.product.slug}`
                  : null

                return (
                  <div key={look.id} className="flex flex-col gap-4">
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-card)' }}
                    >
                      <Image
                        src={imgSrc}
                        alt={look.product?.name ?? `Look ${look.look_number}`}
                        fill
                        className="object-cover object-center img-hover-scale"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                      <div
                        className="absolute top-4 left-4"
                        style={{
                          fontFamily:      'var(--font-mono)',
                          fontSize:        '9px',
                          letterSpacing:   '0.2em',
                          textTransform:   'uppercase',
                          color:           'rgba(244,236,223,0.6)',
                          backgroundColor: 'rgba(15,25,18,0.45)',
                          padding:         '4px 8px',
                          borderRadius:    4,
                        }}
                      >
                        Look {String(look.look_number).padStart(2, '0')}
                      </div>
                    </div>

                    {look.product && (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontSize:   'clamp(16px, 2vw, 20px)',
                              fontWeight: '400',
                              color:      'var(--color-text)',
                              lineHeight: 1.2,
                            }}
                          >
                            {look.product.name}
                          </p>
                          <p
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize:   '11px',
                              color:      'var(--color-text-muted)',
                              marginTop:  4,
                            }}
                          >
                            &#8377;{look.product.price.toLocaleString('en-IN')}
                          </p>
                        </div>
                        {href && (
                          <Link
                            href={href}
                            style={{
                              fontFamily:      'var(--font-body)',
                              fontSize:        '11px',
                              fontWeight:      '500',
                              letterSpacing:   '0.08em',
                              textTransform:   'uppercase',
                              color:           'var(--color-bg)',
                              backgroundColor: 'var(--color-green)',
                              padding:         '9px 16px',
                              borderRadius:    'var(--radius-btn)',
                              whiteSpace:      'nowrap',
                              flexShrink:      0,
                            }}
                            className="hover:opacity-85 transition-opacity duration-200"
                          >
                            Shop Look
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {!hasLooks && (
        <section className="section-gap">
          <div className="container-site max-w-[480px]">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
              The looks for this collection are being curated. Check back soon.
            </p>
          </div>
        </section>
      )}

      {/* ── Footer nav ───────────────────────────────────────────────── */}
      <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="container-site flex items-center justify-between">
          <Link
            href="/lookbook"
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color:         'var(--color-text-muted)',
              display:       'inline-flex',
              alignItems:    'center',
              gap:           8,
            }}
            className="hover:opacity-70 transition-opacity duration-200"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M13 5H1M5 1L1 5l4 4" />
            </svg>
            All Lookbooks
          </Link>

          <Link
            href="/women"
            style={{
              fontFamily:      'var(--font-body)',
              fontSize:        '12px',
              fontWeight:      '500',
              letterSpacing:   '0.08em',
              textTransform:   'uppercase',
              color:           'var(--color-bg)',
              backgroundColor: 'var(--color-green)',
              padding:         '11px 24px',
              borderRadius:    'var(--radius-btn)',
            }}
            className="hover:opacity-85 transition-opacity duration-200"
          >
            Shop The Collection
          </Link>
        </div>
      </section>
    </>
  )
}
