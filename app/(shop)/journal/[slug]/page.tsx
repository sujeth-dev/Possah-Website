import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'

interface PageProps {
  params: { slug: string }
}

interface Article {
  id: string
  slug: string
  title: string
  category: string
  author: string
  body: string | null
  featured_image: string | null
  published_at: string | null
  is_featured: boolean
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('journal_articles')
      .select('id, slug, title, category, author, body, featured_image, published_at, is_featured')
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .single()
    return (data as Article) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug)
  if (!article) return { title: 'Journal' }

  return {
    title: `${article.title} — The Possah Journal`,
    description: `${article.title} — a story about ${article.category.toLowerCase()} from The Possah.`,
    alternates: { canonical: `https://thepossah.com/journal/${article.slug}` },
    openGraph: article.featured_image
      ? { images: [{ url: article.featured_image }] }
      : undefined,
  }
}

export default async function JournalArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug)
  if (!article) notFound()

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <>
      {/* Hero */}
      {article.featured_image && (
        <div
          className="relative w-full overflow-hidden"
          style={{ maxHeight: 520, aspectRatio: '16/7' }}
        >
          <Image
            src={article.featured_image}
            alt={article.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      )}

      {/* Article */}
      <div className="container-site py-12 pb-24 max-w-[720px] mx-auto">
        {/* Back */}
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 mb-8 hover:opacity-60 transition-opacity duration-200"
          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
        >
          ← Journal
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            {article.category}
          </span>
          <span style={{ color: 'var(--color-border)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {article.author}
          </span>
          {publishedDate && (
            <>
              <span style={{ color: 'var(--color-border)' }}>·</span>
              <time
                dateTime={article.published_at ?? undefined}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}
              >
                {publishedDate}
              </time>
            </>
          )}
        </div>

        {/* Title */}
        <h1
          className="mb-8"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {article.title}
        </h1>

        {/* Body */}
        {article.body ? (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              lineHeight: 1.85,
              color: 'var(--color-text-muted)',
              whiteSpace: 'pre-line',
            }}
          >
            {article.body}
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
            This story is coming soon.
          </p>
        )}

        {/* Footer */}
        <div
          className="mt-16 pt-8 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Link
            href="/journal"
            className="hover:opacity-60 transition-opacity duration-200"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-green)' }}
          >
            ← All Stories
          </Link>
          <Link
            href="/shop/sarees"
            className="hover:opacity-60 transition-opacity duration-200"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
          >
            Explore The Edit →
          </Link>
        </div>
      </div>
    </>
  )
}
