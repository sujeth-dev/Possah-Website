import { readFileSync } from 'fs'
import { resolve } from 'path'

function parseEnvFile(filePath) {
  let text
  try { text = readFileSync(filePath, 'utf-8') } catch { return {} }
  const out = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val   = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

const root    = resolve(process.cwd())
const envBase = parseEnvFile(resolve(root, '.env'))
const envLocal = parseEnvFile(resolve(root, '.env.local'))

// process.env wins over file values (allows TEST_BASE_URL=... overrides)
export const env = { ...envBase, ...envLocal, ...process.env }
