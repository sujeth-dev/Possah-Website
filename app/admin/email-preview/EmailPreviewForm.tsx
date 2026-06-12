'use client'

import { useState } from 'react'

interface OrderOption {
  id:            string
  order_number:  string
  customer_name: string
}

interface EmailPreviewFormProps {
  orders: OrderOption[]
}

const inputStyle: React.CSSProperties = {
  width:           '100%',
  padding:         '9px 12px',
  border:          '1px solid var(--color-border)',
  borderRadius:    '6px',
  fontSize:        '13px',
  fontFamily:      'var(--font-body)',
  color:           'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  outline:         'none',
  boxSizing:       'border-box',
}

const labelStyle: React.CSSProperties = {
  display:       'block',
  fontFamily:    'var(--font-body)',
  fontSize:      '11px',
  fontWeight:    '600',
  color:         'var(--color-text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom:  '6px',
}

export function EmailPreviewForm({ orders }: EmailPreviewFormProps) {
  const [orderId,   setOrderId]   = useState(orders[0]?.id ?? '')
  const [testEmail, setTestEmail] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  async function handleSend() {
    if (!orderId || !testEmail) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/email-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId, testEmail }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ type: 'err', msg: (json as { error?: string }).error ?? 'Failed to send' })
      } else {
        const order = orders.find((o) => o.id === orderId)
        setResult({
          type: 'ok',
          msg:  `Sent order #${(json as { orderNumber?: string }).orderNumber ?? order?.order_number} to ${testEmail}`,
        })
      }
    } catch {
      setResult({ type: 'err', msg: 'Network error — try again' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border:          '1px solid var(--color-border)',
        borderRadius:    '10px',
        padding:         '24px',
        display:         'flex',
        flexDirection:   'column',
        gap:             '18px',
      }}
    >
      {/* Order picker */}
      <div>
        <label style={labelStyle}>Order</label>
        {orders.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            No orders found.
          </p>
        ) : (
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                #{o.order_number} — {o.customer_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Test email input */}
      <div>
        <label style={labelStyle}>Send test to</label>
        <input
          type="email"
          placeholder="your@email.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
      </div>

      {/* Send button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={handleSend}
          disabled={loading || !orderId || !testEmail}
          style={{
            padding:         '10px 20px',
            borderRadius:    '6px',
            border:          'none',
            backgroundColor: 'var(--color-green)',
            color:           '#fff',
            fontFamily:      'var(--font-body)',
            fontSize:        '13px',
            fontWeight:      '500',
            cursor:          (loading || !orderId || !testEmail) ? 'not-allowed' : 'pointer',
            opacity:         (loading || !orderId || !testEmail) ? 0.6 : 1,
          }}
        >
          {loading ? 'Sending…' : 'Send test email'}
        </button>

        {result && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize:   '13px',
              fontWeight: '500',
              color:      result.type === 'ok' ? '#16A34A' : '#DC2626',
              margin:     0,
            }}
          >
            {result.type === 'ok' ? '✓ ' : ''}{result.msg}
          </p>
        )}
      </div>
    </div>
  )
}
