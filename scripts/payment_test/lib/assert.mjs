const R  = '\x1b[0m'
const G  = '\x1b[32m'
const RD = '\x1b[31m'
const Y  = '\x1b[33m'
const B  = '\x1b[1m'
const D  = '\x1b[2m'

export function makeAssertCollection(resource) {
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

  function status(action, label, res, expectedStatus) {
    const passed = res.status === expectedStatus
    const hint = res.status === 0
      ? 'Server not reachable. Is dev server running on :3000?'
      : res.status === 401
      ? 'Auth guard fired. Run dev server with NODE_ENV=development.'
      : res.status >= 500
      ? `Server error. Body: ${JSON.stringify(res.data)?.slice(0, 300)}`
      : `Got ${res.status}. Body: ${JSON.stringify(res.data)?.slice(0, 200)}`
    return _record(action, label, passed, expectedStatus, res.status, hint)
  }

  function field(action, label, obj, key, expectedVal) {
    const actual = obj?.[key]
    const passed = JSON.stringify(actual) === JSON.stringify(expectedVal)
    return _record(action, label, passed, expectedVal, actual,
      `Field "${key}" mismatch. Check route handler or seed data.`)
  }

  function isArray(action, label, val) {
    const passed = Array.isArray(val)
    return _record(action, label, passed, 'Array', typeof val, 'Route returned non-array.')
  }

  function ok(action, label, passed, fixHint) {
    return _record(action, label, Boolean(passed), undefined, undefined, fixHint)
  }

  function hasField(action, label, obj, key) {
    const passed = obj !== null && obj !== undefined && key in Object(obj)
    return _record(action, label, passed, `key "${key}" present`, passed ? 'present' : 'missing',
      `Response body missing "${key}". Check route return shape.`)
  }

  function notField(action, label, obj, key) {
    const has = obj !== null && obj !== undefined && key in Object(obj) && obj[key] !== undefined
    const passed = !has
    return _record(action, label, passed, `key "${key}" absent`, has ? 'present' : 'absent',
      `Response should NOT include "${key}". Check for data leak.`)
  }

  return { status, field, isArray, ok, hasField, notField, results }
}

export function printHeader(name) {
  const line = '─'.repeat(52)
  console.log(`\n${B}${line}${R}`)
  console.log(`${B}  ${name}${R}`)
  console.log(`${B}${line}${R}`)
}
