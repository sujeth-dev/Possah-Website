// ─── Colours ─────────────────────────────────────────────────────────────────
const R = '\x1b[0m'   // reset
const G = '\x1b[32m'  // green
const RD = '\x1b[31m' // red
const Y = '\x1b[33m'  // yellow
const B = '\x1b[1m'   // bold
const D = '\x1b[2m'   // dim

// ─── makeAssertCollection ─────────────────────────────────────────────────────
/**
 * Creates a scoped assertion collector for one test module.
 *
 * Usage:
 *   const A = makeAssertCollection('Products')
 *   A.status('LIST', 'returns 200', res, 200)
 *   A.field('GET', 'name matches', obj, 'name', 'test-product-alpha')
 *   A.ok('CREATE', 'has id', typeof res.data.id === 'string')
 *   return A.results
 */
export function makeAssertCollection(resource) {
  /** @type {Array<{resource,action,label,passed,expected,actual,fixHint}>} */
  const results = []

  function _record(action, label, passed, expected, actual, fixHint) {
    results.push({ resource, action, label, passed, expected, actual, fixHint: fixHint ?? '' })
    const icon = passed ? `${G}✓${R}` : `${RD}✗${R}`
    process.stdout.write(`  ${icon} [${action}] ${label}\n`)
    if (!passed) {
      if (expected !== undefined) process.stdout.write(`       ${D}expected${R} ${JSON.stringify(expected)}\n`)
      if (actual   !== undefined) process.stdout.write(`       ${D}actual  ${R} ${JSON.stringify(actual)}\n`)
      if (fixHint)                process.stdout.write(`       ${Y}fix${R}     ${fixHint}\n`)
    }
    return passed
  }

  /** Assert HTTP status code */
  function status(action, label, res, expectedStatus) {
    const passed = res.status === expectedStatus
    const hint = res.status === 401
      ? 'Auth guard fired. Is dev server running with NODE_ENV=development?'
      : res.status >= 500
      ? `Server error — check Next.js terminal. Body: ${JSON.stringify(res.data)?.slice(0, 200)}`
      : `Response body: ${JSON.stringify(res.data)?.slice(0, 200)}`
    return _record(action, label, passed, expectedStatus, res.status, hint)
  }

  /** Assert a field deep-equals expected value */
  function field(action, label, obj, key, expectedVal) {
    const actual = obj?.[key]
    const passed = JSON.stringify(actual) === JSON.stringify(expectedVal)
    return _record(action, label, passed, expectedVal, actual,
      `Field "${key}" mismatch. Check route handler or seed data.`)
  }

  /** Assert value is an array */
  function isArray(action, label, val) {
    const passed = Array.isArray(val)
    return _record(action, label, passed, 'Array', typeof val,
      'Route returned non-array. Check route handler.')
  }

  /** Assert a truthy condition with a custom message */
  function ok(action, label, passed, fixHint) {
    return _record(action, label, Boolean(passed), undefined, undefined, fixHint)
  }

  /** Assert response body has an "error" field (for error case tests) */
  function hasError(action, label, res) {
    const passed = typeof res.data?.error === 'string'
    return _record(action, label, passed, 'string', typeof res.data?.error,
      'Error responses must include an "error" string field.')
  }

  return { status, field, isArray, ok, hasError, results }
}

export function printHeader(name) {
  const line = '─'.repeat(52)
  console.log(`\n${B}${line}${R}`)
  console.log(`${B}  ${name}${R}`)
  console.log(`${B}${line}${R}`)
}
