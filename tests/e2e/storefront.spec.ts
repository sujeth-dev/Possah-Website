import { test, expect } from '@playwright/test'

test.describe('Storefront pages', () => {
  test('homepage returns 200 and renders main content', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 8000 })
  })

  test('/women returns 200', async ({ page }) => {
    const response = await page.goto('/women', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })

  test('/new-in returns 200', async ({ page }) => {
    const response = await page.goto('/new-in', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })

  test('/best-sellers returns 200', async ({ page }) => {
    const response = await page.goto('/best-sellers', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })

  test('/women/sarees returns 200 with category heading', async ({ page }) => {
    const response = await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('homepage has links to core category routes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    // Count all category links in the DOM (nav may be collapsed on mobile but links still exist)
    const count = await page.locator(
      'a[href*="/women/"], a[href="/new-in"], a[href="/women"], a[href="/best-sellers"]',
    ).count()
    expect(count).toBeGreaterThan(0)
  })

  test('/women/sarees shows product grid container', async ({ page }) => {
    await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    // The flex layout wrapping the filter sidebar and product area is always rendered
    const gridArea = page.locator('.flex-1.min-w-0').first()
    await expect(gridArea).toBeVisible({ timeout: 8000 })
  })

  test('/shop/sarees redirects to /women/sarees', async ({ page }) => {
    const response = await page.goto('/shop/sarees', { waitUntil: 'domcontentloaded' })
    // Next.js permanent redirect — browser follows it, end URL should be /women/sarees
    expect(page.url()).toContain('/women/sarees')
    expect(response?.status()).toBe(200)
  })
})
