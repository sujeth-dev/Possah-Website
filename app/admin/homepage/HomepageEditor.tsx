'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploadField } from '@/components/admin/ImageUploadField'

interface HeroSlide {
  image_url:    string
  headline:     string
  sub_headline: string
  cta_label:    string
  cta_link:     string
}

interface CollectionBanner {
  image_url: string
  headline:  string
  subtitle:  string
  cta_link:  string
}

interface OccasionTile {
  image_url: string
  label:     string
  link:      string
}

interface CategorySplit {
  ethnic_image?:  string | null
  western_image?: string | null
}

interface CategoryCircles {
  sarees?:     string | null
  lehengas?:   string | null
  co_ords?:    string | null
  dresses?:    string | null
  kurta_sets?: string | null
  tops?:       string | null
}

interface MtmCta {
  image_url?: string | null
}

interface HomepageConfig {
  hero_slides:       HeroSlide[]
  collection_banner: CollectionBanner | null
  new_arrival_ids:   string[]
  occasion_tiles:    OccasionTile[]
  category_split?:   CategorySplit
  category_circles?: CategoryCircles
  mtm_cta?:          MtmCta
}

interface Product {
  id:   string
  name: string
  slug: string
}

interface HomepageEditorProps {
  initial:  HomepageConfig
  products: Product[]
}

/* ── Shared styles ────────────────────────────────────────────────── */
const card: React.CSSProperties = {
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
const label: React.CSSProperties = {
  display:       'block',
  fontFamily:    'var(--font-body)',
  fontSize:      '11px',
  fontWeight:    '600',
  color:         'var(--color-text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom:  '5px',
}
const input: React.CSSProperties = {
  width:           '100%',
  padding:         '8px 11px',
  border:          '1px solid var(--color-border)',
  borderRadius:    '6px',
  fontSize:        '13px',
  fontFamily:      'var(--font-body)',
  color:           'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  outline:         'none',
  boxSizing:       'border-box',
}
const saveBtn: React.CSSProperties = {
  padding:         '9px 20px',
  borderRadius:    '6px',
  border:          'none',
  backgroundColor: 'var(--color-green)',
  color:           '#fff',
  fontFamily:      'var(--font-body)',
  fontSize:        '13px',
  fontWeight:      '500',
  cursor:          'pointer',
}
const addBtn: React.CSSProperties = {
  padding:         '7px 14px',
  borderRadius:    '6px',
  border:          '1px dashed var(--color-border)',
  backgroundColor: 'transparent',
  fontFamily:      'var(--font-body)',
  fontSize:        '12px',
  color:           'var(--color-text-muted)',
  cursor:          'pointer',
  width:           '100%',
  marginTop:       '10px',
}
const removeBtn: React.CSSProperties = {
  padding:         '4px 10px',
  borderRadius:    '4px',
  border:          '1px solid #FCA5A5',
  backgroundColor: '#FEF2F2',
  color:           '#DC2626',
  fontFamily:      'var(--font-body)',
  fontSize:        '11px',
  cursor:          'pointer',
}

function Field({ label: lbl, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
    </div>
  )
}

function SaveRow({ isPending, saved, error }: { isPending: boolean; saved: boolean; error: string | null }) {
  return (
    <div style={{ marginTop: '16px' }}>
      {error && (
        <div style={{
          background:   'rgba(192,57,43,0.08)',
          border:       '1px solid rgba(192,57,43,0.4)',
          color:        '#9B3A3A',
          borderRadius: '6px',
          padding:      '10px 14px',
          fontFamily:   'var(--font-body)',
          fontSize:     '13px',
          lineHeight:   1.5,
          marginBottom: 10,
        }}>
          Save failed: {error}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button type="submit" disabled={isPending} style={{ ...saveBtn, opacity: isPending ? 0.7 : 1, cursor: isPending ? 'wait' : 'pointer' }}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && <span style={{ fontSize: '12px', color: '#16A34A', fontFamily: 'var(--font-body)', fontWeight: '500' }}>✓ Saved</span>}
      </div>
    </div>
  )
}

const EMPTY_SLIDE: HeroSlide = { image_url: '', headline: '', sub_headline: '', cta_label: 'Shop Now', cta_link: '/women' }
const EMPTY_BANNER: CollectionBanner = { image_url: '', headline: '', subtitle: '', cta_link: '/women' }

export function HomepageEditor({ initial, products }: HomepageEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Hero slides
  const [slides, setSlides]         = useState<HeroSlide[]>(initial.hero_slides ?? [])
  const [slidesSaved, setSlidesSaved] = useState(false)
  const [slidesError, setSlidesError] = useState<string | null>(null)

  // Collection banner
  const [banner, setBanner]         = useState<CollectionBanner>(initial.collection_banner ?? EMPTY_BANNER)
  const [bannerSaved, setBannerSaved] = useState(false)
  const [bannerError, setBannerError] = useState<string | null>(null)

  // New arrivals
  const [selectedIds, setSelectedIds] = useState<string[]>((initial.new_arrival_ids as string[]) ?? [])
  const [naSaved, setNaSaved]         = useState(false)
  const [naError, setNaError]         = useState<string | null>(null)

  // Occasion tiles
  const [tiles, setTiles]           = useState<OccasionTile[]>(
    initial.occasion_tiles?.length === 8
      ? initial.occasion_tiles
      : Array.from({ length: 8 }, (_, i) => (initial.occasion_tiles?.[i] ?? { image_url: '', label: `Occasion ${i + 1}`, link: '/women' }))
  )
  const [tilesSaved, setTilesSaved] = useState(false)
  const [tilesError, setTilesError] = useState<string | null>(null)

  // Category Split (Ethnic / Western)
  const [categorySplit, setCategorySplit]   = useState<CategorySplit>(initial.category_split ?? {})
  const [splitSaved, setSplitSaved]         = useState(false)
  const [splitError, setSplitError]         = useState<string | null>(null)

  // Category Circles (6 categories)
  const [categoryCircles, setCategoryCircles] = useState<CategoryCircles>(initial.category_circles ?? {})
  const [circlesSaved, setCirclesSaved]       = useState(false)
  const [circlesError, setCirclesError]       = useState<string | null>(null)

  // Made-to-Measure CTA
  const [mtmCta, setMtmCta]         = useState<MtmCta>(initial.mtm_cta ?? {})
  const [mtmSaved, setMtmSaved]     = useState(false)
  const [mtmError, setMtmError]     = useState<string | null>(null)

  async function patch(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch('/api/admin/homepage', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: (json as { error?: string }).error ?? 'Unknown error' }
    return { ok: true }
  }

  function saveSlides(e: React.FormEvent) {
    e.preventDefault()
    setSlidesError(null); setSlidesSaved(false)
    const valid = slides.filter(s => s.image_url && s.headline && s.cta_label && s.cta_link)
    startTransition(async () => {
      const r = await patch({ hero_slides: valid })
      if (!r.ok) { setSlidesError(r.error ?? 'Failed'); return }
      setSlidesSaved(true); setTimeout(() => setSlidesSaved(false), 2500); router.refresh()
    })
  }

  function saveBanner(e: React.FormEvent) {
    e.preventDefault()
    setBannerError(null); setBannerSaved(false)
    startTransition(async () => {
      const r = await patch({ collection_banner: banner })
      if (!r.ok) { setBannerError(r.error ?? 'Failed'); return }
      setBannerSaved(true); setTimeout(() => setBannerSaved(false), 2500); router.refresh()
    })
  }

  function saveNewArrivals(e: React.FormEvent) {
    e.preventDefault()
    setNaError(null); setNaSaved(false)
    startTransition(async () => {
      const r = await patch({ new_arrival_ids: selectedIds })
      if (!r.ok) { setNaError(r.error ?? 'Failed'); return }
      setNaSaved(true); setTimeout(() => setNaSaved(false), 2500); router.refresh()
    })
  }

  function saveTiles(e: React.FormEvent) {
    e.preventDefault()
    setTilesError(null); setTilesSaved(false)
    startTransition(async () => {
      const r = await patch({ occasion_tiles: tiles })
      if (!r.ok) { setTilesError(r.error ?? 'Failed'); return }
      setTilesSaved(true); setTimeout(() => setTilesSaved(false), 2500); router.refresh()
    })
  }

  function saveCategorySplit(e: React.FormEvent) {
    e.preventDefault()
    setSplitError(null); setSplitSaved(false)
    startTransition(async () => {
      const r = await patch({ category_split: categorySplit })
      if (!r.ok) { setSplitError(r.error ?? 'Failed'); return }
      setSplitSaved(true); setTimeout(() => setSplitSaved(false), 2500); router.refresh()
    })
  }

  function saveCategoryCircles(e: React.FormEvent) {
    e.preventDefault()
    setCirclesError(null); setCirclesSaved(false)
    startTransition(async () => {
      const r = await patch({ category_circles: categoryCircles })
      if (!r.ok) { setCirclesError(r.error ?? 'Failed'); return }
      setCirclesSaved(true); setTimeout(() => setCirclesSaved(false), 2500); router.refresh()
    })
  }

  function saveMtmCta(e: React.FormEvent) {
    e.preventDefault()
    setMtmError(null); setMtmSaved(false)
    startTransition(async () => {
      const r = await patch({ mtm_cta: mtmCta })
      if (!r.ok) { setMtmError(r.error ?? 'Failed'); return }
      setMtmSaved(true); setTimeout(() => setMtmSaved(false), 2500); router.refresh()
    })
  }

  function updateSlide(i: number, field: keyof HeroSlide, val: string) {
    setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  function moveSlide(i: number, dir: -1 | 1) {
    setSlides(prev => {
      const next = [...prev]
      const target = i + dir
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]]
      return next
    })
  }

  function toggleProduct(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function updateTile(i: number, field: keyof OccasionTile, val: string) {
    setTiles(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  return (
    <div>

      {/* ── HERO SLIDES ──────────────────────────────────────────── */}
      <form onSubmit={saveSlides}>
        <div style={card}>
          <p style={sectionTitle}>Hero Slides</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Full-width homepage hero. Autoplays. Drag to reorder using the ↑↓ buttons.
          </p>

          {slides.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              No slides yet. Add one below.
            </p>
          )}

          {slides.map((slide, i) => (
            <div
              key={i}
              style={{
                border:       '1px solid var(--color-border)',
                borderRadius: '8px',
                padding:      '14px',
                marginBottom: '10px',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Slide {i + 1}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => moveSlide(i, -1)} disabled={i === 0}
                    style={{ ...removeBtn, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', opacity: i === 0 ? 0.4 : 1 }}>↑</button>
                  <button type="button" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}
                    style={{ ...removeBtn, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', opacity: i === slides.length - 1 ? 0.4 : 1 }}>↓</button>
                  <button type="button" onClick={() => setSlides(prev => prev.filter((_, idx) => idx !== i))} style={removeBtn}>
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <ImageUploadField label="Image" value={slide.image_url} onChange={v => updateSlide(i, 'image_url', v)} pathPrefix="uploads/homepage/hero" />
                <Field label="Headline"       value={slide.headline}     onChange={v => updateSlide(i, 'headline', v)}     placeholder="New Collection" />
                <Field label="Sub-headline"   value={slide.sub_headline} onChange={v => updateSlide(i, 'sub_headline', v)} placeholder="Optional sub-text" />
                <Field label="CTA Label"      value={slide.cta_label}    onChange={v => updateSlide(i, 'cta_label', v)}    placeholder="Shop Now" />
                <Field label="CTA Link"       value={slide.cta_link}     onChange={v => updateSlide(i, 'cta_link', v)}     placeholder="/women/sarees" />
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setSlides(prev => [...prev, { ...EMPTY_SLIDE }])} style={addBtn}>
            + Add Slide
          </button>

          <SaveRow isPending={isPending} saved={slidesSaved} error={slidesError} />
        </div>
      </form>

      {/* ── COLLECTION BANNER ──────────────────────────────────── */}
      <form onSubmit={saveBanner}>
        <div style={card}>
          <p style={sectionTitle}>Collection Banner</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <ImageUploadField label="Image" value={banner.image_url} onChange={v => setBanner(b => ({ ...b, image_url: v }))} pathPrefix="uploads/homepage/banner" />
            <Field label="Headline"  value={banner.headline}  onChange={v => setBanner(b => ({ ...b, headline: v }))}  placeholder="The New Edit" />
            <Field label="Subtitle"  value={banner.subtitle}  onChange={v => setBanner(b => ({ ...b, subtitle: v }))}  placeholder="Optional" />
            <Field label="CTA Link"  value={banner.cta_link}  onChange={v => setBanner(b => ({ ...b, cta_link: v }))}  placeholder="/shop" />
          </div>
          <SaveRow isPending={isPending} saved={bannerSaved} error={bannerError} />
        </div>
      </form>

      {/* ── NEW ARRIVALS ────────────────────────────────────────── */}
      <form onSubmit={saveNewArrivals}>
        <div style={card}>
          <p style={sectionTitle}>New Arrivals Grid</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            Select products that appear in the homepage New Arrivals section. Shown in selection order.
          </p>

          {products.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              No active products found.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
              {products.map((p) => {
                const checked = selectedIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          '10px',
                      padding:      '8px 12px',
                      border:       `1px solid ${checked ? 'var(--color-gold)' : 'var(--color-border)'}`,
                      borderRadius: '6px',
                      cursor:       'pointer',
                      backgroundColor: checked ? '#FFFBEB' : 'var(--color-bg)',
                      transition:   'all 0.12s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      style={{ accentColor: 'var(--color-gold)', width: '15px', height: '15px' }}
                    />
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', flex: 1 }}>
                      {p.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      {p.slug}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          {selectedIds.length > 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
            </p>
          )}

          <SaveRow isPending={isPending} saved={naSaved} error={naError} />
        </div>
      </form>

      {/* ── OCCASION TILES ──────────────────────────────────────── */}
      <form onSubmit={saveTiles}>
        <div style={card}>
          <p style={sectionTitle}>Occasion Tiles (8 fixed)</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            8 occasion tiles on the homepage. All 8 must be filled.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {tiles.map((tile, i) => (
              <div
                key={i}
                style={{
                  border:       '1px solid var(--color-border)',
                  borderRadius: '8px',
                  padding:      '12px',
                  backgroundColor: 'var(--color-bg)',
                }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  TILE {i + 1}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <ImageUploadField label="Image" value={tile.image_url ?? ''} onChange={v => updateTile(i, 'image_url', v)} pathPrefix="uploads/homepage/occasions" />
                  <Field label="Label"     value={tile.label}           onChange={v => updateTile(i, 'label', v)}     placeholder="Wedding" />
                  <Field label="Link"      value={tile.link}            onChange={v => updateTile(i, 'link', v)}      placeholder="/shop?occasion=wedding" />
                </div>
              </div>
            ))}
          </div>

          <SaveRow isPending={isPending} saved={tilesSaved} error={tilesError} />
        </div>
      </form>

      {/* ── CATEGORY SPLIT (ETHNIC / WESTERN) ───────────────────── */}
      <form onSubmit={saveCategorySplit}>
        <div style={card}>
          <p style={sectionTitle}>Category Split — Ethnic &amp; Western</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            Full-width split banner below the hero. Two tall images side-by-side linking to Ethnic and Western shops.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--color-bg)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>ETHNIC PANEL</p>
              <ImageUploadField
                label="Image"
                value={categorySplit.ethnic_image ?? ''}
                onChange={v => setCategorySplit(s => ({ ...s, ethnic_image: v }))}
                pathPrefix="uploads/homepage/category-split"
              />
            </div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--color-bg)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>WESTERN PANEL</p>
              <ImageUploadField
                label="Image"
                value={categorySplit.western_image ?? ''}
                onChange={v => setCategorySplit(s => ({ ...s, western_image: v }))}
                pathPrefix="uploads/homepage/category-split"
              />
            </div>
          </div>
          <SaveRow isPending={isPending} saved={splitSaved} error={splitError} />
        </div>
      </form>

      {/* ── CATEGORY CIRCLES ────────────────────────────────────────── */}
      <form onSubmit={saveCategoryCircles}>
        <div style={card}>
          <p style={sectionTitle}>Category Circles (6 fixed)</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            Six circular category thumbnails. Labels and links are fixed — only images are configurable.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {(
              [
                { key: 'sarees',     label: 'SAREES',     href: '/women/sarees'     },
                { key: 'lehengas',   label: 'LEHENGAS',   href: '/women/lehengas'   },
                { key: 'co_ords',    label: 'CO-ORDS',    href: '/women/co-ords'    },
                { key: 'dresses',    label: 'DRESSES',    href: '/women/dresses'    },
                { key: 'kurta_sets', label: 'KURTA SETS', href: '/women/kurta-sets' },
                { key: 'tops',       label: 'TOPS',       href: '/women/tops'       },
              ] as const
            ).map(({ key, label, href }) => (
              <div
                key={key}
                style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', backgroundColor: 'var(--color-bg)' }}
              >
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>{href}</p>
                <ImageUploadField
                  label="Image"
                  value={categoryCircles[key] ?? ''}
                  onChange={v => setCategoryCircles(c => ({ ...c, [key]: v }))}
                  pathPrefix="uploads/homepage/circles"
                />
              </div>
            ))}
          </div>
          <SaveRow isPending={isPending} saved={circlesSaved} error={circlesError} />
        </div>
      </form>

      {/* ── MADE-TO-MEASURE CTA ─────────────────────────────────────── */}
      <form onSubmit={saveMtmCta}>
        <div style={card}>
          <p style={sectionTitle}>Made-to-Measure CTA</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
            Right-side image for the Made-to-Measure section near the bottom of the homepage.
          </p>
          <div style={{ maxWidth: '320px' }}>
            <ImageUploadField
              label="Image"
              value={mtmCta.image_url ?? ''}
              onChange={v => setMtmCta({ image_url: v })}
              pathPrefix="uploads/homepage/mtm"
            />
          </div>
          <SaveRow isPending={isPending} saved={mtmSaved} error={mtmError} />
        </div>
      </form>
    </div>
  )
}
