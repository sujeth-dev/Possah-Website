import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export function writeReport(allResults, meta = {}) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dir = resolve(process.cwd(), 'scripts/payment_test/reports')
  mkdirSync(dir, { recursive: true })
  const path = resolve(dir, `payment-results-${ts}.md`)

  // Group by resource
  const byResource = {}
  for (const r of allResults) {
    if (!byResource[r.resource]) byResource[r.resource] = []
    byResource[r.resource].push(r)
  }

  const totalPass = allResults.filter(r => r.passed).length
  const totalFail = allResults.filter(r => !r.passed).length
  const allPass = totalFail === 0

  let md = `# Payment API Test Report\n\n`
  md += `**Generated:** ${new Date().toISOString()}\n`
  md += `**Server:** http://localhost:3000\n`
  if (meta.node) md += `**Node:** ${meta.node}\n`
  md += `\n---\n\n`

  // Summary
  md += `## Summary\n\n`
  md += `| Resource | ✓ Pass | ✗ Fail | Total |\n`
  md += `|----------|--------|--------|-------|\n`
  for (const [res, rows] of Object.entries(byResource)) {
    const p = rows.filter(r => r.passed).length
    const f = rows.filter(r => !r.passed).length
    const icon = f === 0 ? '✓' : '✗'
    md += `| ${icon} ${res} | ${p} | ${f} | ${rows.length} |\n`
  }
  md += `\n`
  if (allPass) {
    md += `**✅ All ${totalPass} assertions passed.**\n\n`
  } else {
    md += `**❌ ${totalFail} of ${totalPass + totalFail} assertions failed.**\n\n`
  }

  md += `---\n\n`

  // Fix plan (failures only)
  const failures = allResults.filter(r => !r.passed)
  if (failures.length > 0) {
    md += `## Fix Plan\n\n`
    for (const f of failures) {
      md += `### ✗ ${f.resource} → ${f.action} → ${f.label}\n`
      if (f.expected !== undefined) md += `- Expected: \`${JSON.stringify(f.expected)}\`\n`
      if (f.actual   !== undefined) md += `- Actual: \`${JSON.stringify(f.actual)}\`\n`
      if (f.fixHint) md += `- Fix: ${f.fixHint}\n`
      md += `\n`
    }
    md += `---\n\n`
  }

  // Detailed results per resource
  md += `## Detailed Results\n\n`
  for (const [res, rows] of Object.entries(byResource)) {
    const allGreen = rows.every(r => r.passed)
    md += `### ${allGreen ? '✅' : '❌'} ${res}\n\n`
    md += `| Action | Assertion | Status | Fix hint |\n`
    md += `|--------|-----------|--------|----------|\n`
    for (const r of rows) {
      md += `| ${r.action} | ${r.label} | ${r.passed ? '✓' : '✗'} | ${r.fixHint || ''} |\n`
    }
    md += `\n`
  }

  writeFileSync(path, md)
  console.log(`\n📄 Report: ${path}`)
  return path
}
