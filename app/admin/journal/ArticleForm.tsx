'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

type ArticleCategory = 'Style' | 'Craft' | 'Culture' | 'Women' | 'Occasions' | 'Behind the Scenes' | 'Inspiration'

export interface ArticleFormData {
  title:          string
  slug:           string
  category:       ArticleCategory
  author:         string
  featured_image: string
  body:           string
  is_featured:    boolean
  published_at:   string  // ISO or ''
}

interface ArticleFormProps {
  mode:        'new' | 'edit'
  articleId?:  string
  initialData?: Partial<ArticleFormData>
}

const CATEGORIES: ArticleCategory[] = [
  'Style', 'Craft', 'Culture', 'Women', 'Occasions', 'Behind the Scenes', 'Inspiration'
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
  marginBottom:  '14px',
  letterSpacing: '0.02em',
}

function Field({ lbl, children }: { lbl: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      {children}
    </div>
  )
}

const DEFAULT_DATA: ArticleFormData = {
  title:          '',
  slug:           '',
  category:       'Style',
  author:         '',
  featured_image: '',
  body:           '',
  is_featured:    false,
  published_at:   '',
}

export function ArticleForm({ mode, articleId, initialData }: ArticleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [data, setData]   = useState<ArticleFormData>({ ...DEFAULT_DATA, ...initialData })
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const slugManuallyEdited = useRef(mode === 'edit')

  // Auto-slug title in new mode
  useEffect(() => {
    if (!slugManuallyEdited.current && mode === 'new') {
      setData(prev => ({ ...prev, slug: slugify(prev.title) }))
    }
  }, [data.title, mode])

  function set<K extends keyof ArticleFormData>(key: K, val: ArticleFormData[K]) {
    setData(prev => ({ ...prev, [key]: val }))
  }

  function buildBody(publish: boolean): Record<string, unknown> {
    return {
      title:          data.title.trim(),
      slug:           data.slug.trim(),
      category:       data.category,
      author:         data.author.trim(),
      featured_image: data.featured_image.trim() || null,
      body:           data.body.trim() || null,
      is_featured:    data.is_featured,
      published_at:   publish
        ? (data.published_at ? new Date(data.published_at).toISOString() : new Date().toISOString())
        : null,
    }
  }

  async function submit(publish: boolean) {
    setError(null); setSaved(false)

    if (!data.title.trim()) { setError('Title is required'); return }
    if (!data.slug.trim())  { setError('Slug is required');  return }
    if (!data.author.trim()){ setError('Author is required'); return }

    startTransition(async () => {
      const url    = mode === 'new' ? '/api/admin/journal' : `/api/admin/journal/${articleId}`
      const method = mode === 'new' ? 'POST' : 'PATCH'

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildBody(publish)),
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'Failed to save')
        return
      }

      setSaved(true)
      if (mode === 'new') {
        const newId = (json as { id?: string }).id
        router.push(newId ? `/admin/journal/${newId}/edit` : '/admin/journal')
      } else {
        router.refresh()
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  return (
    <div style={{ maxWidth: '820px' }}>

      {/* Basic Info */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Article Info</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field lbl="Title">
            <input
              required
              type="text"
              value={data.title}
              onChange={e => set('title', e.target.value)}
              placeholder="The Art of Handwoven Silk"
              style={inputStyle}
            />
          </Field>

          <Field lbl="Slug">
            <input
              required
              type="text"
              value={data.slug}
              onChange={e => { slugManuallyEdited.current = true; set('slug', e.target.value) }}
              placeholder="art-of-handwoven-silk"
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              /journal/{data.slug || '…'}
            </p>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field lbl="Category">
              <select value={data.category} onChange={e => set('category', e.target.value as ArticleCategory)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field lbl="Author">
              <input
                type="text"
                value={data.author}
                onChange={e => set('author', e.target.value)}
                placeholder="Priya Mehra"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field lbl="Featured Image URL">
            <input
              type="url"
              value={data.featured_image}
              onChange={e => set('featured_image', e.target.value)}
              placeholder="https://…"
              style={inputStyle}
            />
          </Field>
        </div>
      </div>

      {/* Body */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Article Body</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
          Supports Markdown: **bold**, *italic*, ## Heading, [link](url), ![alt](image-url)
        </p>
        <textarea
          value={data.body}
          onChange={e => set('body', e.target.value)}
          placeholder="Write your article here…"
          rows={20}
          style={{
            ...inputStyle,
            resize:     'vertical',
            lineHeight: '1.6',
            minHeight:  '320px',
            fontFamily: 'var(--font-mono)',
            fontSize:   '13px',
          }}
        />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', textAlign: 'right' }}>
          {data.body.length} chars
        </p>
      </div>

      {/* Settings */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Publishing</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field lbl="Publish Date (leave blank to publish immediately on Publish)">
            <input
              type="datetime-local"
              value={data.published_at ? data.published_at.slice(0, 16) : ''}
              onChange={e => set('published_at', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={data.is_featured}
              onChange={e => set('is_featured', e.target.checked)}
              style={{ accentColor: 'var(--color-gold)', width: '15px', height: '15px' }}
            />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>
              Featured article — appears as hero on /journal
            </span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding:         '12px 16px',
            backgroundColor: '#FEF2F2',
            border:          '1px solid #FCA5A5',
            borderRadius:    '8px',
            marginBottom:    '14px',
            fontFamily:      'var(--font-body)',
            fontSize:        '13px',
            color:           '#DC2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => submit(false)}
          disabled={isPending}
          style={{
            padding:         '9px 20px',
            borderRadius:    '6px',
            border:          '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color:           'var(--color-text)',
            fontFamily:      'var(--font-body)',
            fontSize:        '13px',
            fontWeight:      '500',
            cursor:          isPending ? 'wait' : 'pointer',
            opacity:         isPending ? 0.7 : 1,
          }}
        >
          Save as Draft
        </button>
        <button
          onClick={() => submit(true)}
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
          {isPending ? 'Saving…' : mode === 'new' ? 'Publish Article' : 'Publish Changes'}
        </button>

        {saved && (
          <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  )
}
