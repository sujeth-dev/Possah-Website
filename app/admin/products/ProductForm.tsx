'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  slug: string
}

interface Variant {
  id?: string
  colour_name: string
  colour_hex: string
  size: string
  stock_qty: number
}

interface ProductImage {
  id?: string
  url: string
  alt: string
  position: number
}

type OccasionTag =
  | 'Everyday' | 'Brunch' | 'Workwear' | 'Evening'
  | 'Sangeet' | 'Mehendi' | 'Haldi' | 'Wedding'

const ALL_OCCASIONS: OccasionTag[] = [
  'Everyday', 'Brunch', 'Workwear', 'Evening',
  'Sangeet', 'Mehendi', 'Haldi', 'Wedding',
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Made-to-Measure']

const SUB_LINES = ['THE DRAPE', 'THE EDIT', 'THE ATELIER', 'THE VAULT'] as const

export interface ProductFormData {
  id?: string
  name: string
  slug: string
  description: string
  sub_line: string
  category_id: string
  price: number
  compare_price: number | null
  fabric: string
  craft_description: string
  care_instructions: string
  drape_guide: string
  craft_story_title: string
  craft_story_body: string
  craft_story_image: string
  audio_url: string
  meta_title: string
  meta_description: string
  is_new_arrival: boolean
  is_top_selling: boolean
  is_featured: boolean
  is_active: boolean
  tags: OccasionTag[]
  variants: Variant[]
  images: ProductImage[]
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  categories: Category[]
  mode: 'new' | 'edit'
}

// ─── Form component ───────────────────────────────────────────────────────────

export function ProductForm({ initialData, categories, mode }: ProductFormProps) {
  const router = useRouter()

  // Form state
  const [form, setForm] = useState<ProductFormData>({
    name:              initialData?.name              ?? '',
    slug:              initialData?.slug              ?? '',
    description:       initialData?.description       ?? '',
    sub_line:          initialData?.sub_line          ?? '',
    category_id:       initialData?.category_id       ?? '',
    price:             initialData?.price             ?? 0,
    compare_price:     initialData?.compare_price     ?? null,
    fabric:            initialData?.fabric            ?? '',
    craft_description: initialData?.craft_description ?? '',
    care_instructions: initialData?.care_instructions ?? '',
    drape_guide:       initialData?.drape_guide       ?? '',
    craft_story_title: initialData?.craft_story_title ?? '',
    craft_story_body:  initialData?.craft_story_body  ?? '',
    craft_story_image: initialData?.craft_story_image ?? '',
    audio_url:         initialData?.audio_url         ?? '',
    meta_title:        initialData?.meta_title        ?? '',
    meta_description:  initialData?.meta_description  ?? '',
    is_new_arrival:    initialData?.is_new_arrival    ?? false,
    is_top_selling:    initialData?.is_top_selling    ?? false,
    is_featured:       initialData?.is_featured       ?? false,
    is_active:         initialData?.is_active         ?? true,
    tags:              (initialData?.tags as OccasionTag[]) ?? [],
    variants:          initialData?.variants          ?? [{ colour_name: '', colour_hex: '#C99A99', size: 'S', stock_qty: 0 }],
    images:            initialData?.images            ?? [],
  })

  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(mode === 'edit')

  // Auto-slug from name
  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      ...(!slugManual ? { slug: slugify(value) } : {}),
    }))
  }, [slugManual])

  const set = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }, [])

  // ── Variant management ──────────────────────────────────────────────────────

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, { colour_name: '', colour_hex: '#C99A99', size: 'S', stock_qty: 0 }],
    }))
  }

  function removeVariant(idx: number) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }))
  }

  function updateVariant(idx: number, field: keyof Variant, value: string | number) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === idx ? { ...v, [field]: value } : v),
    }))
  }

  // ── Image management ────────────────────────────────────────────────────────

  function addImage() {
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url: '', alt: '', position: prev.images.length },
      ],
    }))
  }

  function removeImage(idx: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images
        .filter((_, i) => i !== idx)
        .map((img, i) => ({ ...img, position: i })),
    }))
  }

  function updateImage(idx: number, field: keyof ProductImage, value: string | number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => i === idx ? { ...img, [field]: value } : img),
    }))
  }

  // ── Tag toggle ──────────────────────────────────────────────────────────────

  function toggleTag(tag: OccasionTag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  // ── Client-side validation ──────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim())  errs.name  = 'Name is required'
    if (!form.slug.trim())  errs.slug  = 'Slug is required'
    if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = 'Slug: lowercase letters, numbers, hyphens only'
    if (form.price <= 0)    errs.price = 'Price must be greater than 0'
    if (form.variants.length === 0) errs.variants = 'At least one variant required'
    for (const v of form.variants) {
      if (!v.colour_name.trim()) { errs.variants = 'All variants must have a colour name'; break }
      if (!v.size.trim())        { errs.variants = 'All variants must have a size'; break }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent, publish: boolean) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSaveError(null)

    const payload = {
      ...form,
      is_active: publish ? true : form.is_active,
      compare_price: form.compare_price && form.compare_price > 0 ? form.compare_price : null,
      audio_url: (form.is_new_arrival || form.is_top_selling) && form.audio_url ? form.audio_url : null,
    }

    try {
      const url    = mode === 'edit' && initialData?.id
        ? `/api/admin/products/${initialData.id}`
        : '/api/admin/products'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.issues) {
          const serverErrors: Record<string, string> = {}
          for (const [field, msgs] of Object.entries(data.issues)) {
            serverErrors[field] = (msgs as string[])[0] ?? 'Invalid value'
          }
          setErrors(serverErrors)
        } else {
          setSaveError(data.error ?? 'Save failed. Please try again.')
        }
        return
      }

      // Success — navigate to product list
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      console.error('[ProductForm] submit:', err)
      setSaveError('Network error. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const showAudio = form.is_new_arrival || form.is_top_selling

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} noValidate>
      <div className="max-w-[900px] mx-auto p-6 md:p-8 flex flex-col gap-8">

        {/* ── Save error banner ── */}
        {saveError && (
          <div
            role="alert"
            className="flex items-center gap-3 p-4 rounded"
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-error)" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v3M8 10v.5" />
            </svg>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-error)' }}>
              {saveError}
            </p>
          </div>
        )}

        {/* ── BASIC INFO ── */}
        <FormSection title="Basic Info">
          <div className="grid md:grid-cols-2 gap-5">
            <FormField label="Product Name" error={errors.name} required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. The Noor Saree"
                style={inputStyle}
                required
              />
            </FormField>
            <FormField label="Slug" error={errors.slug} required hint="URL-safe identifier">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true)
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
                }}
                placeholder="the-noor-saree"
                style={inputStyle}
                required
              />
            </FormField>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <FormField label="Sub-line">
              <select value={form.sub_line} onChange={(e) => set('sub_line', e.target.value)} style={inputStyle}>
                <option value="">— Select sub-line —</option>
                {SUB_LINES.map((sl) => <option key={sl} value={sl}>{sl}</option>)}
              </select>
            </FormField>
            <FormField label="Category">
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} style={inputStyle}>
                <option value="">— Select category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Description" className="mt-5">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="Short product description shown on the product page…"
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
            />
          </FormField>
        </FormSection>

        {/* ── PRICING ── */}
        <FormSection title="Pricing">
          <div className="grid md:grid-cols-2 gap-5">
            <FormField label="Price (₹)" error={errors.price} required>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price || ''}
                  onChange={(e) => set('price', parseFloat(e.target.value) || 0)}
                  placeholder="18999"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  required
                />
              </div>
            </FormField>
            <FormField label="Compare-at Price (₹)" hint="Shows as strikethrough if set">
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.compare_price ?? ''}
                  onChange={(e) => set('compare_price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="24999"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                />
              </div>
            </FormField>
          </div>
        </FormSection>

        {/* ── BADGES / TOGGLES ── */}
        <FormSection title="Badges & Visibility">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Toggle
              label="New Arrival"
              hint="Shows NEW badge. Enables audio section."
              checked={form.is_new_arrival}
              onChange={(v) => set('is_new_arrival', v)}
            />
            <Toggle
              label="Top Selling"
              hint="Enables audio section."
              checked={form.is_top_selling}
              onChange={(v) => set('is_top_selling', v)}
            />
            <Toggle
              label="Featured"
              hint="Shown in curated sections."
              checked={form.is_featured}
              onChange={(v) => set('is_featured', v)}
            />
            <Toggle
              label="Active / Visible"
              hint="Hidden from shop when off."
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
            />
          </div>
        </FormSection>

        {/* ── PRODUCT TAGS ── */}
        <FormSection title="Works For (Occasion Tags)">
          <div className="flex flex-wrap gap-2">
            {ALL_OCCASIONS.map((tag) => {
              const selected = form.tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 transition-all duration-150"
                  style={{
                    borderRadius: 'var(--radius-btn)',
                    border: `1px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                    backgroundColor: selected ? 'var(--color-green)' : 'transparent',
                    color: selected ? 'var(--color-bg)' : 'var(--color-text)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </FormSection>

        {/* ── VARIANTS ── */}
        <FormSection title="Colour & Size Variants" error={errors.variants}>
          <div className="flex flex-col gap-3">
            {form.variants.map((v, idx) => (
              <VariantRow
                key={idx}
                variant={v}
                index={idx}
                allSizes={ALL_SIZES}
                onChange={updateVariant}
                onRemove={() => removeVariant(idx)}
                canRemove={form.variants.length > 1}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="mt-3 flex items-center gap-2 hover:opacity-80 transition-opacity"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--color-green)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Add Colour / Size
          </button>
        </FormSection>

        {/* ── IMAGES ── */}
        <FormSection title="Product Images" hint="Add image URLs. First image is the primary.">
          <div className="flex flex-col gap-3">
            {form.images.map((img, idx) => (
              <ImageRow
                key={idx}
                image={img}
                index={idx}
                onChange={updateImage}
                onRemove={() => removeImage(idx)}
              />
            ))}
            {form.images.length === 0 && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                No images added yet. Add at least 4 images (front, back, detail, lifestyle).
              </p>
            )}
          </div>
          {form.images.length < 8 && (
            <button
              type="button"
              onClick={addImage}
              className="mt-3 flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--color-green)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 1v10M1 6h10" />
              </svg>
              Add Image URL
            </button>
          )}
        </FormSection>

        {/* ── AUDIO (conditional) ── */}
        {showAudio && (
          <FormSection title="The Possah Note (Audio)" hint="MP3 URL. Plays on PDP for New Arrivals and Top Selling.">
            <FormField label="Audio File URL">
              <input
                type="url"
                value={form.audio_url}
                onChange={(e) => set('audio_url', e.target.value)}
                placeholder="https://cdn.thepossah.com/audio/noor-saree.mp3"
                style={inputStyle}
              />
            </FormField>
          </FormSection>
        )}

        {/* ── PRODUCT DETAILS ── */}
        <FormSection title="Product Details">
          <div className="grid md:grid-cols-2 gap-5">
            <FormField label="Fabric">
              <input
                type="text"
                value={form.fabric}
                onChange={(e) => set('fabric', e.target.value)}
                placeholder="e.g. Dusty Rose Chikankari Silk"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Craft Description">
              <input
                type="text"
                value={form.craft_description}
                onChange={(e) => set('craft_description', e.target.value)}
                placeholder="e.g. Hand-embroidered in Lucknow"
                style={inputStyle}
              />
            </FormField>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <FormField label="Care Instructions">
              <input
                type="text"
                value={form.care_instructions}
                onChange={(e) => set('care_instructions', e.target.value)}
                placeholder="e.g. Dry clean only. Store in dust bag."
                style={inputStyle}
              />
            </FormField>
            <FormField label="Drape Guide">
              <input
                type="text"
                value={form.drape_guide}
                onChange={(e) => set('drape_guide', e.target.value)}
                placeholder="e.g. Nivi style drape recommended."
                style={inputStyle}
              />
            </FormField>
          </div>
        </FormSection>

        {/* ── CRAFT STORY ── */}
        <FormSection title="The Craft Behind">
          <FormField label="Story Title">
            <input
              type="text"
              value={form.craft_story_title}
              onChange={(e) => set('craft_story_title', e.target.value)}
              placeholder="e.g. The Craft Behind The Noor Saree"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Story Body" className="mt-5">
            <textarea
              value={form.craft_story_body}
              onChange={(e) => set('craft_story_body', e.target.value)}
              rows={5}
              placeholder="Over 72 hours of hand-embroidery by skilled artisans in Lucknow…"
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
            />
          </FormField>
          <FormField label="Story Image URL" className="mt-5">
            <input
              type="url"
              value={form.craft_story_image}
              onChange={(e) => set('craft_story_image', e.target.value)}
              placeholder="https://cdn.thepossah.com/images/craft/noor-artisan.jpg"
              style={inputStyle}
            />
          </FormField>
        </FormSection>

        {/* ── SEO ── */}
        <FormSection title="SEO">
          <FormField label="Meta Title" hint="Max 70 characters">
            <input
              type="text"
              value={form.meta_title}
              onChange={(e) => set('meta_title', e.target.value)}
              placeholder={`${form.name || 'Product Name'} — The Possah`}
              maxLength={70}
              style={inputStyle}
            />
            <CharCount current={form.meta_title.length} max={70} />
          </FormField>
          <FormField label="Meta Description" hint="Max 160 characters" className="mt-5">
            <textarea
              value={form.meta_description}
              onChange={(e) => set('meta_description', e.target.value)}
              rows={2}
              maxLength={160}
              placeholder="Shop the Noor Saree — handcrafted chikankari silk from The Possah atelier."
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
            />
            <CharCount current={form.meta_description.length} max={160} />
          </FormField>
        </FormSection>

        {/* ── ACTION BUTTONS ── */}
        <div
          className="flex items-center justify-between pt-6"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              background: 'none',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              padding: 0,
              opacity: saving ? 0.5 : 1,
            }}
          >
            ← Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 hover:opacity-90 transition-opacity"
              style={{
                border: '1px solid var(--color-green)',
                borderRadius: 'var(--radius-btn)',
                backgroundColor: 'transparent',
                color: 'var(--color-green)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.06em',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={(e) => handleSubmit(e, true)}
              className="px-6 py-3 hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-bg)',
                border: 'none',
                borderRadius: 'var(--radius-btn)',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.06em',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  backgroundColor: 'var(--color-white)',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  color: 'var(--color-text)',
  outline: 'none',
  boxSizing: 'border-box',
}

interface FormSectionProps {
  title: string
  hint?: string
  error?: string
  children: React.ReactNode
}

function FormSection({ title, hint, error, children }: FormSectionProps) {
  return (
    <section>
      <div className="mb-4">
        <h2
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--color-text)',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h2>
        {hint && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {hint}
          </p>
        )}
        {error && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-error)', marginTop: 4 }}>
            {error}
          </p>
        )}
      </div>
      <div
        className="p-5 rounded"
        style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

interface FormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

function FormField({ label, hint, error, required, children, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="flex flex-col gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: error ? 'var(--color-error)' : 'var(--color-text-muted)',
          }}
        >
          {label}{required && ' *'}
        </span>
        {children}
      </label>
      {hint && !error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {hint}
        </p>
      )}
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-error)', marginTop: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface ToggleProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <label className="flex flex-col gap-2 cursor-pointer">
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '9px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            backgroundColor: checked ? 'var(--color-green)' : 'var(--color-border)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
            transition: 'background-color 0.2s',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: checked ? 18 : 3,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          />
        </button>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: checked ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
        >
          {checked ? 'On' : 'Off'}
        </span>
      </div>
      {hint && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          {hint}
        </p>
      )}
    </label>
  )
}

interface VariantRowProps {
  variant: Variant
  index: number
  allSizes: string[]
  onChange: (idx: number, field: keyof Variant, value: string | number) => void
  onRemove: () => void
  canRemove: boolean
}

function VariantRow({ variant, index, allSizes, onChange, onRemove, canRemove }: VariantRowProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 p-3 rounded"
      style={{ backgroundColor: 'rgba(244,236,223,0.5)', border: '1px solid var(--color-border)' }}
    >
      {/* Colour swatch */}
      <input
        type="color"
        value={variant.colour_hex}
        onChange={(e) => onChange(index, 'colour_hex', e.target.value)}
        title="Pick colour"
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-input)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          padding: 2,
          backgroundColor: 'var(--color-white)',
          flexShrink: 0,
        }}
      />

      {/* Colour name */}
      <input
        type="text"
        value={variant.colour_name}
        onChange={(e) => onChange(index, 'colour_name', e.target.value)}
        placeholder="Colour name"
        style={{ ...inputStyle, width: 140, flexShrink: 0 }}
      />

      {/* Size */}
      <select
        value={variant.size}
        onChange={(e) => onChange(index, 'size', e.target.value)}
        style={{ ...inputStyle, width: 140, flexShrink: 0 }}
      >
        {allSizes.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Stock qty */}
      <input
        type="number"
        min={0}
        step={1}
        value={variant.stock_qty}
        onChange={(e) => onChange(index, 'stock_qty', parseInt(e.target.value) || 0)}
        placeholder="Qty"
        title="Stock quantity"
        style={{ ...inputStyle, width: 80, flexShrink: 0 }}
      />

      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove variant"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: 4,
          }}
          className="hover:opacity-60 transition-opacity ml-auto"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
            <path d="M3 8h10" />
          </svg>
        </button>
      )}
    </div>
  )
}

interface ImageRowProps {
  image: ProductImage
  index: number
  onChange: (idx: number, field: keyof ProductImage, value: string | number) => void
  onRemove: () => void
}

function ImageRow({ image, index, onChange, onRemove }: ImageRowProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded"
      style={{ backgroundColor: 'rgba(244,236,223,0.5)', border: '1px solid var(--color-border)' }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          flexShrink: 0,
          width: 20,
          textAlign: 'center',
        }}
      >
        {index + 1}
      </span>
      <input
        type="url"
        value={image.url}
        onChange={(e) => onChange(index, 'url', e.target.value)}
        placeholder="https://cdn.thepossah.com/images/…"
        style={{ ...inputStyle, flex: 1 }}
      />
      <input
        type="text"
        value={image.alt}
        onChange={(e) => onChange(index, 'alt', e.target.value)}
        placeholder="Alt text"
        style={{ ...inputStyle, width: 160, flexShrink: 0 }}
      />
      <button
        type="button"
        onClick={onRemove}
        title="Remove image"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-error)',
          padding: 4,
          flexShrink: 0,
        }}
        className="hover:opacity-60 transition-opacity"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4h10M6 4V2h4v2M5 4l1 10h4l1-10" />
        </svg>
      </button>
    </div>
  )
}

function CharCount({ current, max }: { current: number; max: number }) {
  const over = current > max
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '9px',
        color: over ? 'var(--color-error)' : 'var(--color-text-muted)',
        marginTop: 4,
        textAlign: 'right',
      }}
    >
      {current}/{max}
    </p>
  )
}
