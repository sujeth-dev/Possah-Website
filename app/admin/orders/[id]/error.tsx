'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminOrderDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error('[AdminOrderDetailError]', error) }, [error])

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', backgroundColor: '#F8F7F5' }}>
      <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C0392B', margin: 0 }}>
          Order error
        </p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 400, color: '#1A1A1A', margin: 0 }}>
          Could not load order
        </h2>
        <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.6, margin: 0 }}>
          {error.message ?? 'An error occurred while loading this order.'}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={reset} style={{ padding: '10px 24px', backgroundColor: '#1F3A2D', color: '#F4ECDF', border: 'none', borderRadius: 4, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Try again
          </button>
          <Link href="/admin/orders" style={{ padding: '10px 24px', border: '1px solid #1A1A1A', color: '#1A1A1A', textDecoration: 'none', borderRadius: 4, fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
