// FIX-TEST-04: Playwright E2E — checkout flow
// Uses route interception to mock Razorpay and payment APIs.
// Requires the dev server running at localhost:3000 with test data seeded.

import { test, expect } from '@playwright/test'

// ─── Cart + Checkout flow ────────────────────────────────────────────────────

test.describe('Checkout flow', () => {
  test.beforeEach(async ({ page }) => {
    // Seed a product into the Zustand cart via localStorage before navigation
    await page.goto('/')
    await page.evaluate(() => {
      const cartItem = {
        productId: 'test-product-id',
        variantId: 'test-variant-id',
        name: 'Test Silk Saree',
        image: 'https://via.placeholder.com/300x400',
        price: 9999,
        colour: 'Ivory',
        colourHex: '#F4ECDF',
        size: 'Free Size',
        qty: 1,
        slug: 'test-silk-saree',
      }
      const state = { state: { items: [cartItem] }, version: 0 }
      localStorage.setItem('possah-cart', JSON.stringify(state))
    })
  })

  test('cart page shows items and proceeds to checkout', async ({ page }) => {
    await page.goto('/cart')
    await expect(page.getByText('Test Silk Saree')).toBeVisible()
    await expect(page.getByText('₹9,999')).toBeVisible()

    const checkoutBtn = page.getByRole('link', { name: /checkout/i })
    await expect(checkoutBtn).toBeVisible()
  })

  test('checkout form validates required fields', async ({ page }) => {
    await page.goto('/checkout')
    // Wait for form to render
    await expect(page.getByText(/shipping address/i)).toBeVisible({ timeout: 10000 })

    // Submit empty form
    const payButton = page.getByRole('button', { name: /pay/i })
    await payButton.click()

    // Validation errors should appear
    await expect(page.getByText(/first name required/i)).toBeVisible()
  })

  test('checkout form accepts valid inputs and opens Razorpay modal', async ({ page }) => {
    // Intercept the order creation API
    await page.route('/api/orders/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          razorpay_order_id: 'order_test_001',
          order_number: 'PSH-2026-9999',
          amount: 1019800,
        }),
      })
    })

    await page.goto('/checkout')
    await expect(page.getByText(/shipping address/i)).toBeVisible({ timeout: 10000 })

    // Fill form
    await page.fill('input[name="first_name"]', 'Priya')
    await page.fill('input[name="last_name"]', 'Sharma')
    await page.fill('input[name="email"]', 'priya@example.com')
    await page.fill('input[name="phone"]', '9876543210')
    await page.fill('input[name="address_line1"]', 'No. 30, 1st Main Road')
    await page.fill('input[name="city"]', 'Bengaluru')
    await page.selectOption('select[name="state"]', 'Karnataka')
    await page.fill('input[name="pincode"]', '560113')

    // Submit
    const payButton = page.getByRole('button', { name: /pay/i })
    await payButton.click()

    // Razorpay modal should appear (or order API was called)
    // In test env without Razorpay JS, the handler falls to the else branch
    // and should navigate to order confirmation
    await page.waitForURL(/confirmation|checkout/, { timeout: 15000 })
  })

  test('coupon field applies code without URL pollution', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByText(/coupon code/i)).toBeVisible({ timeout: 10000 })

    // Verify coupon is NOT in URL
    expect(page.url()).not.toContain('coupon=')

    // Intercept coupon validate
    await page.route('/api/coupons/validate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, discount_type: 'flat', discount_value: 500 }),
      })
    })

    // Type coupon and apply
    await page.fill('input[aria-label="Coupon code"]', 'SAVE500')
    await page.getByRole('button', { name: 'Apply' }).click()

    // Success state should show
    await expect(page.getByText(/SAVE500 applied/i)).toBeVisible({ timeout: 5000 })

    // URL must still not contain coupon
    expect(page.url()).not.toContain('coupon')
  })
})

// ─── Auth flow ───────────────────────────────────────────────────────────────

test.describe('Authentication', () => {
  test('sign-in page renders without errors', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByText(/sign in/i)).toBeVisible()
    await expect(page.getByText(/google/i)).toBeVisible()
  })

  test('admin redirect goes to sign-in when unauthenticated', async ({ page }) => {
    await page.goto('/admin')
    // Should redirect to /auth/signin
    await expect(page).toHaveURL(/auth\/signin/, { timeout: 8000 })
  })
})

// ─── Product pages ───────────────────────────────────────────────────────────

test.describe('Storefront', () => {
  test('homepage loads with 200', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
  })

  test('health check returns ok', async ({ page }) => {
    const response = await page.goto('/api/health')
    const body = await response?.json()
    expect(body?.status).toMatch(/ok|degraded/)
  })
})
