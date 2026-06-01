'use client'

import { useState, useCallback, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { ProductCardData } from '@/app/(shop)/page'

const PAGE_SIZE = 24

interface CategoryListingProps {
  initialProducts: ProductCardData[]
  total: number
  categorySlug: string
  topSellingOnly?: boolean
  newInOnly?: boolean
}

export function CategoryListing({
  initialProducts,
  total,
  categorySlug,
  topSellingOnly = false,
  newInOnly = false,
}: CategoryListingProps) {
  const searchParams = useSearchParams()
  const [products, setProducts]     = useState<ProductCardData[]>(initialProducts)
  const [loadedTotal, setLoadedTotal] = useState(initialProducts.length)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasMore = loadedTotal < total

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    setError(null)

    try {
      const nextPage = page + 1
      const params = new URLSearchParams()
      params.set('category', categorySlug)
      params.set('page', String(nextPage))

      // Forward active filters from URL
      const occasion = searchParams.get('occasion')
      const fabric   = searchParams.get('fabric')
      const size     = searchParams.get('size')
      const subLine  = searchParams.get('sub_line')
      const sort     = searchParams.get('sort')

      if (occasion) params.set('occasion', occasion)
      if (fabric)   params.set('fabric', fabric)
      if (size)     params.set('size', size)
      if (subLine)  params.set('sub_line', subLine)
      if (sort)     params.set('sort', sort)
      if (topSellingOnly) params.set('top_selling', 'true')
      if (newInOnly)      params.set('new_in', 'true')

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: { products: ProductCardData[]; total: number } = await res.json()

      startTransition(() => {
        setProducts((prev) => [...prev, ...data.products])
        setLoadedTotal((prev) => prev + data.products.length)
        setPage(nextPage)
      })
    } catch {
      setError('Could not load more pieces. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, categorySlug, searchParams, topSellingOnly])

  return (
    <>
      <ProductGrid products={products} loading={isPending} columns={3} />

      {/* Show More */}
      {hasMore && (
        <div className="flex flex-col items-center mt-12 gap-3">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 transition-opacity duration-200 hover:opacity-75 px-10 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              border: '1.5px solid var(--color-green)',
              color: 'var(--color-green)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'transparent',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  stroke="currentColor" strokeWidth="1.5"
                  className="animate-spin"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="5" strokeOpacity="0.3" />
                  <path d="M7 2a5 5 0 015 5" />
                </svg>
                Loading…
              </>
            ) : (
              'Show More Pieces'
            )}
          </button>
          {error && (
            <p
              style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-error)' }}
              role="alert"
            >
              {error}
            </p>
          )}
          <p
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}
          >
            Showing {loadedTotal} of {total}
          </p>
        </div>
      )}

      {/* All loaded indicator */}
      {!hasMore && total > PAGE_SIZE && (
        <p
          className="text-center mt-10"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}
        >
          All {total} pieces loaded
        </p>
      )}
    </>
  )
}
