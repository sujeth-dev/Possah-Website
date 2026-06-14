'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { formatPrice, whatsappUrl } from '@/lib/utils'
import { useCartStore } from '@/lib/store/cartStore'
import { useWishlistStore } from '@/lib/store/wishlistStore'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { AccordionItem as Accordion, AccordionGroup } from '@/components/ui/Accordion'
import { Badge } from '@/components/ui/Badge'
import { trackViewItem, trackAddToCart } from '@/lib/analytics'

interface Variant {
  id: string
  colour: string       // mapped from colour_name
  colour_hex: string
  size: string
  stock_qty: number
}

interface ProductInfoProps {
  product: {
    id: string
    slug: string
    name: string
    fabric: string | null
    description: string | null
    care_instructions: string | null
    drape_guide: string | null
    price: number
    compare_price: number | null
    is_new_arrival: boolean
    is_top_selling: boolean
    audio_url: string | null
    sub_line: string | null
    category_slug: string
    category_gender: string
    images: { url: string; alt: string | null }[]
  }
  variants: Variant[]
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Free Size', 'Made-to-Measure']

export function ProductInfo({ product, variants }: ProductInfoProps) {
  const addToCart = useCartStore((s) => s.addItem)
  const { toggleItem, isInWishlist } = useWishlistStore()

  // Group variants by colour
  const colourMap = useMemo(() => {
    const map = new Map<string, { hex: string; variants: Variant[] }>()
    for (const v of variants) {
      if (!map.has(v.colour)) {
        map.set(v.colour, { hex: v.colour_hex, variants: [] })
      }
      map.get(v.colour)!.variants.push(v)
    }
    return map
  }, [variants])
  const colours = Array.from(colourMap.entries())

  const [selectedColour, setSelectedColour] = useState<string>(colours[0]?.[0] ?? '')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [addedState, setAddedState] = useState<'idle' | 'added'>('idle')
  const [sizeError, setSizeError] = useState(false)

  const colourVariants = colourMap.get(selectedColour)?.variants ?? []
  const availableSizes = colourVariants
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
    .map((v) => v.size)

  const selectedVariant = colourVariants.find((v) => v.size === selectedSize) ?? null
  const inWishlist = isInWishlist(product.id)
  const primaryImage = product.images[0]?.url ?? 'https://cdn.thepossah.com/ui/placeholder.svg'
  const showAudio = (product.is_new_arrival || product.is_top_selling) && !!product.audio_url

  // GA4: view_item on mount
  // useEffect is imported at the top of this file (from 'react')
  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.name,
      category: product.category_slug,
      price: product.price,
    })
  }, [product.id, product.name, product.category_slug, product.price])

  const handleColourChange = (colour: string) => {
    setSelectedColour(colour)
    setSelectedSize('')
    setSizeError(false)
  }

  const handleAddToCart = useCallback(() => {
    if (!selectedSize) { setSizeError(true); return }
    if (!selectedVariant) return

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      image: primaryImage,
      price: product.price,
      colour: selectedColour,
      colourHex: colourMap.get(selectedColour)?.hex ?? '#000000',
      size: selectedSize,
      qty: 1,
      slug: `/${product.category_gender}/${product.category_slug}/${product.slug}`,
      availableVariants: colourVariants.map((v) => ({
        variantId:  v.id,
        size:       v.size,
        stock_qty:  v.stock_qty,
      })),
    })
    setAddedState('added')
    setTimeout(() => setAddedState('idle'), 2000)
    // GA4: add_to_cart
    trackAddToCart({
      id: product.id,
      name: product.name,
      category: product.category_slug,
      colour: selectedColour,
      size: selectedSize,
      price: product.price,
      qty: 1,
    })
  }, [selectedSize, selectedVariant, addToCart, product, primaryImage, selectedColour, colourMap])

  const handleWishlist = () => {
    toggleItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      image: primaryImage,
      price: product.price,
      slug: `/${product.category_gender}/${product.category_slug}/${product.slug}`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.sub_line && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            {product.sub_line}
          </span>
        )}
        {product.is_new_arrival && <Badge variant="new" />}
        {product.is_top_selling && <Badge variant="sale">BEST SELLER</Badge>}
      </div>

      {/* Name */}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '400', color: 'var(--color-text)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
        {product.name}
      </h1>

      {/* Fabric */}
      {product.fabric && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
          {product.fabric}
        </p>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '500', color: 'var(--color-text)' }}>
          {formatPrice(product.price)}
        </span>
        {product.compare_price && product.compare_price > product.price && (
          <>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
              {formatPrice(product.compare_price)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-green)', textTransform: 'uppercase' }}>
              {Math.round(((product.compare_price - product.price) / product.compare_price) * 100)}% OFF
            </span>
          </>
        )}
      </div>

      {/* Audio story */}
      {showAudio && <AudioPlayer src={product.audio_url!} />}

      {/* Colour selector */}
      {colours.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>COLOUR</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>{selectedColour}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {colours.map(([colour, { hex }]) => (
              <button
                key={colour}
                onClick={() => handleColourChange(colour)}
                title={colour}
                aria-label={`Select colour ${colour}`}
                aria-pressed={selectedColour === colour}
                className="transition-all duration-150"
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: hex,
                  border: selectedColour === colour ? '2px solid var(--color-green)' : '2px solid transparent',
                  boxShadow: selectedColour === colour ? '0 0 0 1.5px var(--color-green)' : '0 0 0 1px var(--color-border)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
            SIZE
          </span>
          <Link href="/size-guide" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', textDecoration: 'underline', textDecorationColor: 'var(--color-border)' }}>
            Size Guide
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {availableSizes.length === 0 ? (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {colours.length > 0 ? 'Select a colour to see sizes' : 'Currently unavailable'}
            </span>
          ) : (
            availableSizes.map((size) => {
              const v = colourVariants.find((vv) => vv.size === size)
              const lowStock = v && v.stock_qty > 0 && v.stock_qty <= 3
              return (
                <button
                  key={size}
                  onClick={() => { setSelectedSize(size); setSizeError(false) }}
                  className="relative transition-all duration-150"
                  style={{
                    minWidth: 44, height: 44, padding: '0 12px',
                    border: `1.5px solid ${selectedSize === size ? 'var(--color-green)' : 'var(--color-border)'}`,
                    backgroundColor: selectedSize === size ? 'var(--color-green)' : 'transparent',
                    color: selectedSize === size ? 'var(--color-white)' : 'var(--color-text)',
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    borderRadius: 'var(--radius-btn)',
                    cursor: 'pointer',
                  }}
                  aria-pressed={selectedSize === size}
                  aria-label={`Size ${size}${lowStock ? ' — only a few left' : ''}`}
                >
                  {size}
                  {lowStock && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-rose)' }} aria-hidden="true" />
                  )}
                </button>
              )
            })
          )}
        </div>
        {sizeError && (
          <p
            role="alert"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-rose)',
              marginTop: 4,
            }}
          >
            Please select a size to continue.
          </p>
        )}
      </div>

      {/* Add to cart + wishlist */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={addedState === 'added'}
          className="flex-1 flex items-center justify-center gap-2 py-4 transition-all duration-200"
          style={{
            backgroundColor: addedState === 'added' ? 'var(--color-text-muted)' : 'var(--color-green)',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)', border: 'none',
          }}
          aria-live="polite"
        >
          {addedState === 'added' ? (
            <>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 5l4 4L13 1" /></svg>
              Added to Bag
            </>
          ) : 'Add to Bag'}
        </button>

        <button
          onClick={handleWishlist}
          className="flex items-center justify-center w-14 h-[56px] transition-all duration-200 hover:opacity-70"
          style={{ border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-btn)', backgroundColor: 'transparent' }}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={inWishlist}
        >
          <svg width="18" height="16" viewBox="0 0 18 16" fill={inWishlist ? 'var(--color-rose)' : 'none'} stroke={inWishlist ? 'var(--color-rose)' : 'var(--color-text)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14.5S1.5 10 1.5 4.5a3.5 3.5 0 0 1 7-0.5 3.5 3.5 0 0 1 7 .5C15.5 10 9 14.5 9 14.5z" />
          </svg>
        </button>
      </div>

      {/* WhatsApp */}
      <a
        href={whatsappUrl('+919876543210', `Hi! I'm interested in ${product.name}. Can you help me with more details?`)}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-70"
        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1C4.134 1 1 4.134 1 8c0 1.27.322 2.463.887 3.5L1 15l3.563-.876A6.966 6.966 0 0 0 8 15c3.866 0 7-3.134 7-7s-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M5.5 5.5c.167.444.667 1.556 1 2 .333.444 1.222 1.222 1.5 1.333.278.111 1.444.667 2 .667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        Ask about this piece on WhatsApp
      </a>

      {/* Accordions */}
      <AccordionGroup>
        {(product.fabric || product.description) && (
          <Accordion title="Fabric & Craft" defaultOpen>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text-muted)' }}>
              {product.fabric && <p>{product.fabric}</p>}
              {product.description && <p className="mt-2" style={{ whiteSpace: 'pre-line' }}>{product.description}</p>}
            </div>
          </Accordion>
        )}
        {product.care_instructions && (
          <Accordion title="Care Ritual">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text-muted)', whiteSpace: 'pre-line' }}>
              {product.care_instructions}
            </p>
          </Accordion>
        )}
        {product.drape_guide && (
          <Accordion title="Drape Guide">
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text-muted)', whiteSpace: 'pre-line' }}>
              {product.drape_guide}
            </p>
          </Accordion>
        )}
        <Accordion title="Shipping & Returns">
          <div style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.75, color: 'var(--color-text-muted)' }}>
            <p>Free shipping on orders above ₹2,500. Delivered in 5–7 business days.</p>
            <p className="mt-2">Returns accepted within 7 days of delivery for unused pieces in original packaging. Made-to-measure orders are non-refundable.</p>
          </div>
        </Accordion>
      </AccordionGroup>
    </div>
  )
}
