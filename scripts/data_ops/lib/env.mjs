/**
 * Inline .env.local parser — no dotenv dependency needed.
 * Reads from project root (two directories above this file).
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
export const PRODUCTS_ROOT = resolve(PROJECT_ROOT, '..', 'Products')

export function loadEnv() {
  const envPath = resolve(PROJECT_ROOT, '.env.local')
  let raw
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch (e) {
    throw new Error(`Cannot read .env.local at ${envPath}\n  → ${e.message}`)
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !process.env[key]) process.env[key] = val
  }
}
