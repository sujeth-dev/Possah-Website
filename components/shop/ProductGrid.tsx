import { ProductCard } from './ProductCard'
import type { ProductCardData } from '@/app/(shop)/page'

interface ProductGridProps {
  products: ProductCardData[]
  loading?: boolean
  columns?: 2 | 3 | 4
}

const GRID_CLASSES: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}

export function ProductGrid({ products, loading = false, columns = 3 }: ProductGridProps) {
  const gridClass = GRID_CLASSES[columns] ?? GRID_CLASSES[3]

  // Loading skeleton
  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-x-4 gap-y-10`} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div
              className="aspect-product w-full"
              style={{ backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-card)' }}
            />
            <div className="pt-3 space-y-2">
              <div className="h-3 rounded" style={{ backgroundColor: 'var(--color-border)', width: '70%' }} />
              <div className="h-3 rounded" style={{ backgroundColor: 'var(--color-border)', width: '45%' }} />
              <div className="h-3 rounded" style={{ backgroundColor: 'var(--color-border)', width: '30%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        role="status"
        aria-label="No products found"
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-border)" strokeWidth="1.5">
          <path d="M12 6h24l6 12H6L12 6z" />
          <rect x="4" y="18" width="40" height="26" rx="2" />
          <path d="M20 30h8M24 26v8" />
        </svg>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: '500',
              color: 'var(--color-text)',
              marginBottom: '6px',
            }}
          >
            Nothing here yet — but she&rsquo;s on her way.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Try adjusting your filters or browse all pieces.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${gridClass} gap-x-4 gap-y-10`} role="list" aria-label="Products">
      {products.map((product, i) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} priority={i < 4} />
        </div>
      ))}
    </div>
  )
}
