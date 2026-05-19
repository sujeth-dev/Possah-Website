'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useWishlistStore } from '@/lib/store/wishlistStore'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@/lib/utils'

export function WishlistView() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const addToCart = useCartStore((s) => s.addItem)

  if (items.length === 0) {
    return (
      <div className="container-site py-24 flex flex-col items-center gap-6 text-center">
        <svg width="56" height="48" viewBox="0 0 56 48" fill="none" stroke="var(--color-border)" strokeWidth="1.5">
          <path d="M28 44S6 30 6 14a11 11 0 0 1 22-2 11 11 0 0 1 22 2c0 16-22 30-22 30z" />
        </svg>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 4vw, 32px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              marginBottom: 8,
            }}
          >
            Your wishlist is empty.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Heart the pieces you love — find them here.
          </p>
        </div>
        <Link
          href="/shop/sarees"
          className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          Explore The Edit
        </Link>
      </div>
    )
  }

  return (
    <div className="container-site py-10 pb-24">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Wishlist
        </h1>
        <div className="flex items-center gap-4">
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}
          >
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </span>
          <button
            onClick={clearWishlist}
            className="hover:opacity-60 transition-opacity duration-200"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10" role="list" aria-label="Wishlist items">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? 'default'}`} role="listitem" className="flex flex-col gap-3">
            {/* Image */}
            <Link href={`/shop/${item.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-card)', backgroundColor: 'var(--color-border)' }}>
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover object-center img-hover-scale"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* Remove heart */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  removeItem(item.productId)
                }}
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 transition-opacity duration-150 hover:opacity-70"
                style={{
                  backgroundColor: 'rgba(244,236,223,0.85)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(4px)',
                }}
                aria-label={`Remove ${item.name} from wishlist`}
              >
                <svg width="14" height="12" viewBox="0 0 14 12" fill="var(--color-rose)" stroke="var(--color-rose)" strokeWidth="1.2">
                  <path d="M7 10.5S1 7 1 3.5a2.5 2.5 0 0 1 5-.5 2.5 2.5 0 0 1 5 .5C11 7 7 10.5 7 10.5z" />
                </svg>
              </button>
            </Link>

            {/* Info */}
            <div className="flex flex-col gap-1">
              <Link href={`/shop/${item.slug}`} className="hover:opacity-70 transition-opacity duration-150">
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '500', color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {item.name}
                </p>
              </Link>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {formatPrice(item.price)}
              </p>
            </div>

            {/* Move to bag */}
            <button
              onClick={() => {
                addToCart({
                  productId: item.productId,
                  variantId: item.variantId ?? `${item.productId}-default`,
                  name: item.name,
                  image: item.image,
                  price: item.price,
                  colour: 'Default',
                  colourHex: '#000000',
                  size: 'Free Size',
                  qty: 1,
                  slug: item.slug,
                })
                removeItem(item.productId)
              }}
              className="w-full flex items-center justify-center py-2.5 transition-opacity duration-200 hover:opacity-80"
              style={{
                border: '1.5px solid var(--color-green)',
                color: 'var(--color-green)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'transparent',
              }}
            >
              Move to Bag
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
