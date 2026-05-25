import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReviewManager } from './ReviewManager'

export const metadata: Metadata = { title: 'Reviews' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { status?: string }
}

async function getReviews(status: string) {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('reviews')
      .select('*, product:product_id ( id, name, slug )')
      .order('created_at', { ascending: false })

    if (status === 'pending')  query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)

    const { data, error } = await query
    if (error) { console.error('[Admin Reviews]', error); return [] }
    return data ?? []
  } catch {
    return []
  }
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const status  = searchParams.status ?? 'pending'
  const reviews = await getReviews(status)
  const total   = reviews.length

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          Reviews
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {total} {status !== 'all' ? status : ''} review{total !== 1 ? 's' : ''}.
          New reviews default to pending — approve to make them visible on the PDP.
        </p>
      </div>

      <ReviewManager initialReviews={reviews} initialStatus={status} />
    </div>
  )
}
