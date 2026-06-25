import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const metadata: Metadata = {
  title: 'Lookbook',
  description: 'Curated editorial lookbooks from The Possah. Discover how to wear Indian handloom for every moment.',
  alternates: { canonical: 'https://thepossah.com/lookbook' },
}

interface Lookbook {
  id: string
  collection_name: string
  season: string
  year: number
  theme_word: string
  chapter_number: number
  hero_image: string | null
  concept_text: string | null
}

const PH = 'https://cdn.thepossah.com/ui/placeholder.svg'

const STATIC_LOOKBOOKS: Lookbook[] = [
  {
    id: '1',
    collection_name: 'The Quiet Ceremony',
    season: 'Wedding',
    year: 2024,
    theme_word: 'Devotion',
    chapter_number: 1,
    hero_image: PH,
    concept_text: 'For the bride who dresses with intention.',
  },
  {
    id: '2',
    collection_name: 'Saffron Season',
    season: 'Festive',
    year: 2024,
    theme_word: 'Radiance',
    chapter_number: 2,
    hero_image: PH,
    concept_text: 'The festive palette, reinterpreted.',
  },
]

async function getLookbooks(): Promise<Lookbook[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('lookbooks')
      .select('id, collection_name, season, year, theme_word, chapter_number, hero_image, concept_text')
      .eq('is_active', true)
      .order('chapter_number', { ascending: false })
    if (!data || data.length === 0) return STATIC_LOOKBOOKS
    return data as Lookbook[]
  } catch {
    return STATIC_LOOKBOOKS
  }
}

export default async function LookbookPage() {
  const lookbooks = await getLookbooks()

  return (
    <>
      {/* Header */}
      <div className="container-site py-12 pb-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="section-label mb-3">THE POSSAH</p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 6vw, 80px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Lookbook
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(14px, 1.5vw, 17px)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.65,
            maxWidth: 480,
          }}
        >
          Seasonal editorials. Each chapter is a world — styled with intention, shot with care.
        </p>
      </div>

      <div className="container-site py-12 pb-24">
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-10">
          {lookbooks.map((lb, i) => (
            <Link
              key={lb.id}
              href={`/lookbook/${lb.chapter_number}`}
              className="group relative overflow-hidden block"
              style={{
                borderRadius: 'var(--radius-card)',
                aspectRatio: '3/4',
              }}
            >
              <Image
                src={lb.hero_image || PH}
                alt={lb.collection_name}
                fill
                className="object-cover object-center img-hover-scale"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={i === 0}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(15,25,18,0.65) 0%, transparent 50%)' }}
                aria-hidden="true"
              />
              <div className="absolute bottom-5 left-5 right-5">
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(244,236,223,0.7)',
                    marginBottom: 4,
                  }}
                >
                  {lb.season} {lb.year}
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(20px, 2.5vw, 28px)',
                    fontWeight: '400',
                    color: 'var(--color-white)',
                    lineHeight: 1.15,
                  }}
                  className="group-hover:opacity-90 transition-opacity duration-200"
                >
                  {lb.collection_name}
                </h2>
                {lb.theme_word && (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(244,236,223,0.55)',
                      marginTop: 6,
                    }}
                  >
                    {lb.theme_word}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
