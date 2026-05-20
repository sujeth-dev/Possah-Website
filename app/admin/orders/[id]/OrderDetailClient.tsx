'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FulfillmentBadge } from '@/components/admin/FulfillmentBadge'

type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface OrderDetailClientProps {
  orderId:            string
  fulfillmentStatus:  FulfillmentStatus
  trackingNumber:     string | null
  courier:            string | null
  internalNotes:      string | null
}

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'processing',  label: 'Processing' },
  { value: 'shipped',     label: 'Shipped' },
  { value: 'delivered',   label: 'Delivered' },
  { value: 'cancelled',   label: 'Cancelled' },
]

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
  display:      'block',
  fontFamily:   'var(--font-body)',
  fontSize:     '11px',
  fontWeight:   '600',
  color:        'var(--color-text-muted)',
  letterSpacing:'0.06em',
  textTransform:'uppercase',
  marginBottom: '6px',
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border:          '1px solid var(--color-border)',
  borderRadius:    '10px',
  padding:         '20px',
}

const sectionHeadStyle: React.CSSProperties = {
  fontFamily:   'var(--font-body)',
  fontSize:     '13px',
  fontWeight:   '600',
  color:        'var(--color-text)',
  marginBottom: '16px',
  letterSpacing:'0.02em',
}

export function OrderDetailClient({
  orderId,
  fulfillmentStatus: initialFulfillment,
  trackingNumber:    initialTracking,
  courier:           initialCourier,
  internalNotes:     initialNotes,
}: OrderDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Fulfillment status
  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(initialFulfillment)
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null)
  const [fulfillmentSaved, setFulfillmentSaved] = useState(false)

  // Tracking
  const [tracking, setTracking] = useState(initialTracking ?? '')
  const [courier, setCourier]   = useState(initialCourier ?? '')
  const [trackingError, setTrackingError]   = useState<string | null>(null)
  const [trackingSaved, setTrackingSaved]   = useState(false)

  // Notes
  const [notes, setNotes]       = useState(initialNotes ?? '')
  const [notesError, setNotesError] = useState<string | null>(null)
  const [notesSaved, setNotesSaved] = useState(false)

  async function patch(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      return { ok: false, error: (json as { error?: string }).error ?? 'Unknown error' }
    }
    return { ok: true }
  }

  function saveFulfillment(value: FulfillmentStatus) {
    setFulfillment(value)
    setFulfillmentError(null)
    setFulfillmentSaved(false)

    startTransition(async () => {
      const result = await patch({ fulfillment_status: value })
      if (!result.ok) {
        setFulfillmentError(result.error ?? 'Failed to update')
        setFulfillment(initialFulfillment) // revert
      } else {
        setFulfillmentSaved(true)
        setTimeout(() => setFulfillmentSaved(false), 2000)
        router.refresh()
      }
    })
  }

  function saveTracking() {
    setTrackingError(null)
    setTrackingSaved(false)
    startTransition(async () => {
      const result = await patch({
        tracking_number: tracking.trim() || null,
        courier:         courier.trim()  || null,
      })
      if (!result.ok) {
        setTrackingError(result.error ?? 'Failed to save')
      } else {
        setTrackingSaved(true)
        setTimeout(() => setTrackingSaved(false), 2000)
        router.refresh()
      }
    })
  }

  function saveNotes() {
    setNotesError(null)
    setNotesSaved(false)
    startTransition(async () => {
      const result = await patch({ internal_notes: notes.trim() || null })
      if (!result.ok) {
        setNotesError(result.error ?? 'Failed to save')
      } else {
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
        router.refresh()
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Fulfilment Status */}
      <div style={sectionStyle}>
        <p style={sectionHeadStyle}>Fulfilment Status</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={fulfillment}
            onChange={(e) => saveFulfillment(e.target.value as FulfillmentStatus)}
            disabled={isPending}
            style={{
              ...inputStyle,
              width:    'auto',
              minWidth: '180px',
              cursor:   isPending ? 'wait' : 'pointer',
            }}
          >
            {FULFILLMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <FulfillmentBadge status={fulfillment} />

          {isPending && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>
              Saving…
            </span>
          )}
          {fulfillmentSaved && !isPending && (
            <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>
              ✓ Saved
            </span>
          )}
          {fulfillmentError && (
            <span style={{ fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>
              {fulfillmentError}
            </span>
          )}
        </div>
      </div>

      {/* Tracking */}
      <div style={sectionStyle}>
        <p style={sectionHeadStyle}>Shipping & Tracking</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Courier</label>
            <input
              type="text"
              placeholder="e.g. Delhivery, DTDC, BlueDart"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Tracking Number</label>
            <input
              type="text"
              placeholder="Enter tracking number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={saveTracking}
              disabled={isPending}
              style={{
                padding:         '8px 16px',
                borderRadius:    '6px',
                border:          'none',
                backgroundColor: 'var(--color-green)',
                color:           '#fff',
                fontFamily:      'var(--font-body)',
                fontSize:        '13px',
                fontWeight:      '500',
                cursor:          isPending ? 'wait' : 'pointer',
                opacity:         isPending ? 0.7 : 1,
              }}
            >
              Save Tracking
            </button>
            {trackingSaved && (
              <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>
                ✓ Saved
              </span>
            )}
            {trackingError && (
              <span style={{ fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>
                {trackingError}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Internal Notes */}
      <div style={sectionStyle}>
        <p style={sectionHeadStyle}>Internal Notes</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          Not visible to customer. Max 2000 characters.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Add internal notes, flags, or reminders…"
          style={{
            ...inputStyle,
            resize:    'vertical',
            minHeight: '90px',
            lineHeight:'1.5',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <button
            onClick={saveNotes}
            disabled={isPending}
            style={{
              padding:         '8px 16px',
              borderRadius:    '6px',
              border:          'none',
              backgroundColor: 'var(--color-green)',
              color:           '#fff',
              fontFamily:      'var(--font-body)',
              fontSize:        '13px',
              fontWeight:      '500',
              cursor:          isPending ? 'wait' : 'pointer',
              opacity:         isPending ? 0.7 : 1,
            }}
          >
            Save Notes
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {notes.length}/2000
          </span>
          {notesSaved && (
            <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>
              ✓ Saved
            </span>
          )}
          {notesError && (
            <span style={{ fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>
              {notesError}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
