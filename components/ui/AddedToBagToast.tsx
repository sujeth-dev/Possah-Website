'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartToastStore } from '@/lib/store/cartToastStore'
import { formatPrice } from '@/lib/utils'

const AUTO_DISMISS_MS = 4000

export function AddedToBagToast() {
  const { item, hide } = useCartToastStore()
  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!item) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(hide, AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item, hide])

  if (!item) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="toast-position"
      style={{
        backgroundColor: 'var(--color-green)',
        color:           'var(--color-bg)',
        borderRadius:    'var(--radius-card)',
        boxShadow:       '0 8px 32px rgba(0,0,0,0.22)',
        display:         'flex',
        alignItems:      'center',
        gap:             12,
        padding:         '12px 14px',
      }}
    >
      {/* Product thumbnail */}
      {item.image && (
        <div
          style={{
            width:      44,
            height:     56,
            flexShrink: 0,
            borderRadius: 2,
            overflow:   'hidden',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Image
            src={item.image}
            alt={item.name}
            width={44}
            height={56}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            unoptimized
          />
        </div>
      )}

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '9px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity:       0.7,
            marginBottom:  3,
          }}
        >
          Added to Bag
        </p>
        <p
          style={{
            fontFamily:   'var(--font-body)',
            fontSize:     '13px',
            fontWeight:   500,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}
        >
          {item.name}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize:   '12px',
            opacity:    0.75,
            marginTop:  1,
          }}
        >
          {formatPrice(item.price)}
        </p>
      </div>

      {/* "Go to Bag" CTA */}
      <Link
        href="/cart"
        onClick={hide}
        style={{
          flexShrink:          0,
          fontFamily:          'var(--font-mono)',
          fontSize:            '9px',
          letterSpacing:       '0.14em',
          textTransform:       'uppercase',
          color:               'var(--color-bg)',
          textDecoration:      'underline',
          textDecorationColor: 'rgba(244,236,223,0.5)',
          whiteSpace:          'nowrap',
        }}
      >
        Go to Bag →
      </Link>

      {/* Close button */}
      <button
        onClick={hide}
        aria-label="Dismiss notification"
        style={{
          flexShrink:      0,
          background:      'none',
          border:          'none',
          padding:         '4px',
          cursor:          'pointer',
          opacity:         0.6,
          color:           'var(--color-bg)',
          lineHeight:      1,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1l10 10M11 1L1 11" />
        </svg>
      </button>
    </div>
  )
}
