import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const metadata: Metadata = {
  title: 'Journal — The Possah',
  description: 'Stories about craft, culture, and considered dressing from The Possah.',
  alternates: { canonical: 'https://thepossah.com/journal' },
}

interface Article {
  id: string
  slug: string
  title: string
  category: string
  author: string
  featured_image: string | null
  published_at: string | null
  is_featured: boolean
}

const STATIC_ARTICLES: Article[] = [
  {
    id: '1',
    slug: 'the-language-of-chikankari',
    title: 'The Language of Chikankari',
    category: 'Craft',
    author: 'The Possah',
    featured_image: '/images/journal-chikankari.jpg',
    published_at: '2024-09-01T00:00:00Z',
    is_featured: true,
  },
  {
    id: '2',
    slug: 'dressing-for-the-mehendi',
    title: 'Dressing for the Mehendi',
    category: 'Style',
    author: 'The Possah',
    featured_image: '/images/journal-mehendi.jpg',
    published_at: '2024-09-15T00:00:00Z',
    is_featured: false,
  },
  {
    id: '3',
    slug: 'why-linen-in-summer',
    title: 'Why Linen, Every Summer',
    category: 'Fabric',
    author: 'The Possah',
    featured_image: '/images/journal-linen.jpg',
    published_at: '2024-10-01T00:00:00Z',
    is_featured: false,
  },
]

async function getArticles(): Promise<Article[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('journal_articles')
      .select('id, slug, title, category, author, featured_image, published_at, is_featured')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(12)
    if (!data || data.length === 0) return STATIC_ARTICLES
    return data as Article[]
  } catch {
    return STATIC_ARTICLES
  }
}

export default async function JournalPage() {
  const articles = await getArticles()

  // Featured: prefer is_featured=true, otherwise first
  const featured = articles.find((a) => a.is_featured) ?? articles[0]
  const rest = articles.filter((a) => a.id !== featured?.id)

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
          }}
        >
          Journal
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--color-text-muted)',
            marginTop: 10,
            maxWidth: 480,
            lineHeight: 1.7,
          }}
        >
          Stories about craft, culture, and considered dressing.
        </p>
      </div>

      <div className="container-site py-12 pb-24">
        {/* Featured article */}
        {featured && (
          <Link
            href={`/journal/${featured.slug}`}
            className="group grid md:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 pb-16 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div
              className="relative overflow-hidden"
              style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }}
            >
              <Image
                src={featured.featured_image ?? '/images/journal-placeholder.jpg'}
                alt={featured.title}
                fill
                priority
                className="object-cover object-center img-hover-scale"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="flex flex-col gap-4">
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-green)',
                }}
              >
                {featured.category}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(24px, 4vw, 44px)',
                  fontWeight: '400',
                  color: 'var(--color-text)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.15,
                }}
                className="group-hover:opacity-80 transition-opacity duration-200"
              >
                {featured.title}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {featured.author}
                </span>
                {featured.published_at && (
                  <>
                    <span style={{ color: 'var(--color-border)' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
                      {new Date(featured.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-green)',
                  textDecoration: 'underline',
                  textDecorationColor: 'var(--color-border)',
                }}
              >
                Read →
              </span>
            </div>
          </Link>
        )}

        {/* Article grid */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((article) => (
              <Link
                key={article.id}
                href={`/journal/${article.slug}`}
                className="group flex flex-col gap-4"
              >
                <div
                  className="relative overflow-hidden"
                  style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-card)' }}
                >
                  <Image
                    src={article.featured_image ?? '/images/journal-placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover object-center img-hover-scale"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-green)' }}>
                    {article.category}
                  </span>
                  <h3
                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: '400', color: 'var(--color-text)', lineHeight: 1.2 }}
                    className="group-hover:opacity-80 transition-opacity duration-200"
                  >
                    {article.title}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {article.author}
                    {article.published_at && (
                      <> · {new Date(article.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {articles.length === 0 && (
          <div className="py-24 text-center">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
              No stories published yet. Check back soon.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
