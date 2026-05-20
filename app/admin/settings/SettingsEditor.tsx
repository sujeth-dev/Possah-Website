'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Settings {
  announcement_text:       string
  store_email:             string
  whatsapp_number:         string
  free_shipping_threshold: number
  express_delivery_fee:    number
  seo_title:               string
  seo_description:         string
  seo_og_image:            string | null
}

interface SettingsEditorProps {
  initial: Settings
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
  marginBottom:  '5px',
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)',
  border:          '1px solid var(--color-border)',
  borderRadius:    '10px',
  padding:         '20px',
  marginBottom:    '16px',
}

const sectionTitle: React.CSSProperties = {
  fontFamily:    'var(--font-body)',
  fontSize:      '13px',
  fontWeight:    '600',
  color:         'var(--color-text)',
  marginBottom:  '16px',
  letterSpacing: '0.02em',
}

function Field({ lbl, hint, children }: { lbl: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      {children}
      {hint && <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</p>}
    </div>
  )
}

function SaveRow({ isPending, saved, error }: { isPending: boolean; saved: boolean; error: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding:         '9px 20px',
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
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
      {saved && <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>✓ Saved</span>}
      {error && <span style={{ fontSize: '12px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>{error}</span>}
    </div>
  )
}

export function SettingsEditor({ initial }: SettingsEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [s, setS] = useState<Settings>(initial)

  // Per-section save state
  const [storeSaved, setStoreSaved]   = useState(false)
  const [storeError, setStoreError]   = useState<string | null>(null)
  const [seoSaved, setSeoSaved]       = useState(false)
  const [seoError, setSeoError]       = useState<string | null>(null)

  function set<K extends keyof Settings>(key: K, val: Settings[K]) {
    setS(prev => ({ ...prev, [key]: val }))
  }

  async function patch(body: Partial<Settings>): Promise<{ ok: boolean; error?: string }> {
    const res  = await fetch('/api/admin/settings', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: (json as { error?: string }).error ?? 'Unknown error' }
    return { ok: true }
  }

  function saveStore(e: React.FormEvent) {
    e.preventDefault()
    setStoreError(null); setStoreSaved(false)
    startTransition(async () => {
      const r = await patch({
        announcement_text:       s.announcement_text,
        store_email:             s.store_email,
        whatsapp_number:         s.whatsapp_number,
        free_shipping_threshold: s.free_shipping_threshold,
        express_delivery_fee:    s.express_delivery_fee,
      })
      if (!r.ok) { setStoreError(r.error ?? 'Failed'); return }
      setStoreSaved(true); setTimeout(() => setStoreSaved(false), 2500); router.refresh()
    })
  }

  function saveSeo(e: React.FormEvent) {
    e.preventDefault()
    setSeoError(null); setSeoSaved(false)
    startTransition(async () => {
      const r = await patch({
        seo_title:       s.seo_title,
        seo_description: s.seo_description,
        seo_og_image:    s.seo_og_image || null,
      })
      if (!r.ok) { setSeoError(r.error ?? 'Failed'); return }
      setSeoSaved(true); setTimeout(() => setSeoSaved(false), 2500); router.refresh()
    })
  }

  return (
    <div style={{ maxWidth: '640px' }}>

      {/* Store settings */}
      <form onSubmit={saveStore}>
        <div style={cardStyle}>
          <p style={sectionTitle}>Store Settings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field lbl="Announcement Bar Text" hint="Shown in the top bar across all pages. Use · to separate items.">
              <textarea
                value={s.announcement_text}
                onChange={e => set('announcement_text', e.target.value)}
                maxLength={300}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>

            <Field lbl="Store Email" hint="Used for order confirmation emails.">
              <input
                type="email"
                value={s.store_email}
                onChange={e => set('store_email', e.target.value)}
                placeholder="hello@thepossah.com"
                style={inputStyle}
              />
            </Field>

            <Field lbl="WhatsApp Number" hint="Used for all pre-filled WhatsApp links. Include country code, no + or spaces. e.g. 919876543210">
              <input
                type="tel"
                value={s.whatsapp_number}
                onChange={e => set('whatsapp_number', e.target.value.replace(/\D/g, ''))}
                placeholder="919876543210"
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              />
              {s.whatsapp_number && (
                <a
                  href={`https://wa.me/${s.whatsapp_number}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-gold)', textDecoration: 'none', marginTop: '3px', display: 'inline-block' }}
                >
                  Test link ↗
                </a>
              )}
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field lbl="Free Shipping Threshold (₹)" hint="Orders above this get free shipping.">
                <input
                  type="number"
                  min={0}
                  value={s.free_shipping_threshold}
                  onChange={e => set('free_shipping_threshold', Number(e.target.value))}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                />
              </Field>

              <Field lbl="Express Delivery Fee (₹)">
                <input
                  type="number"
                  min={0}
                  value={s.express_delivery_fee}
                  onChange={e => set('express_delivery_fee', Number(e.target.value))}
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
                />
              </Field>
            </div>
          </div>
          <SaveRow isPending={isPending} saved={storeSaved} error={storeError} />
        </div>
      </form>

      {/* SEO defaults */}
      <form onSubmit={saveSeo}>
        <div style={cardStyle}>
          <p style={sectionTitle}>SEO Defaults</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            Used as fallback when a page has no specific meta tags.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field lbl={`Meta Title (${s.seo_title.length}/70)`}>
              <input
                type="text"
                value={s.seo_title}
                onChange={e => set('seo_title', e.target.value)}
                maxLength={70}
                placeholder="The Possah — Luxury Indian Fashion"
                style={inputStyle}
              />
            </Field>

            <Field lbl={`Meta Description (${s.seo_description.length}/160)`}>
              <textarea
                value={s.seo_description}
                onChange={e => set('seo_description', e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Handcrafted Indian fashion for the modern woman."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </Field>

            <Field lbl="Default OG Image URL">
              <input
                type="url"
                value={s.seo_og_image ?? ''}
                onChange={e => set('seo_og_image', e.target.value || null)}
                placeholder="https://…"
                style={inputStyle}
              />
            </Field>
          </div>
          <SaveRow isPending={isPending} saved={seoSaved} error={seoError} />
        </div>
      </form>
    </div>
  )
}
