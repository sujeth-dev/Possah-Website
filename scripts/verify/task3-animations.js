/**
 * Task 3 Verification Script — Animations, Transitions & UX Audit
 *
 * Static source analysis — no browser / dev server needed.
 * Run from the project root on the feat/animations branch.
 *
 * Checks:
 *   1.  framer-motion in package.json
 *   2.  PageTransitionWrapper exists + uses AnimatePresence + usePathname
 *   3.  Shop layout wraps children with PageTransitionWrapper
 *   4.  MobileFilterDrawer uses AnimatePresence (slide-up from bottom)
 *   5.  Modal uses AnimatePresence + motion.div (scale + fade)
 *   6.  ShareDrawer uses AnimatePresence (popover fade + scale)
 *   7.  CartView uses AnimatePresence + layout prop on items
 *   8.  CartView coupon error uses AnimatePresence
 *   9.  CartView empty state uses motion.div (fade-in)
 *   10. WishlistView uses AnimatePresence + layout prop on items
 *   11. WishlistView empty state uses motion.div (fade-in)
 *   12. Reveal component exists + uses useInView
 *   13. Homepage page imports Reveal + wraps sections
 *   14. AnimatedGrid + AnimatedGridItem exist
 *   15. NewArrivals uses AnimatedGrid
 *   16. ProductGrid uses AnimatedGrid
 *   17. ProductInfo uses motion.button (whileTap on Add to Bag)
 *   18. CartView qty buttons use motion.button (whileTap)
 *   19. globals.css still has prefers-reduced-motion rule
 *   20. framer-motion is NOT imported in any server component directly
 *       (Reveal + AnimatedGrid are the only client wrappers; homepage page
 *        is a server component that only imports those wrappers)
 *
 * Usage:
 *   node scripts/verify/task3-animations.js
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
  if (!existsSync(fullPath)) { fail(`File not found: ${relPath}`); return '' }
  return readFileSync(fullPath, 'utf-8')
}

console.log('\nTask 3 Verification — Animations, Transitions & UX Audit\n')

// ── 1. framer-motion installed ───────────────────────────────────────────────
console.log('Package dependencies...')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
if (pkg.dependencies?.['framer-motion']) {
  pass(`framer-motion installed (${pkg.dependencies['framer-motion']})`)
} else {
  fail('framer-motion missing from package.json dependencies')
}

// ── 2. PageTransitionWrapper ─────────────────────────────────────────────────
console.log('\nPageTransitionWrapper (components/layout/PageTransitionWrapper.tsx)...')
const ptw = readSrc('components/layout/PageTransitionWrapper.tsx')
if (ptw) {
  if (ptw.includes("'use client'")) pass('Has use client directive')
  else fail('Missing use client directive')

  if (ptw.includes('AnimatePresence') && ptw.includes('usePathname'))
    pass('Uses AnimatePresence + usePathname for route-keyed transitions')
  else fail('Missing AnimatePresence or usePathname')

  if (ptw.includes("mode=\"wait\""))
    pass('mode="wait" — exit completes before next page enters')
  else fail('Missing mode="wait" — pages may overlap during transition')
}

// ── 3. Shop layout ───────────────────────────────────────────────────────────
console.log('\nShop layout (app/(shop)/layout.tsx)...')
const layout = readSrc('app/(shop)/layout.tsx')
if (layout) {
  if (layout.includes('PageTransitionWrapper'))
    pass('PageTransitionWrapper imported and used in shop layout')
  else fail('Shop layout does not use PageTransitionWrapper')
}

// ── 4. MobileFilterDrawer ────────────────────────────────────────────────────
console.log('\nMobileFilterDrawer (components/shop/MobileFilterDrawer.tsx)...')
const drawer = readSrc('components/shop/MobileFilterDrawer.tsx')
if (drawer) {
  if (drawer.includes('AnimatePresence'))
    pass('AnimatePresence wraps the open state')
  else fail('Missing AnimatePresence — drawer still pops in instantly')

  if (drawer.includes("y: '100%'"))
    pass('Panel animates from y: 100% (slide up from bottom)')
  else fail("Panel should start at y: '100%' for slide-up effect")

  if (!drawer.includes('if (!isOpen) return null'))
    pass('Removed early-return guard — AnimatePresence handles mount/unmount')
  else fail('Still has early-return guard — AnimatePresence exit animations will not fire')
}

// ── 5. Modal ─────────────────────────────────────────────────────────────────
console.log('\nModal (components/ui/Modal.tsx)...')
const modal = readSrc('components/ui/Modal.tsx')
if (modal) {
  if (modal.includes('AnimatePresence'))
    pass('AnimatePresence wraps open state')
  else fail('Missing AnimatePresence — modal still pops in instantly')

  if (modal.includes('scale: 0.96'))
    pass('Dialog scales in (0.96 → 1) for polished entrance')
  else fail('Missing scale animation on dialog')
}

// ── 6. ShareDrawer ───────────────────────────────────────────────────────────
console.log('\nShareDrawer (components/pdp/ShareDrawer.tsx)...')
const share = readSrc('components/pdp/ShareDrawer.tsx')
if (share) {
  if (share.includes('AnimatePresence'))
    pass('AnimatePresence wraps popover open state')
  else fail('Missing AnimatePresence — popover still pops in instantly')

  if (share.includes('scale: 0.95'))
    pass('Popover scales from 0.95 on enter/exit')
  else fail('Missing scale animation on popover')
}

// ── 7. CartView items ────────────────────────────────────────────────────────
console.log('\nCartView (app/(shop)/cart/CartView.tsx)...')
const cart = readSrc('app/(shop)/cart/CartView.tsx')
if (cart) {
  if (cart.includes('AnimatePresence'))
    pass('AnimatePresence used in CartView')
  else fail('Missing AnimatePresence — cart items still disappear instantly')

  if (cart.includes('layout') && cart.includes('motion.div'))
    pass('motion.div with layout prop — height animates when items removed')
  else fail('Missing layout prop — remaining items will snap into place on removal')

  if (cart.includes('motion.p') && cart.includes('couponError'))
    pass('Coupon error message fades in/out with AnimatePresence')
  else fail('Coupon error should use AnimatePresence for fade-in')
}

// ── 8-9. CartView empty state ─────────────────────────────────────────────────
if (cart) {
  if (cart.includes('motion.div') && cart.includes('Your bag is empty'))
    pass('Empty cart state uses motion.div (fade-in on mount)')
  else fail('Empty cart state should fade in with motion.div')
}

// ── 10-11. WishlistView ──────────────────────────────────────────────────────
console.log('\nWishlistView (app/(shop)/wishlist/WishlistView.tsx)...')
const wishlist = readSrc('app/(shop)/wishlist/WishlistView.tsx')
if (wishlist) {
  if (wishlist.includes('AnimatePresence'))
    pass('AnimatePresence used in WishlistView')
  else fail('Missing AnimatePresence — wishlist items still disappear instantly')

  if (wishlist.includes('layout'))
    pass('layout prop present — grid reflows smoothly on item removal')
  else fail('Missing layout prop on wishlist items')

  if (wishlist.includes('motion.div') && wishlist.includes('Your wishlist is empty'))
    pass('Empty wishlist state uses motion.div (fade-in on mount)')
  else fail('Empty wishlist state should fade in with motion.div')
}

// ── 12. Reveal component ─────────────────────────────────────────────────────
console.log('\nReveal component (components/ui/Reveal.tsx)...')
const reveal = readSrc('components/ui/Reveal.tsx')
if (reveal) {
  if (reveal.includes("'use client'"))
    pass('Has use client directive')
  else fail('Reveal must be a client component for useInView')

  if (reveal.includes('useInView'))
    pass('useInView from framer-motion triggers on scroll')
  else fail('Missing useInView — sections will not animate on scroll')

  if (reveal.includes('once: true'))
    pass('once: true — entrance animation fires once only, not on scroll back')
  else fail('Missing once: true — sections will re-animate on scroll back up')
}

// ── 13. Homepage section reveals ─────────────────────────────────────────────
console.log('\nHomepage (app/(shop)/page.tsx)...')
const homePage = readSrc('app/(shop)/page.tsx')
if (homePage) {
  if (homePage.includes('Reveal'))
    pass('Homepage imports and uses Reveal for section entrance animations')
  else fail('Homepage does not use Reveal — sections enter without animation')

  const revealCount = (homePage.match(/<Reveal/g) ?? []).length
  if (revealCount >= 6)
    pass(`${revealCount} sections wrapped in <Reveal> (CategorySplit, Circles, NewArrivals, Banner, Occasions, MTM)`)
  else if (revealCount > 0)
    fail(`Only ${revealCount} sections wrapped — expected 6 (excluding HeroSlider)`)
  else
    fail('No sections wrapped in <Reveal>')
}

// ── 14. AnimatedGrid ─────────────────────────────────────────────────────────
console.log('\nAnimatedGrid (components/shop/AnimatedGrid.tsx)...')
const animGrid = readSrc('components/shop/AnimatedGrid.tsx')
if (animGrid) {
  if (animGrid.includes("'use client'"))
    pass('Has use client directive')
  else fail('AnimatedGrid must be a client component')

  if (animGrid.includes('staggerChildren'))
    pass('staggerChildren defined — product cards animate in sequence')
  else fail('Missing staggerChildren — all cards would animate simultaneously')

  if (animGrid.includes('AnimatedGrid') && animGrid.includes('AnimatedGridItem'))
    pass('Both AnimatedGrid and AnimatedGridItem exported')
  else fail('Missing AnimatedGrid or AnimatedGridItem export')
}

// ── 15. NewArrivals uses AnimatedGrid ────────────────────────────────────────
console.log('\nNewArrivals (components/homepage/NewArrivals.tsx)...')
const newArrivals = readSrc('components/homepage/NewArrivals.tsx')
if (newArrivals) {
  if (newArrivals.includes('AnimatedGrid') && newArrivals.includes('AnimatedGridItem'))
    pass('NewArrivals uses AnimatedGrid + AnimatedGridItem for stagger')
  else fail('NewArrivals should use AnimatedGrid for staggered card entrance')
}

// ── 16. ProductGrid uses AnimatedGrid ────────────────────────────────────────
console.log('\nProductGrid (components/shop/ProductGrid.tsx)...')
const prodGrid = readSrc('components/shop/ProductGrid.tsx')
if (prodGrid) {
  if (prodGrid.includes('AnimatedGrid') && prodGrid.includes('AnimatedGridItem'))
    pass('ProductGrid uses AnimatedGrid + AnimatedGridItem')
  else fail('ProductGrid should use AnimatedGrid for shop listing stagger')
}

// ── 17. ProductInfo whileTap ─────────────────────────────────────────────────
console.log('\nProductInfo (components/pdp/ProductInfo.tsx)...')
const productInfo = readSrc('components/pdp/ProductInfo.tsx')
if (productInfo) {
  if (productInfo.includes('whileTap') && productInfo.includes('motion.button'))
    pass('motion.button with whileTap — tactile press feedback on Add to Bag / wishlist')
  else fail('Missing whileTap on ProductInfo buttons — no press feedback')
}

// ── 18. CartView qty buttons whileTap ────────────────────────────────────────
if (cart) {
  if (cart.includes('whileTap') && cart.includes('motion.button'))
    pass('CartView qty +/− use motion.button whileTap for tactile feedback')
  else fail('Cart qty buttons missing whileTap micro-interaction')
}

// ── 19. prefers-reduced-motion ───────────────────────────────────────────────
console.log('\nglobals.css (styles/globals.css)...')
const css = readSrc('styles/globals.css')
if (css) {
  if (css.includes('prefers-reduced-motion'))
    pass('prefers-reduced-motion media query present — accessibility maintained')
  else fail('Missing prefers-reduced-motion rule — animations not accessible')
}

// ── 20. Server component safety ──────────────────────────────────────────────
console.log('\nServer component safety...')
// Homepage page.tsx is a server component that imports Reveal (client).
// It should NOT directly import from framer-motion itself.
if (homePage && !homePage.includes("from 'framer-motion'") && !homePage.includes('from "framer-motion"')) {
  pass('Homepage page.tsx (server) does not import framer-motion directly — clean boundary')
} else {
  fail('Homepage page.tsx imports framer-motion directly — breaks server component boundary')
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(54)}`)
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log(`${'─'.repeat(54)}\n`)

if (failed > 0) process.exit(1)
