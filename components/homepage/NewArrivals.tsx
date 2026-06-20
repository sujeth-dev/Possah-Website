import Link from 'next/link'
import type { ProductCardData } from '@/app/(shop)/page'
import { ProductCard } from '@/components/shop/ProductCard'
import { AnimatedGrid, AnimatedGridItem } from '@/components/shop/AnimatedGrid'

interface NewArrivalsProps {
  products: ProductCardData[]
}

export function NewArrivals({ products }: NewArrivalsProps) {
  // Show max 12 in 2 rows of 6 (desktop) / 2 rows of 2 (mobile)
  const displayed = products.slice(0, 12)

  return (
    <section className="section-gap" aria-label="New Arrivals">
      <div className="container-site">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-8 md:mb-10">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 4vw, 44px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            New Arrivals
          </h2>
          <Link
            href="/women"
            className="flex items-center gap-1.5 transition-opacity duration-200 hover:opacity-60"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: '500',
              letterSpacing: '0.04em',
              color: 'var(--color-text)',
            }}
          >
            View All
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 5h12M8 1l5 4-5 4" />
            </svg>
          </Link>
        </div>

        {/* Grid — 2 col mobile, 6 col desktop (2 rows) */}
        {displayed.length > 0 ? (
          <AnimatedGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-8 md:gap-y-12">
            {displayed.map((product, i) => (
              <AnimatedGridItem key={product.id}>
                <ProductCard product={product} priority={i < 4} />
              </AnimatedGridItem>
            ))}
          </AnimatedGrid>
        ) : (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center py-20 gap-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M10 5h20l4 10H6L10 5z" />
              <rect x="4" y="15" width="32" height="22" rx="2" />
            </svg>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px' }}>
              New arrivals coming soon.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
