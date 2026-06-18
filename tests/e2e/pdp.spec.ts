import { test, expect } from '@playwright/test'

test.describe('Product detail page (PDP)', () => {
  test('/women/sarees category page loads with heading', async ({ page }) => {
    let response = await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    if (response?.status() === 500) {
      await page.waitForTimeout(3000)
      response = await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    }
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('unknown product slug renders not-found page', async ({ page }) => {
    // Next.js notFound() renders app/not-found.tsx ("This page wore itself out.")
    // Accept either the custom 404 h1 OR a generic 404 indicator — in dev mode
    // the error overlay may appear instead of the custom page.
    await page.goto('/women/sarees/this-product-does-not-exist-xyz123', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByText(/this page wore itself out/i).or(page.getByText(/404/)).or(page.getByText(/not found/i))
    ).toBeVisible({ timeout: 15000 })
  })

  test('unknown category slug renders not-found page', async ({ page }) => {
    await page.goto('/women/not-a-real-category-xyz/some-slug', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByText(/this page wore itself out/i).or(page.getByText(/404/)).or(page.getByText(/not found/i))
    ).toBeVisible({ timeout: 15000 })
  })

  test('invalid gender renders not-found page', async ({ page }) => {
    await page.goto('/xyz-invalid-gender', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByText(/this page wore itself out/i).or(page.getByText(/404/)).or(page.getByText(/not found/i))
    ).toBeVisible({ timeout: 15000 })
  })

  test('clicking a product card navigates to PDP', async ({ page }) => {
    await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const productLink = page.locator('a[href*="/women/sarees/"]').first()
    const count = await productLink.count()

    // Skip if no products in DB for this environment
    if (count === 0) {
      test.skip(true, 'No saree products in DB — skipping PDP navigation')
      return
    }

    await productLink.click()
    await expect(page).toHaveURL(/\/women\/sarees\//, { timeout: 10000 })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('PDP shows add-to-bag button', async ({ page }) => {
    await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const productLink = page.locator('a[href*="/women/sarees/"]').first()
    const count = await productLink.count()

    if (count === 0) {
      test.skip(true, 'No saree products in DB — skipping PDP button test')
      return
    }

    const href = await productLink.getAttribute('href')
    await page.goto(href!, { waitUntil: 'domcontentloaded' })

    const addBtn = page.getByRole('button', { name: /add to bag|add to cart/i })
    await expect(addBtn).toBeVisible({ timeout: 8000 })
  })

  test('PDP breadcrumb links use /women/ prefix', async ({ page }) => {
    await page.goto('/women/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const productLink = page.locator('a[href*="/women/sarees/"]').first()
    const count = await productLink.count()

    if (count === 0) {
      test.skip(true, 'No saree products in DB — skipping breadcrumb test')
      return
    }

    await productLink.click()
    await page.waitForLoadState('domcontentloaded')

    // Breadcrumb should have Women and Sarees links pointing to /women paths
    const womenLink = page.locator('nav[aria-label="Breadcrumb"] a[href="/women"]')
    await expect(womenLink).toBeVisible({ timeout: 8000 })

    const sareeLink = page.locator('nav[aria-label="Breadcrumb"] a[href="/women/sarees"]')
    await expect(sareeLink).toBeVisible({ timeout: 8000 })
  })
})
