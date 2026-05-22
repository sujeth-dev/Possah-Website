import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { BASE_URL } from './http.mjs'

const ROOT = resolve(process.cwd())

/**
 * Writes a full markdown report to scripts/admin_test/reports/test-results-{ts}.md
 * Returns the file path.
 *
 * @param {Array<{resource, action, label, passed, expected, actual, fixHint}>} allResults
 */
export function writeReport(allResults) {
  const ts        = new Date().toISOString()
  const slug      = ts.replace(/[:.]/g, '-').slice(0, 19)
  const outDir    = resolve(ROOT, 'scripts', 'admin_test', 'reports')
  const outPath   = resolve(outDir, `test-results-${slug}.md`)

  mkdirSync(outDir, { recursive: true })

  // ── Aggregate by resource ──────────────────────────────────────────────────
  const byResource = {}
  for (const r of allResults) {
    if (!byResource[r.resource]) byResource[r.resource] = []
    byResource[r.resource].push(r)
  }

  const totalPass = allResults.filter(r => r.passed).length
  const totalFail = allResults.filter(r => !r.passed).length
  const failures  = allResults.filter(r => !r.passed)

  const lines = []

  // ── Header ─────────────────────────────────────────────────────────────────
  lines.push(`# Admin API Test Report`)
  lines.push(``)
  lines.push(`**Generated:** ${ts}`)
  lines.push(`**Server:** ${BASE_URL}`)
  lines.push(`**Node:** ${process.version}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── Summary table ──────────────────────────────────────────────────────────
  lines.push(`## Summary`)
  lines.push(``)
  lines.push(`| Resource | ✓ Pass | ✗ Fail | Total |`)
  lines.push(`|----------|--------|--------|-------|`)
  for (const [resource, results] of Object.entries(byResource)) {
    const p = results.filter(r => r.passed).length
    const f = results.filter(r => !r.passed).length
    const status = f === 0 ? '✓' : '✗'
    lines.push(`| ${status} ${resource} | ${p} | ${f} | ${results.length} |`)
  }
  lines.push(``)
  lines.push(totalFail === 0
    ? `**✅ All ${totalPass} assertions passed.**`
    : `**Result: ${totalPass} passed / ${totalFail} failed**`
  )
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── Fix plan (failures only) ───────────────────────────────────────────────
  if (failures.length > 0) {
    lines.push(`## Fix Plan`)
    lines.push(``)
    lines.push(`Each failing assertion is listed below with diagnosis and suggested fix.`)
    lines.push(``)
    for (const f of failures) {
      lines.push(`### ✗ ${f.resource} → ${f.action} → ${f.label}`)
      lines.push(``)
      if (f.expected !== undefined) lines.push(`- **Expected:** \`${JSON.stringify(f.expected)}\``)
      if (f.actual   !== undefined) lines.push(`- **Actual:** \`${JSON.stringify(f.actual)}\``)
      if (f.fixHint) lines.push(`- **Fix:** ${f.fixHint}`)
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── Detailed results per resource ──────────────────────────────────────────
  lines.push(`## Detailed Results`)
  lines.push(``)
  for (const [resource, results] of Object.entries(byResource)) {
    const allPassed = results.every(r => r.passed)
    lines.push(`### ${allPassed ? '✅' : '❌'} ${resource}`)
    lines.push(``)
    lines.push(`| Action | Assertion | Status | Fix hint |`)
    lines.push(`|--------|-----------|--------|----------|`)
    for (const r of results) {
      const icon = r.passed ? '✓' : '✗'
      const hint = r.passed ? '' : (r.fixHint || '-')
      lines.push(`| ${r.action} | ${r.label} | ${icon} | ${hint} |`)
    }
    lines.push(``)
  }

  writeFileSync(outPath, lines.join('\n'), 'utf-8')
  return outPath
}
