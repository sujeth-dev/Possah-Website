import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('/search page loads with search form', async ({ page }) => {
    const response = await page.goto('/search', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    // SearchView renders a <form role="search">
    await expect(page.locator('form[role="search"]')).toBeVisible({ timeout: 8000 })
  })

  test('/search?q=silk shows results or empty state', async ({ page }) => {
    // Mock the search API so the test is DB-independent.
    // Use RegExp so it matches the full URL regardless of origin.
    await page.route(/\/api\/search/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'mock-1',
              slug: 'ivory-silk-saree',
              category_slug: 'sarees',
              name: 'Ivory Silk Saree',
              fabric: 'Silk',
              price: 18500,
              compare_price: null,
              is_new_arrival: true,
              is_top_selling: false,
              images: [],
              tags: [],
            },
          ],
        }),
      })
    })

    // Navigate and wait for the mocked API response concurrently
    const [, ] = await Promise.all([
      page.waitForResponse(/\/api\/search/, { timeout: 10000 }),
      page.goto('/search?q=silk', { waitUntil: 'domcontentloaded' }),
    ])
    await page.waitForTimeout(500) // allow React state update to render

    // Mocked result should appear
    await expect(page.getByText('Ivory Silk Saree')).toBeVisible({ timeout: 8000 })
  })

  test('empty search query shows no results (no crash)', async ({ page }) => {
    await page.goto('/search?q=', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)

    // Should not show a spinner or error — just the idle search form
    await expect(page.locator('form[role="search"]')).toBeVisible({ timeout: 8000 })
    // No server-side error content
    await expect(page.getByText(/internal server error/i)).not.toBeVisible()
  })

  test('navigating to /search?q= shows mocked results', async ({ page }) => {
    // The SearchView useEffect fires doSearch when the URL has a q param —
    // this is the common path from the header search bar.
    await page.route(/\/api\/search/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'mock-2',
              slug: 'black-lehenga',
              category_slug: 'lehengas',
              name: 'Black Lehenga',
              fabric: 'Silk',
              price: 32000,
              compare_price: null,
              is_new_arrival: false,
              is_top_selling: true,
              images: [],
              tags: [],
            },
          ],
        }),
      })
    })

    const [, ] = await Promise.all([
      page.waitForResponse(/\/api\/search/, { timeout: 10000 }),
      page.goto('/search?q=lehenga', { waitUntil: 'domcontentloaded' }),
    ])
    await page.waitForTimeout(500)

    // Mocked result should appear in the product grid
    await expect(page.getByText('Black Lehenga')).toBeVisible({ timeout: 8000 })
  })
})
