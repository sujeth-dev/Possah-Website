'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FulfillmentBadge } from '@/components/admin/FulfillmentBadge'

type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface HistoryRow {
  id:          string
  from_status: string | null
  to_status:   string
  changed_by:  string | null
  note:        string | null
  changed_at:  string
}

interface OrderDetailClientProps {
  orderId:           string
  customerEmail:     string
  fulfillmentStatus: FulfillmentStatus
  trackingNumber:    string | null
  courier:           string | null
  internalNotes:     string | null
  history:           HistoryRow[]
}

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: 'unfulfilled', label: 'Unfulfilled' },
  { value: 'processing',  label: 'Processing' },
  { value: 'shipped',     label: 'Shipped' },
  { value: 'delivered',   label: 'Delivered' },
  { value: 'cancelled',   label: 'Cancelled' },
]

const STATUS_LABELS: Record<string, string> = {
  unfulfilled:          'Unfulfilled',
  processing:           'Processing',
  shipped:              'Shipped',
  delivered:            'Delivered',
  cancelled:            'Cancelled',
  confirmation_resent:  'Confirmation email resent',
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

const sectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border:          '1px solid var(--color-border)',
  borderRadius:    '10px',
  padding:         '20px',
}

const sectionHeadStyle: React.CSSProperties = {
  fontFamily:    'var(--font-body)',
  fontSize:      '13px',
  fontWeight:    '600',
  color:         'var(--color-text)',
  marginBottom:  '16px',
  letterSpacing: '0.02em',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function OrderDetailClient({
  orderId,
  customerEmail,
  fulfillmentStatus: initialFulfillment,
  trackingNumber:    initialTracking,
  courier:           initialCourier,
  internalNotes:     initialNotes,
  history,
}: OrderDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Fulfillment status
  const [fulfillment, setFulfillment]         = useState<FulfillmentStatus>(initialFulfillment)
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null)
  const [fulfillmentSaved, setFulfillmentSaved] = useState(false)

  // Tracking
  const [tracking, setTracking]           = useState(initialTracking ?? '')
  const [courier, setCourier]             = useState(initialCourier ?? '')
  const [trackingError, setTrackingError] = useState<string | null>(null)
  const [trackingSaved, setTrackingSaved] = useState(false)

  // Notes
  const [notes, setNotes]           = useState(initialNotes ?? '')
  const [notesError, setNotesError] = useState<string | null>(null)
  const [notesSaved, setNotesSaved] = useState(false)

  // Resend confirmation
  const [resendLoading, setResendLoading] = useState(false)
  const [resendToast, setResendToast]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [resendCooldown, setResendCooldown] = useState(false)

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
        setFulfillment(initialFulfillment)
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

  async function handleResend() {
    if (resendLoading || resendCooldown) return
    setResendLoading(true)
    setResendToast(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-confirmation`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (res.status === 429) {
        setResendToast({ type: 'err', msg: 'Rate limited — wait 60 seconds before resending' })
      } else if (!res.ok) {
        setResendToast({ type: 'err', msg: (json as { error?: string }).error ?? 'Failed to send' })
      } else {
        setResendToast({ type: 'ok', msg: `Email sent to ${customerEmail}` })
        setResendCooldown(true)
        setTimeout(() => setResendCooldown(false), 10_000)
        router.refresh()
      }
    } catch {
      setResendToast({ type: 'err', msg: 'Network error — try again' })
    } finally {
      setResendLoading(false)
      setTimeout(() => setResendToast(null), 5000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Resend Confirmation */}
      <div style={sectionStyle}>
        <p style={sectionHeadStyle}>Email Actions</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown}
            style={{
              padding:         '8px 14px',
              borderRadius:    '6px',
              border:          '1px solid var(--color-border)',
              backgroundColor: resendCooldown ? 'var(--color-surface)' : 'var(--color-bg)',
              color:           'var(--color-text)',
              fontFamily:      'var(--font-body)',
              fontSize:        '13px',
              cursor:          (resendLoading || resendCooldown) ? 'not-allowed' : 'pointer',
              opacity:         (resendLoading || resendCooldown) ? 0.6 : 1,
            }}
          >
            {resendLoading ? 'Sending…' : 'Resend confirmation email'}
          </button>
          {resendToast && (
            <span
              style={{
                fontSize:   '12px',
                color:      resendToast.type === 'ok' ? '#16A34A' : '#DC2626',
                fontFamily: 'var(--font-body)',
                fontWeight: '500',
              }}
            >
              {resendToast.type === 'ok' ? '✓ ' : ''}{resendToast.msg}
            </span>
          )}
        </div>
      </div>

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
            lineHeight: '1.5',
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

      {/* Status History */}
      <div style={sectionStyle}>
        <p style={sectionHeadStyle}>Status History</p>
        {history.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            No history recorded yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {history.map((row, i) => (
              <div
                key={row.id}
                style={{
                  display:      'flex',
                  alignItems:   'flex-start',
                  gap:          '12px',
                  paddingTop:   i === 0 ? 0 : '12px',
                  paddingBottom: i === history.length - 1 ? 0 : '12px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width:           '8px',
                    height:          '8px',
                    borderRadius:    '50%',
                    backgroundColor: row.to_status === 'delivered'
                      ? '#16A34A'
                      : row.to_status === 'cancelled'
                      ? '#DC2626'
                      : row.to_status === 'confirmation_resent'
                      ? '#6366F1'
                      : 'var(--color-gold)',
                    marginTop: '4px',
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', margin: 0 }}>
                    {row.from_status
                      ? <>{STATUS_LABELS[row.from_status] ?? row.from_status} → <strong>{STATUS_LABELS[row.to_status] ?? row.to_status}</strong></>
                      : <strong>{STATUS_LABELS[row.to_status] ?? row.to_status}</strong>
                    }
                  </p>
                  {row.note && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0', fontStyle: 'italic' }}>
                      {row.note}
                    </p>
                  )}
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    {relativeTime(row.changed_at)}
                    {row.changed_by && (
                      <> · <span style={{ fontFamily: 'var(--font-mono)' }}>{row.changed_by}</span></>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
