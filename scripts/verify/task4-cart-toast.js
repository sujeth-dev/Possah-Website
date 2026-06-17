/**
 * Task 4 Verification Script — Add-to-Cart "Go to Bag" Toast
 *
 * Static source analysis checks (no browser / dev server needed):
 *   1. cartToastStore exists and exports useCartToastStore
 *   2. AddedToBagToast component exists and is 'use client'
 *   3. Toast is mounted in shop layout
 *   4. ProductInfo imports and calls showToast after add-to-cart
 *   5. Toast has role="status" and aria-live="polite" for accessibility
 *   6. globals.css contains toast animation keyframes
 *   7. Auto-dismiss timer uses clearTimeout (handles rapid re-adds)
 *
 * Usage:
 *   node scripts/verify/task4-cart-toast.js
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())

let passed = 0
let failed = 0

function pass(msg) { console.log(`  ✓ PASS  ${msg}`); passed++ }
function fail(msg) { console.error(`  ✗ FAIL  ${msg}`); failed++ }

function readSrc(relPath) {
  const fullPath = resolve(ROOT, relPath)
  if (!existsSync(fullPath)) {
    fail(`File not found: ${relPath}`)
    return ''
  }
  return readFileSync(fullPath, 'utf-8')
}

console.log('\nTask 4 Verification — Add-to-Cart Toast\n')

// ── 1. cartToastStore ────────────────────────────────────────────────────────
console.log('cartToastStore (lib/store/cartToastStore.ts)...')
const store = readSrc('lib/store/cartToastStore.ts')
if (store) {
  if (store.includes('export const useCartToastStore')) {
    pass('useCartToastStore exported')
  } else {
    fail('useCartToastStore not exported from cartToastStore.ts')
  }
  if (store.includes("show: (item)") || store.includes('show: (item)')) {
    pass('show(item) action present in store')
  } else {
    fail('show(item) action missing from store')
  }
  if (store.includes('hide: ()') || store.includes("hide: ()")) {
    pass('hide() action present in store')
  } else {
    fail('hide() action missing from store')
  }
  if (!store.includes('persist')) {
    pass('Store has no persistence (ephemeral — correct)')
  } else {
    fail('Store should NOT persist — toast is ephemeral UI state')
  }
}

// ── 2. AddedToBagToast component ─────────────────────────────────────────────
console.log('\nAddedToBagToast (components/ui/AddedToBagToast.tsx)...')
const toast = readSrc('components/ui/AddedToBagToast.tsx')
if (toast) {
  if (toast.startsWith("'use client'")) {
    pass("Component has 'use client' directive")
  } else {
    fail("Component must have 'use client' at top")
  }
  if (toast.includes('role="status"')) {
    pass('Toast has role="status" (accessibility)')
  } else {
    fail('Toast missing role="status"')
  }
  if (toast.includes('aria-live="polite"')) {
    pass('Toast has aria-live="polite" (screen reader support)')
  } else {
    fail('Toast missing aria-live="polite"')
  }
  if (toast.includes('href="/cart"')) {
    pass('"Go to Bag" link points to /cart')
  } else {
    fail('"Go to Bag" link should point to /cart')
  }
  if (toast.includes('clearTimeout')) {
    pass('clearTimeout present — timer resets on rapid re-adds')
  } else {
    fail('clearTimeout missing — rapid re-adds would stack timers')
  }
  if (toast.includes('6000')) {
    pass('Auto-dismiss delay is 6000ms')
  } else {
    fail('Auto-dismiss delay not found or not 6000ms (was upgraded from 4000ms)')
  }
  if (toast.includes('toast-position')) {
    pass('Uses .toast-position CSS class for responsive positioning')
  } else {
    fail('Missing .toast-position CSS class')
  }
  if (toast.includes('formatPrice')) {
    pass('Price displayed using formatPrice util')
  } else {
    fail('Price should use formatPrice(item.price)')
  }
}

// ── 3. Shop layout mounts toast ──────────────────────────────────────────────
console.log('\nShop layout (app/(shop)/layout.tsx)...')
const layout = readSrc('app/(shop)/layout.tsx')
if (layout) {
  if (layout.includes('AddedToBagToast')) {
    pass('AddedToBagToast imported and used in shop layout')
  } else {
    fail('AddedToBagToast not found in shop layout')
  }
}

// ── 4. ProductInfo triggers toast ────────────────────────────────────────────
console.log('\nProductInfo (components/pdp/ProductInfo.tsx)...')
const productInfo = readSrc('components/pdp/ProductInfo.tsx')
if (productInfo) {
  if (productInfo.includes('useCartToastStore')) {
    pass('ProductInfo imports useCartToastStore')
  } else {
    fail('ProductInfo missing useCartToastStore import')
  }
  if (productInfo.includes('showToast(')) {
    pass('showToast() called after add-to-cart')
  } else {
    fail('showToast() not called in ProductInfo')
  }
  if (productInfo.includes("product.name") && productInfo.includes("primaryImage") && productInfo.includes("product.price")) {
    pass('showToast receives name, image, and price')
  } else {
    fail('showToast may be missing required ToastItem fields')
  }
}

// ── 5. globals.css has toast CSS ─────────────────────────────────────────────
console.log('\nglobals.css (styles/globals.css)...')
const css = readSrc('styles/globals.css')
if (css) {
  if (css.includes('@keyframes toastSlideUp')) {
    pass('toastSlideUp keyframe defined')
  } else {
    fail('@keyframes toastSlideUp missing from globals.css')
  }
  if (css.includes('.toast-position')) {
    pass('.toast-position class defined')
  } else {
    fail('.toast-position class missing from globals.css')
  }
  if (css.includes('toastSlideUpRight')) {
    pass('toastSlideUpRight keyframe defined for desktop slide-up-from-right animation')
  } else {
    fail('toastSlideUpRight keyframe missing from globals.css')
  }
  if (css.includes('bottom:    80px') || css.includes('bottom: 80px')) {
    pass('Desktop toast repositioned to bottom-right (bottom: 80px, right: 32px)')
  } else {
    fail('Desktop toast should use bottom: 80px (near Add to Bag button area)')
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log(`${'─'.repeat(50)}\n`)

if (failed > 0) process.exit(1)
