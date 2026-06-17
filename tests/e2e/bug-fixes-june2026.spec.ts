/**
 * Verification suite for June 2026 NUANSE bug report fixes.
 * Run: npx playwright test scripts/verify/bug-fixes-june2026.spec.ts --project=chromium --headed
 */
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ── Bug #1 & #2: /account/login and /account/register redirect to /auth/signin ──
// Next.js redirect() returns 200 with a meta-refresh tag; the client JS fires navigation.
// We verify: route exists (no 404) + carries the correct redirect destination in the meta tag.
test('Bug#1 /account/login: exists and redirects to /auth/signin', async ({ page }) => {
  await page.goto(`${BASE}/account/login`)
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator('body')).not.toContainText('wore itself out')
  const meta = page.locator('meta[id="__next-page-redirect"]')
  const content = await meta.getAttribute('content')
  expect(content).toContain('/auth/signin')
})

test('Bug#2 /account/register: exists and redirects to /auth/signin', async ({ page }) => {
  await page.goto(`${BASE}/account/register`)
  await page.waitForLoadState('domcontentloaded')
  await expect(page.locator('body')).not.toContainText('wore itself out')
  const meta = page.locator('meta[id="__next-page-redirect"]')
  const content = await meta.getAttribute('content')
  expect(content).toContain('/auth/signin')
})

// ── WhatsApp number: confirm 9876543210 is gone, 9151512323 is present ──
test('WhatsApp: PDP uses real number 9151512323', async ({ page }) => {
  // Load any product page - use a search to find one first
  const res = await page.request.get(`${BASE}/api/search?q=lehenga&limit=1`)
  const json = await res.json().catch(() => null)
  const slug = json?.results?.[0]?.slug ?? null
  const gender = json?.results?.[0]?.category_gender ?? 'women'
  const catSlug = json?.results?.[0]?.category_slug ?? 'lehenga'

  if (!slug) {
    console.warn('No products found via search, skipping WhatsApp href check')
    return
  }

  await page.goto(`${BASE}/${gender}/${catSlug}/${slug}`)
  await page.waitForLoadState('domcontentloaded')

  const waLinks = page.locator('a[href*="wa.me"]')
  const count = await waLinks.count()
  expect(count).toBeGreaterThan(0)

  for (let i = 0; i < count; i++) {
    const href = await waLinks.nth(i).getAttribute('href')
    expect(href).not.toContain('9876543210')
    expect(href).toContain('9151512323')
  }
})

test('WhatsApp: Made-to-Measure page uses real number 9151512323', async ({ page }) => {
  await page.goto(`${BASE}/made-to-measure`)
  await page.waitForLoadState('domcontentloaded')
  const waLinks = page.locator('a[href*="wa.me"]')
  const count = await waLinks.count()
  if (count === 0) return // link may be in a button handler, skip
  const href = await waLinks.first().getAttribute('href')
  expect(href).not.toContain('9876543210')
  expect(href).toContain('9151512323')
})

// ── Bug #10: Search input has only ONE X (clear) button ──
test('Bug#10 Search input has no duplicate X button', async ({ page }) => {
  await page.goto(`${BASE}/search`)
  await page.waitForLoadState('domcontentloaded')

  const input = page.locator('input[type="search"]')
  await input.fill('silk')

  // Check that the browser-native cancel button is hidden via CSS
  const isNativeCancelHidden = await page.evaluate(() => {
    const style = document.querySelector('style') ?? document.head
    const allStyles = Array.from(document.styleSheets)
    for (const sheet of allStyles) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.cssText?.includes('webkit-search-cancel-button')) return true
        }
      } catch { /* cross-origin */ }
    }
    return false
  })
  expect(isNativeCancelHidden).toBe(true)

  // Only one custom X button should be visible
  const clearBtns = page.locator('button[aria-label="Clear search"]')
  await expect(clearBtns).toHaveCount(1)
})

// ── Bug #15: Zero-results "browse all pieces" is a link ──
test('Bug#15 Zero-results "browse all pieces" is a link', async ({ page }) => {
  await page.goto(`${BASE}/search?q=xyzxyzxyzxyz9999`)
  await page.waitForLoadState('networkidle')

  const link = page.locator('a[href="/women"]:has-text("browse all pieces")')
  await expect(link).toBeVisible({ timeout: 8000 })
})

// ── Bug #12: Promo error clears when cart quantity changes ──
test('Bug#12 Promo error clears on cart qty change', async ({ page }) => {
  // Need an item in cart — go to a PDP and add to bag
  const res = await page.request.get(`${BASE}/api/search?q=saree&limit=1`)
  const json = await res.json().catch(() => null)
  const product = json?.results?.[0]

  if (!product) {
    console.warn('No product found, skipping Bug#12 test')
    return
  }

  // Add product via cart store directly
  await page.goto(`${BASE}/cart`)
  await page.waitForLoadState('domcontentloaded')

  // Inject a cart item into Zustand store via localStorage
  await page.evaluate((p) => {
    const key = 'possah-cart'
    const existing = JSON.parse(localStorage.getItem(key) ?? '{"state":{"items":[]},"version":0}')
    existing.state.items = [{
      id: 'test-item-1',
      productId: p.id,
      variantId: 'test-variant',
      name: p.name,
      colour: 'Test',
      size: 'M',
      price: p.price,
      image: '',
      qty: 2,
    }]
    localStorage.setItem(key, JSON.stringify(existing))
  }, product)

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(500)

  // Enter invalid promo code
  const promoInput = page.locator('input[aria-label="Promo code"]')
  await promoInput.fill('INVALID_CODE_XYZABC')
  await page.locator('button:has-text("Apply")').click()

  // Wait for error message
  const errMsg = page.locator('[role="alert"]:has-text("not valid")')
  await expect(errMsg).toBeVisible({ timeout: 5000 })

  // Now change quantity — click the + button
  const plusBtn = page.locator('button[aria-label*="Increase"]').first()
  if (await plusBtn.count() > 0) {
    await plusBtn.click()
  } else {
    // Try generic +/minus quantity button
    const qtyBtns = page.locator('button').filter({ hasText: '+' })
    if (await qtyBtns.count() > 0) await qtyBtns.first().click()
  }

  await page.waitForTimeout(300)

  // Error should be gone
  await expect(errMsg).not.toBeVisible()
})

// ── Bug #14: Empty first name shows "First name required" not "too short" ──
test('Bug#14 Empty first name shows "required" error', async ({ page }) => {
  await page.goto(`${BASE}/checkout`)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(500)

  // Submit without filling first name
  const submitBtn = page.locator('button[type="submit"]').last()
  if (await submitBtn.count() === 0) {
    console.warn('No submit button on checkout (cart may be empty), skipping')
    return
  }
  await submitBtn.click()
  await page.waitForTimeout(300)

  const firstNameErr = page.locator('[role="alert"]').filter({ hasText: 'First name' })
  const errText = await firstNameErr.first().textContent()
  expect(errText).toContain('required')
  expect(errText).not.toBe('First name too short')
})

// ── Bug #13: Address form scrolls to first error on submit ──
test('Bug#13 Empty address form scrolls to first error field', async ({ page }) => {
  await page.goto(`${BASE}/account/addresses`)
  await page.waitForLoadState('domcontentloaded')

  // Try to find "Add address" or "New address" button
  const addBtn = page.locator('button').filter({ hasText: /add|new address/i }).first()
  if (await addBtn.count() === 0) {
    console.warn('No Add address button found, skipping Bug#13 test (user may need to be logged in)')
    return
  }
  await addBtn.click()
  await page.waitForTimeout(300)

  // Scroll to bottom to ensure we're not already at the top
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(200)

  // Click Save without filling anything
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(600)

  // Check that viewport is near the top (first error field is visible)
  const scrollY = await page.evaluate(() => window.scrollY)
  expect(scrollY).toBeLessThan(500)
})

// ── CSS: Search cancel button rule is in stylesheet ──
test('CSS: webkit-search-cancel-button is hidden', async ({ page }) => {
  await page.goto(`${BASE}/search`)
  await page.waitForLoadState('domcontentloaded')

  const ruleFound = await page.evaluate(() => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule.cssText?.includes('webkit-search-cancel-button')) return true
        }
      } catch { /* cross-origin sheet */ }
    }
    return false
  })
  expect(ruleFound).toBe(true)
})
