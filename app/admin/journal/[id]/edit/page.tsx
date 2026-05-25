import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArticleForm, type ArticleFormData } from '../../ArticleForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return { title: `Edit Article` }
}

async function getArticle(id: string) {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('journal_articles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

export default async function AdminJournalEditPage({ params }: PageProps) {
  const article = await getArticle(params.id)
  if (!article) notFound()

  const initialData: ArticleFormData = {
    title:          article.title ?? '',
    slug:           article.slug ?? '',
    category:       article.category as ArticleFormData['category'],
    author:         article.author ?? '',
    featured_image: article.featured_image ?? '',
    body:           article.body ?? '',
    is_featured:    article.is_featured ?? false,
    published_at:   article.published_at ?? '',
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/admin/journal"
          style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}
        >
          ← Back to Journal
        </Link>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
            Edit Article
          </h1>
          <a
            href={`/journal/${article.slug}`}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-gold)', textDecoration: 'none' }}
          >
            View live ↗
          </a>
        </div>
      </div>

      <ArticleForm mode="edit" articleId={params.id} initialData={initialData} />
    </div>
  )
}
