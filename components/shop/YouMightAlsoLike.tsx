import Link from 'next/link'
import { ProductCard } from './ProductCard'
import type { ProductCardData } from '@/app/(shop)/page'

interface YouMightAlsoLikeProps {
  products: ProductCardData[]
  heading?: string
}

export function YouMightAlsoLike({
  products,
  heading = 'You might also like',
}: YouMightAlsoLikeProps) {
  if (products.length === 0) return null

  return (
    <section className="section-gap border-t" style={{ borderColor: 'var(--color-border)' }} aria-label={heading}>
      <div className="container-site">
        {/* Heading */}
        <div className="flex items-baseline justify-between mb-8">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            {heading}
          </h2>
          <Link
            href="/shop/sarees"
            className="flex items-center gap-1 hover:opacity-60 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-text)',
            }}
          >
            View All →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div
          className="flex gap-4 md:grid md:grid-cols-5 overflow-x-auto md:overflow-visible pb-2 md:pb-0"
          style={{ scrollbarWidth: 'none' }}
        >
          {products.slice(0, 5).map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[180px] md:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
