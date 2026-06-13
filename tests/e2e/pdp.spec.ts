import { test, expect } from '@playwright/test'

test.describe('Product detail page (PDP)', () => {
  test('/shop/sarees category page loads with heading', async ({ page }) => {
    const response = await page.goto('/shop/sarees', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('unknown product slug renders not-found page', async ({ page }) => {
    // Next.js notFound() shows the custom 404 UI (HTTP 404 in production, 200 in dev)
    await page.goto('/shop/sarees/this-product-does-not-exist-xyz123')
    await expect(page.getByText(/this page wore itself out/i)).toBeVisible({ timeout: 8000 })
  })

  test('unknown category slug renders not-found page', async ({ page }) => {
    await page.goto('/shop/not-a-real-category-xyz/some-slug')
    await expect(page.getByText(/this page wore itself out/i)).toBeVisible({ timeout: 8000 })
  })

  test('clicking a product card navigates to PDP', async ({ page }) => {
    await page.goto('/shop/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const productLink = page.locator('a[href*="/shop/sarees/"]').first()
    const count = await productLink.count()

    // Skip if no products in DB for this environment
    if (count === 0) {
      test.skip(true, 'No saree products in DB — skipping PDP navigation')
      return
    }

    await productLink.click()
    await expect(page).toHaveURL(/\/shop\/sarees\//, { timeout: 10000 })
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8000 })
  })

  test('PDP shows add-to-bag button', async ({ page }) => {
    await page.goto('/shop/sarees', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const productLink = page.locator('a[href*="/shop/sarees/"]').first()
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
})
