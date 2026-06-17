/**
 * Task 2 Verification Script — Mobile UI Fixes
 *
 * Tests (static DOM analysis — no browser required):
 *   1. SortBar: mobile layout uses two-row structure
 *   2. OrderProgressBar FullBar: connecting bar uses position:absolute not negative margin
 *   3. OrderProgressBar labels: non-active labels have hidden sm:block class
 *
 * Usage:
 *   node scripts/verify/task2-mobile-ui.js
 *
 * This script reads source files directly — no dev server needed.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())

let passed = 0
let failed = 0

function pass(msg) { console.log(`  ✓ PASS  ${msg}`); passed++ }
function fail(msg) { console.error(`  ✗ FAIL  ${msg}`); failed++ }

function readSrc(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf-8')
}

console.log('\nTask 2 Verification — Mobile UI Fixes\n')

// ── SortBar ─────────────────────────────────────────────────────────────────
console.log('SortBar (components/shop/SortBar.tsx)...')
const sortBar = readSrc('components/shop/SortBar.tsx')

if (sortBar.includes('md:hidden') && sortBar.includes('hidden md:flex')) {
  pass('SortBar has separate mobile (md:hidden) and desktop (hidden md:flex) layouts')
} else {
  fail('SortBar missing separate mobile/desktop layout blocks')
}

if (sortBar.includes('mb-1.5') || sortBar.includes('mb-2')) {
  pass('SortBar mobile row 1 has bottom margin separating it from row 2')
} else {
  fail('SortBar mobile layout missing spacing between rows')
}

// Piece count text uses mono font — either inline or via a spread of a mono-style const
// The monoLabel const defined at module level holds fontFamily: var(--font-mono).
// Piece count paragraph spreads ...monoLabel, so the string appears before 'md:hidden'.
const mobileSection = sortBar.split('md:hidden')[1]?.split('hidden md:flex')[0] ?? ''
const monoViaSpread  = sortBar.includes("fontFamily:    'var(--font-mono)'") && mobileSection.includes('...monoLabel')
const monoInline     = mobileSection.includes('var(--font-mono)')
if (monoViaSpread || monoInline) {
  pass('Piece count text uses var(--font-mono) in mobile section (via spread or inline)')
} else {
  fail('Piece count in mobile section should use var(--font-mono)')
}

// Filters button should NOT be inside the desktop layout
const desktopSection = sortBar.split('hidden md:flex')[1] ?? ''
if (!desktopSection.includes('md:hidden') && !desktopSection.includes('Filters')) {
  pass('Filters button absent from desktop layout section')
} else {
  fail('Filters button should not appear in desktop layout section')
}

// ── OrderProgressBar ─────────────────────────────────────────────────────────
console.log('\nOrderProgressBar (components/account/OrderProgressBar.tsx)...')
const progressBar = readSrc('components/account/OrderProgressBar.tsx')

if (!progressBar.includes("margin: '-22px")) {
  pass('Old negative-margin hack removed from FullBar')
} else {
  fail('Old margin: -22px still present — should be replaced with position:absolute')
}

if (progressBar.includes("position:        'absolute'") || progressBar.includes("position: 'absolute'")) {
  pass('Connecting bar uses position: absolute')
} else {
  fail('Connecting bar should use position: absolute')
}

if (progressBar.includes('CIRCLE_SIZE / 2') || progressBar.includes('top:             CIRCLE_SIZE / 2') || progressBar.includes('top: CIRCLE_SIZE / 2')) {
  pass('Bar top offset calculated from CIRCLE_SIZE constant (not magic number)')
} else {
  // Check for the numeric equivalent
  if (progressBar.includes('top:             14') || progressBar.includes('top: 14')) {
    pass('Bar top offset is 14px (= 28px circle ÷ 2) — centres bar on circles')
  } else {
    fail('Bar vertical position not clearly derived from circle size')
  }
}

if (progressBar.includes("'hidden sm:block'")) {
  pass('Non-active step labels hidden below sm: breakpoint (prevents overflow on 280px screens)')
} else {
  fail("Non-active labels should use className={active ? '' : 'hidden sm:block'}")
}

if (progressBar.includes("overflow:      'hidden'") || progressBar.includes("overflow: 'hidden'")) {
  pass('Label overflow: hidden prevents text bleed')
} else {
  fail("Label span should have overflow: 'hidden'")
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log(`${'─'.repeat(50)}\n`)

if (failed > 0) process.exit(1)
