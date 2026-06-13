import { test, expect } from '@playwright/test'

// Admin auth boundary tests.
// Middleware (middleware.ts) has no dev bypass — /admin always redirects unauthenticated users.
// Admin API routes use requireAdminAuth which checks the NextAuth JWT; browser
// requests without a session or X-Admin-Test-Token header always get 401.

test.describe('Admin auth boundary', () => {
  test('/admin redirects unauthenticated user to /auth/signin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/auth\/signin/, { timeout: 8000 })
  })

  test('/admin/products redirects unauthenticated user to /auth/signin', async ({ page }) => {
    await page.goto('/admin/products')
    await expect(page).toHaveURL(/auth\/signin/, { timeout: 8000 })
  })

  test('GET /api/admin/products returns 401 without auth', async ({ page }) => {
    // Browser-level fetch — no session cookie, no admin test token
    const response = await page.request.get('/api/admin/products')
    expect(response.status()).toBe(401)
  })

  test('GET /api/admin/orders returns 401 without auth', async ({ page }) => {
    const response = await page.request.get('/api/admin/orders')
    expect(response.status()).toBe(401)
  })

  test('POST /api/admin/products returns 401 without auth', async ({ page }) => {
    const response = await page.request.post('/api/admin/products', {
      data: { name: 'Hacked product' },
    })
    expect(response.status()).toBe(401)
  })
})
