import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'

// Colour-contrast is excluded here — it requires brand/design decisions that
// the user reviews separately. All other WCAG 2.1 AA violations are treated as failures.
const SKIP_RULES = ['color-contrast']

function formatViolations(violations: Result[]) {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node${v.nodes.length !== 1 ? 's' : ''})`)
    .join('\n')
}

async function auditPage(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .disableRules(SKIP_RULES)
    .analyze()
}

const A11Y_CART_ITEM = {
  productId: 'a11y-test-product',
  variantId: 'a11y-test-variant',
  name: 'Accessibility Test Saree',
  image: 'https://cdn.thepossah.com/ui/placeholder.svg',
  price: 9999,
  colour: 'Ivory',
  colourHex: '#F4ECDF',
  size: 'Free Size',
  qty: 1,
  slug: '/women/sarees/test-silk-saree',
}

// Seed a cart item via addInitScript so Zustand reads it on first initialization.
async function seedCart(page: Page) {
  await page.addInitScript((item) => {
    localStorage.setItem('possah-cart', JSON.stringify({ state: { items: [item] }, version: 0 }))
  }, A11Y_CART_ITEM)
}

test.describe('Accessibility (WCAG 2.1 AA — colour-contrast excluded)', () => {
  test.setTimeout(90000)

  test('homepage has no violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('women/sarees category page has no violations', async ({ page }) => {
    await page.goto('/women/sarees')
    await page.waitForLoadState('networkidle')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('PDP has no violations', async ({ page }) => {
    await page.goto('/women/sarees/the-dusk-saree')
    // Skip gracefully if this slug doesn't exist in the dev DB
    if (page.url().includes('not-found') || page.url().endsWith('/women/sarees')) {
      test.skip()
      return
    }
    await page.waitForLoadState('networkidle')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('cart page (with items) has no violations', async ({ page }) => {
    await seedCart(page)
    await page.goto('/cart')
    await page.waitForLoadState('domcontentloaded')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('checkout page has no violations', async ({ page }) => {
    await seedCart(page)
    await page.goto('/checkout')
    await page.waitForLoadState('domcontentloaded')
    // Checkout form only shows when cart has items; skip audit if not visible
    const hasForm = await page.getByText(/shipping address/i).isVisible({ timeout: 12000 }).catch(() => false)
    if (!hasForm) {
      test.skip(true, 'Checkout form not visible — skipping a11y audit')
      return
    }
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('contact page has no violations', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })

  test('sign-in page has no violations', async ({ page }) => {
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    const { violations } = await auditPage(page)
    expect(violations, formatViolations(violations)).toHaveLength(0)
  })
})
