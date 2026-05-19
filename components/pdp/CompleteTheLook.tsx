import { ProductCard } from '@/components/shop/ProductCard'
import type { ProductCardData } from '@/app/(shop)/page'

interface CompleteTheLookProps {
  products: ProductCardData[]
}

export function CompleteTheLook({ products }: CompleteTheLookProps) {
  if (products.length === 0) return null

  return (
    <section
      className="section-gap border-t"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="Complete the look"
    >
      <div className="container-site">
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
            Complete the look
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10" role="list" aria-label="Complementary products">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} role="listitem">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
