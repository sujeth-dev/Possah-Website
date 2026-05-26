/**
 * run.mjs — Orchestrator for the full payment API test suite.
 *
 * Steps:
 *   1. Preflight: check dev server is reachable + env vars present
 *   2. Seed: insert test products, coupons, orders into Supabase
 *   3. Run: execute all 5 test modules in order
 *   4. Report: write markdown report to reports/
 *   5. Cleanup: delete all seeded test rows
 *
 * Usage:
 *   NODE_ENV=development node scripts/payment_test/run.mjs
 *
 * Skip cleanup (keep seed data for manual inspection):
 *   SKIP_CLEANUP=1 NODE_ENV=development node scripts/payment_test/run.mjs
 *
 * Skip seed (data already seeded in a prior run):
 *   SKIP_SEED=1 NODE_ENV=development node scripts/payment_test/run.mjs
 */

import { seed }        from './seed.mjs'
import { cleanup }     from './cleanup.mjs'
import { writeReport } from './lib/report.mjs'
import { BASE_URL, api } from './lib/http.mjs'
import { ENV } from './lib/env.mjs'

import { run as runCouponValidate }   from './tests/01-coupon-validate.mjs'
import { run as runOrderCreate }      from './tests/02-order-create.mjs'
import { run as runPaymentVerify }    from './tests/03-payment-verify.mjs'
import { run as runWebhookCaptured }  from './tests/04-webhook-captured.mjs'
import { run as runWebhookFailed }    from './tests/05-webhook-failed.mjs'

const BOLD   = '\x1b[1m'
const RESET  = '\x1b[0m'
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'

// ─── Preflight ────────────────────────────────────────────────────────────────
async function preflight() {
  console.log(`\n${BOLD}${CYAN}Possah Payment API Test Suite${RESET}`)
  console.log(`Server:  ${BASE_URL}`)
  console.log(`Mode:    ${process.env.NODE_ENV ?? 'not set'}`)
  console.log(`Razorpay key: ${ENV.RAZORPAY_KEY_ID ?? '(not set)'}`)
  console.log()

  if (process.env.NODE_ENV !== 'development') {
    console.error(`${RED}FATAL: NODE_ENV is not "development".${RESET}`)
    console.error(`Run with:  NODE_ENV=development node scripts/payment_test/run.mjs\n`)
    process.exit(1)
  }

  // Warn if using live keys (rzp_live_)
  const keyId = ENV.RAZORPAY_KEY_ID ?? ''
  if (keyId.startsWith('rzp_live_')) {
    console.error(`${RED}FATAL: RAZORPAY_KEY_ID is a live key (rzp_live_...).${RESET}`)
    console.error(`Module 02-order-create creates real Razorpay orders.`)
    console.error(`Use rzp_test_... keys only.\n`)
    process.exit(1)
  }

  if (!keyId.startsWith('rzp_test_')) {
    console.warn(`${YELLOW}⚠  RAZORPAY_KEY_ID does not start with rzp_test_. Module 02 (order create) will likely fail.${RESET}\n`)
  }

  process.stdout.write(`Checking dev server at ${BASE_URL}/api/health ... `)
  try {
    const res = await api('GET', '/api/health')
    if (res.status >= 200 && res.status < 500) {
      console.log(`${GREEN}OK (${res.status})${RESET}`)
    } else {
      throw new Error(`status ${res.status}`)
    }
  } catch (err) {
    console.log(`${RED}FAILED${RESET}`)
    console.error(`\n${RED}Dev server not reachable.${RESET} Start it with:`)
    console.error(`  NODE_ENV=development npm run dev\n`)
    console.error(`Error: ${err.message}\n`)
    process.exit(1)
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await preflight()

  // ── Seed ─────────────────────────────────────────────────────────────────────
  let ctx = {}
  if (process.env.SKIP_SEED !== '1') {
    try {
      ctx = await seed()
    } catch (err) {
      console.error(`\n${RED}Seed failed: ${err.message}${RESET}`)
      console.error(err.stack)
      console.error('\nCannot run tests without seed data. Fix seed.mjs or check Supabase credentials.\n')
      process.exit(1)
    }
  } else {
    console.log(`${YELLOW}⚠  SKIP_SEED=1 — skipping seed. Tests use existing data.${RESET}\n`)
  }

  // ── Run test modules ──────────────────────────────────────────────────────────
  const allResults = []
  const modules = [
    ['CouponValidate',  runCouponValidate],
    ['OrderCreate',     runOrderCreate],
    ['PaymentVerify',   runPaymentVerify],
    ['WebhookCaptured', runWebhookCaptured],
    ['WebhookFailed',   runWebhookFailed],
  ]

  for (const [name, runFn] of modules) {
    try {
      const results = await runFn(ctx)
      allResults.push(...results)
    } catch (err) {
      console.error(`\n${RED}[${name}] Unhandled error: ${err.message}${RESET}`)
      console.error(err.stack)
      allResults.push({
        resource: name,
        action: 'MODULE ERROR',
        label: err.message,
        passed: false,
        expected: 'no error',
        actual: err.message,
        fixHint: 'Unhandled exception in test module. Check stack trace above.',
      })
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const passed = allResults.filter(r => r.passed).length
  const failed = allResults.filter(r => !r.passed).length
  const total  = allResults.length

  console.log(`\n${'─'.repeat(52)}`)
  console.log(`${BOLD}Results: ${passed}/${total} passed${RESET}`)
  if (failed > 0) {
    console.log(`${RED}${failed} assertion(s) failed — see report for fix hints.${RESET}`)
  } else {
    console.log(`${GREEN}All assertions passed. Payment flow is solid.${RESET}`)
  }

  // ── Write report ──────────────────────────────────────────────────────────────
  const reportPath = writeReport(allResults)
  console.log(`\nReport: ${reportPath}`)

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  if (process.env.SKIP_CLEANUP !== '1') {
    await cleanup()
  } else {
    console.log(`\n${YELLOW}⚠  SKIP_CLEANUP=1 — test data left in Supabase.${RESET}`)
    console.log(`   Remove it later:  node scripts/payment_test/cleanup.mjs\n`)
  }

  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error(`\n${RED}Fatal: ${err.message}${RESET}`)
  console.error(err.stack)
  process.exit(1)
})
