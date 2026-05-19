/**
 * Shared utilities — used across the entire project.
 * No external deps beyond standard JS. No `any`.
 */

/** Format a number as Indian Rupees — e.g. 18999 → "₹18,999" */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
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
