'use client'

import { useState } from 'react'
import Link from 'next/link'

const MESSAGES = [
  'FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE',
  'NEW ARRIVALS: THE SPRING 26 COLLECTION IS HERE',
  'COMPLIMENTARY ALTERATIONS ON ALL ORDERS ABOVE ₹10,000',
]

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (dismissed) return null

  return (
    <div
      style={{
        backgroundColor: 'var(--color-green)',
        color: 'var(--color-bg)',
      }}
      className="relative w-full z-50"
      role="banner"
      aria-label="Announcement"
    >
      <div className="flex items-center justify-center gap-4 px-8 py-2.5 min-h-[36px]">
        {/* Messages — rotates through MESSAGES on click */}
        <p
          className="text-center cursor-pointer select-none"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-label)',
            letterSpacing: '0.18em',
          }}
          onClick={() => setCurrentIndex((i) => (i + 1) % MESSAGES.length)}
          title="Click to see more"
        >
          {MESSAGES[currentIndex].includes('NEW ARRIVALS') ? (
            <>
              NEW ARRIVALS:{' '}
              <Link
                href="/shop/sarees"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                THE SPRING 26 COLLECTION IS HERE
              </Link>
            </>
          ) : MESSAGES[currentIndex].includes('MADE-TO-MEASURE') ? (
            <>
              FREE SHIPPING ACROSS INDIA ·{' '}
              <Link
                href="/made-to-measure"
                className="underline underline-offset-2 hover:opacity-80 transition-opacity duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                MADE-TO-MEASURE AVAILABLE
              </Link>
            </>
          ) : (
            MESSAGES[currentIndex]
          )}
        </p>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity duration-200"
          aria-label="Dismiss announcement"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>
    </div>
  )
}
