/**
 * Manual E2E test: full checkout with Razorpay test card.
 * Run with: node scripts/test-checkout.mjs
 * Requires dev server running at localhost:3000
 */

import { chromium } from 'playwright'

const PDP_URL = 'http://localhost:3000/women/sarees/the-dusk-saree'
const CHECKOUT_DETAILS = {
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  phone: '9999999999',
  address_line1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
}

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  console.log('→ Navigating to PDP...')
  await page.goto(PDP_URL, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'scripts/screenshots/01-pdp.png' })
  console.log('  ✅ PDP loaded:', await page.title())

  // Pick size if selector is present
  const sizeBtn = page.locator('button[data-size], [data-testid="size-btn"]').first()
  const freeSizeBtn = page.getByRole('button', { name: /free size/i }).first()
  const xsBtn = page.getByRole('button', { name: /^XS$/i }).first()

  if (await freeSizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await freeSizeBtn.click()
    console.log('  ✅ Selected: Free Size')
  } else if (await xsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await xsBtn.click()
    console.log('  ✅ Selected: XS')
  } else if (await sizeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sizeBtn.first().click()
    console.log('  ✅ Selected first available size')
  } else {
    console.log('  ℹ️  No size selector found — may be Free Size product')
  }

  // Add to cart
  const addBtn = page.getByRole('button', { name: /add to cart/i })
  await addBtn.waitFor({ timeout: 5000 })
  await addBtn.click()
  console.log('  ✅ Clicked Add to Cart')
  await page.screenshot({ path: 'scripts/screenshots/02-added-to-cart.png' })
  await page.waitForTimeout(1000)

  // Navigate to cart
  console.log('→ Going to cart...')
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'scripts/screenshots/03-cart.png' })
  console.log('  ✅ Cart loaded')

  // Proceed to checkout
  const checkoutBtn = page.getByRole('link', { name: /checkout/i }).or(
    page.getByRole('button', { name: /checkout/i })
  ).first()
  await checkoutBtn.waitFor({ timeout: 5000 })
  await checkoutBtn.click()
  await page.waitForURL('**/checkout**', { timeout: 10000 })
  console.log('  ✅ On checkout page:', page.url())
  await page.screenshot({ path: 'scripts/screenshots/04-checkout.png' })

  // Fill in form
  console.log('→ Filling checkout form...')
  await page.fill('[name="first_name"], #first_name, input[placeholder*="First"]', CHECKOUT_DETAILS.first_name)
  await page.fill('[name="last_name"], #last_name, input[placeholder*="Last"]', CHECKOUT_DETAILS.last_name)
  await page.fill('[name="email"], #email, input[type="email"]', CHECKOUT_DETAILS.email)
  await page.fill('[name="phone"], #phone, input[type="tel"]', CHECKOUT_DETAILS.phone)
  await page.fill('[name="address_line1"], #address_line1, input[placeholder*="Address"]', CHECKOUT_DETAILS.address_line1)
  await page.fill('[name="city"], #city, input[placeholder*="City"]', CHECKOUT_DETAILS.city)
  await page.fill('[name="pincode"], #pincode, input[placeholder*="Pincode"], input[placeholder*="PIN"]', CHECKOUT_DETAILS.pincode)

  // State dropdown
  const stateSelect = page.locator('select[name="state"], #state')
  if (await stateSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await stateSelect.selectOption({ label: 'Karnataka' })
  }

  await page.screenshot({ path: 'scripts/screenshots/05-form-filled.png' })
  console.log('  ✅ Form filled')

  // Submit
  const payBtn = page.getByRole('button', { name: /pay|place order|proceed/i }).last()
  await payBtn.waitFor({ timeout: 5000 })
  await payBtn.click()
  console.log('  ✅ Clicked Pay button')

  // Wait for Razorpay modal to appear
  console.log('→ Waiting for Razorpay modal...')
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'scripts/screenshots/06-razorpay-modal.png' })

  // Razorpay loads in an iframe
  const rzpFrame = page.frameLocator('iframe[src*="razorpay"]').first()
  const rzpFrameEl = page.locator('iframe[src*="razorpay"]').first()

  if (await rzpFrameEl.isVisible({ timeout: 8000 }).catch(() => false)) {
    console.log('  ✅ Razorpay iframe detected')

    // Try to fill card details inside the iframe
    try {
      await rzpFrame.locator('input[placeholder*="Card"], input[name*="card"]').first().fill('4111111111111111')
      await rzpFrame.locator('input[placeholder*="MM"], input[name*="expiry"]').first().fill('12/26')
      await rzpFrame.locator('input[placeholder*="CVV"], input[name*="cvv"]').first().fill('123')
      await page.screenshot({ path: 'scripts/screenshots/07-card-filled.png' })
      console.log('  ✅ Card details filled in iframe')

      const payNowBtn = rzpFrame.getByRole('button', { name: /pay/i }).first()
      await payNowBtn.click()
      console.log('  ✅ Clicked Pay Now in modal')

      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'scripts/screenshots/08-after-payment.png' })
      console.log('  Final URL:', page.url())
    } catch (e) {
      console.log('  ⚠️  Could not automate inside Razorpay iframe (cross-origin):', e.message)
      console.log('  → Modal is visible — you need to manually fill card 4111 1111 1111 1111 / CVV 123 / Exp 12/26')
      // Keep browser open for manual completion
      console.log('\n  ⏳ Keeping browser open for 120s — complete the payment manually...')
      await page.waitForTimeout(120000)
      await page.screenshot({ path: 'scripts/screenshots/09-manual-completion.png' })
    }
  } else {
    console.log('  ❌ Razorpay modal did not appear — check API keys and create-order endpoint')
    await page.screenshot({ path: 'scripts/screenshots/06-no-modal.png' })
  }

  console.log('\n✅ Test complete — screenshots saved to scripts/screenshots/')
  await browser.close()
})()
