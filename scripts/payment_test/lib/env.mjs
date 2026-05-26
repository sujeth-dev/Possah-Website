import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  let raw
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch {
    console.error('[env] FATAL: .env.local not found. Run from project root.')
    process.exit(1)
  }

  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = val
  }

  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
  ]

  const missing = required.filter(k => !env[k])
  if (missing.length) {
    console.error('[env] FATAL: Missing env vars:', missing.join(', '))
    process.exit(1)
  }

  return env
}

export const ENV = loadEnv()
