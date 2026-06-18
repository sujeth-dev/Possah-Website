import { test, expect } from '@playwright/test'

// Note: in NODE_ENV=development the account pages bypass NextAuth and render
// with a fake "Dev User" session. Tests are written to accept both:
//   - dev mode   → shows account content ("WELCOME BACK" / "My Orders")
//   - production → shows sign-in prompt (no session)
// The admin redirect test is reliable in all environments (middleware has no dev bypass).

test.describe('Account pages', () => {
  test('/account returns 200 and renders account-related content', async ({ page }) => {
    const response = await page.goto('/account')
    expect(response?.status()).toBe(200)

    // Either the account dashboard or the sign-in prompt must be visible
    await expect(
      page.getByText(/welcome back|sign in to continue/i).first(),
    ).toBeVisible({ timeout: 8000 })
  })

  test('/account/orders returns 200 and renders orders heading or sign-in link', async ({ page }) => {
    const response = await page.goto('/account/orders')
    expect(response?.status()).toBe(200)

    await expect(
      page.getByText(/my orders|sign in/i).first(),
    ).toBeVisible({ timeout: 8000 })
  })

  test('/account/addresses returns 200', async ({ page }) => {
    const response = await page.goto('/account/addresses', { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
  })

  test('/account/orders/[orderNumber] for unknown number renders gracefully', async ({ page }) => {
    // In dev, unknown order → notFound() → 404/200 with not-found page.
    // Retry once in case of transient 500 during parallel dev-server compilation.
    let response = await page.goto('/account/orders/PSH-0000-NOTREAL', { waitUntil: 'domcontentloaded' })
    if (response?.status() === 500) {
      await page.waitForTimeout(2000)
      response = await page.goto('/account/orders/PSH-0000-NOTREAL', { waitUntil: 'domcontentloaded' })
    }
    // Should be 200 (shows "order not found" / not-found page) or 404, not 500
    expect(response?.status()).not.toBe(500)
  })
})
