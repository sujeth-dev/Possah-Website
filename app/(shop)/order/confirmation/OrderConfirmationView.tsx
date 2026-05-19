'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function OrderConfirmationView() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const paymentId = searchParams.get('payment')

  const [verified, setVerified] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    if (!orderNumber) {
      setVerified('error')
      return
    }
    // If we have a payment ID we can show success — full sig verification happens via webhook
    // For confirmation page UX we trust the presence of the order number
    setVerified('ok')
  }, [orderNumber])

  if (verified === 'loading') {
    return (
      <div className="container-site py-24 flex items-center justify-center">
        <span
          className="inline-block w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-green)' }}
          aria-label="Loading"
        />
      </div>
    )
  }

  if (!orderNumber || verified === 'error') {
    return (
      <div className="container-site py-24 flex flex-col items-center gap-6 text-center">
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: '400',
            color: 'var(--color-text)',
          }}
        >
          We couldn&rsquo;t find your order.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Please check your email for a confirmation, or contact us on WhatsApp.
        </p>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-green)',
            textDecoration: 'underline',
          }}
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="container-site py-16 pb-24 flex flex-col items-center gap-8 text-center max-w-[600px] mx-auto">
      {/* Check mark */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-full"
        style={{ backgroundColor: 'rgba(31, 58, 45, 0.08)', border: '1.5px solid var(--color-green)' }}
      >
        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9l7 7L22 2" />
        </svg>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-3">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Your order is confirmed.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            lineHeight: 1.7,
            color: 'var(--color-text-muted)',
          }}
        >
          Thank you for choosing The Possah. A confirmation email is on its way to you.
          We&rsquo;ll notify you once your piece is dispatched.
        </p>
      </div>

      {/* Order number */}
      <div
        className="w-full flex flex-col items-center gap-2 py-5 px-6"
        style={{
          backgroundColor: 'rgba(31, 58, 45, 0.04)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Order Number
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '20px',
            letterSpacing: '0.08em',
            color: 'var(--color-green)',
          }}
        >
          {orderNumber}
        </span>
        {paymentId && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: 'var(--color-text-muted)',
            }}
          >
            Payment: {paymentId}
          </span>
        )}
      </div>

      {/* Packaging note */}
      <blockquote
        className="px-6 py-4 text-left w-full"
        style={{
          borderLeft: '2px solid var(--color-gold)',
          backgroundColor: 'rgba(200, 151, 58, 0.05)',
          borderRadius: '0 var(--radius-card) var(--radius-card) 0',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--color-text)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;Each Possah piece is folded with intention, wrapped with care, and sent to you as it deserves — in quiet, considered packaging.&rdquo;
        </p>
      </blockquote>

      {/* Estimated delivery */}
      <div className="flex flex-col gap-1 items-center">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Estimated Delivery
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-text)',
          }}
        >
          5–7 business days
        </span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/shop/sarees"
          className="flex-1 flex items-center justify-center py-3.5 transition-opacity duration-200 hover:opacity-80"
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
          Continue Shopping
        </Link>
        <Link
          href="/account/orders"
          className="flex-1 flex items-center justify-center py-3.5 transition-opacity duration-200 hover:opacity-70"
          style={{
            border: '1.5px solid var(--color-green)',
            color: 'var(--color-green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          View My Orders
        </Link>
      </div>
    </div>
  )
}
