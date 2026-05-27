/**
 * Shared utilities — used across the entire project.
 * No external deps beyond standard JS. No `any`.
 */

/** Format a number as Indian Rupees — e.g. 18999 → "₹18,999" */
export function formatPrice(amount: number): string {
  return `₹${(amount ?? 0).toLocaleString('en-IN')}`
}

/** Generate an order number — e.g. PSH-2026-0001 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `PSH-${year}-${rand}`
}

/** Slugify a string — e.g. "The Noor Saree" → "the-noor-saree" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Truncate text to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '…'
}

/** Join class names — handles undefined/null/false cleanly */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Parse Supabase JSONB safely */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value as T
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return fallback
}

/** Build WhatsApp URL with pre-filled message */
export function whatsappUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

/** Calculate discounted price */
export function calculateDiscount(
  total: number,
  couponType: 'percent' | 'flat' | 'free_shipping',
  couponValue: number
): number {
  if (couponType === 'percent') {
    return Math.min(total, (total * couponValue) / 100)
  }
  if (couponType === 'flat') {
    return Math.min(total, couponValue)
  }
  return 0
}

/** Estimate delivery date from now */
export function estimatedDelivery(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Check if a product is in stock */
export function isInStock(qty: number): boolean {
  return qty > 0
}

/** Check if a product is low stock (≤ 3) */
export function isLowStock(qty: number): boolean {
  return qty > 0 && qty <= 3
}


/**
 * Return true if a URL looks like an actual image (not an HTML page URL).
 * Checks for common image extensions and/or known storage hostnames.
 */
export function isImageUrl(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const { hostname, pathname } = new URL(url)
    // Known image storage hosts — always valid
    const imageHosts = ['supabase.co', 'cloudinary.com', 'res.cloudinary.com', 'imagekit.io']
    if (imageHosts.some((h) => hostname.endsWith(h))) return true
    // Check for image file extension in the pathname
    return /\.(webp|jpg|jpeg|png|gif|svg|avif|tiff?|bmp)(\?|$)/i.test(pathname)
  } catch {
    return false
  }
}

/**
 * Convert an image File to WebP using the Canvas API (browser-only).
 * SVG and GIF pass through unchanged. Falls back to original on failure.
 */
export async function convertToWebp(file: File, quality = 0.85): Promise<File> {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(file); return }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }))
          },
          'image/webp',
          quality,
        )
      } catch {
        resolve(file)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
