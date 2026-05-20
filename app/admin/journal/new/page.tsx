import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleForm } from '../ArticleForm'

export const metadata: Metadata = { title: 'New Article' }

export default function AdminJournalNewPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link
          href="/admin/journal"
          style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}
        >
          ← Back to Journal
        </Link>
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          New Article
        </h1>
      </div>

      <ArticleForm mode="new" />
    </div>
  )
}
