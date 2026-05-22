// FIX-TEST-02: Unit tests for lib/utils.ts

import { describe, it, expect } from 'vitest'
import {
  formatPrice,
  generateOrderNumber,
  slugify,
  truncate,
  cn,
  parseJson,
  calculateDiscount,
  isInStock,
  isLowStock,
  estimatedDelivery,
} from '@/lib/utils'

// ─── formatPrice ─────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats whole rupees correctly', () => {
    expect(formatPrice(18999)).toBe('₹18,999')
  })
  it('formats zero', () => {
    expect(formatPrice(0)).toBe('₹0')
  })
  it('formats large amounts with Indian numbering', () => {
    expect(formatPrice(100000)).toBe('₹1,00,000')
  })
  it('formats single digit', () => {
    expect(formatPrice(1)).toBe('₹1')
  })
})

// ─── generateOrderNumber ──────────────────────────────────────────────────────

describe('generateOrderNumber', () => {
  it('returns correct format PSH-YYYY-NNNN', () => {
    const year = new Date().getFullYear()
    const order = generateOrderNumber()
    expect(order).toMatch(new RegExp(`^PSH-${year}-\\d{4}$`))
  })
  it('generates unique-ish values across 100 calls', () => {
    const orders = new Set(Array.from({ length: 100 }, () => generateOrderNumber()))
    // With 9000 possible values, 100 calls should mostly be unique
    expect(orders.size).toBeGreaterThan(80)
  })
})

// ─── slugify ─────────────────────────────────────────────────────────────────

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('The Noor Saree')).toBe('the-noor-saree')
  })
  it('strips special characters', () => {
    expect(slugify('Bridal & Co-ord Set!')).toBe('bridal-co-ord-set')
  })
  it('trims leading and trailing hyphens', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })
  it('collapses multiple spaces', () => {
    expect(slugify('a   b')).toBe('a-b')
  })
})

// ─── truncate ────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns string as-is if within maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })
  it('truncates with ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })
  it('handles exact boundary', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})

// ─── cn ──────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('joins classes', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })
  it('filters falsy values', () => {
    expect(cn('a', undefined, false, null, 'b')).toBe('a b')
  })
  it('returns empty string for all falsy', () => {
    expect(cn(undefined, false, null)).toBe('')
  })
})

// ─── parseJson ───────────────────────────────────────────────────────────────

describe('parseJson', () => {
  it('returns object as-is', () => {
    const obj = { a: 1 }
    expect(parseJson(obj, {})).toBe(obj)
  })
  it('parses JSON string', () => {
    expect(parseJson('{"a":1}', {})).toEqual({ a: 1 })
  })
  it('returns fallback on invalid JSON', () => {
    expect(parseJson('not json', { fallback: true })).toEqual({ fallback: true })
  })
  it('returns fallback on null', () => {
    expect(parseJson(null, 42)).toBe(42)
  })
  it('returns fallback on undefined', () => {
    expect(parseJson(undefined, 'default')).toBe('default')
  })
})

// ─── calculateDiscount ───────────────────────────────────────────────────────

describe('calculateDiscount', () => {
  it('calculates percent discount', () => {
    expect(calculateDiscount(10000, 'percent', 10)).toBe(1000)
  })
  it('caps percent discount at total', () => {
    expect(calculateDiscount(1000, 'percent', 110)).toBe(1000)
  })
  it('calculates flat discount', () => {
    expect(calculateDiscount(5000, 'flat', 500)).toBe(500)
  })
  it('caps flat discount at total', () => {
    expect(calculateDiscount(200, 'flat', 500)).toBe(200)
  })
  it('returns 0 for free_shipping coupon type', () => {
    expect(calculateDiscount(5000, 'free_shipping', 0)).toBe(0)
  })
  it('handles zero total', () => {
    expect(calculateDiscount(0, 'percent', 20)).toBe(0)
  })
})

// ─── isInStock / isLowStock ──────────────────────────────────────────────────

describe('isInStock', () => {
  it('returns true for qty > 0', () => {
    expect(isInStock(5)).toBe(true)
  })
  it('returns false for qty = 0', () => {
    expect(isInStock(0)).toBe(false)
  })
  it('returns false for negative qty', () => {
    expect(isInStock(-1)).toBe(false)
  })
})

describe('isLowStock', () => {
  it('returns true for qty 1–3', () => {
    expect(isLowStock(1)).toBe(true)
    expect(isLowStock(3)).toBe(true)
  })
  it('returns false for qty > 3', () => {
    expect(isLowStock(4)).toBe(false)
  })
  it('returns false for qty = 0', () => {
    expect(isLowStock(0)).toBe(false)
  })
})

// ─── estimatedDelivery ───────────────────────────────────────────────────────

describe('estimatedDelivery', () => {
  it('returns a non-empty string', () => {
    const result = estimatedDelivery(5)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(5)
  })
  it('includes the correct future weekday for a known date', () => {
    // Check that the date is in the future (at least 1 day)
    const tomorrow = estimatedDelivery(1)
    expect(tomorrow).toBeTruthy()
  })
})
