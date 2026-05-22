import { env } from './env.mjs'

export const BASE_URL = env.TEST_BASE_URL ?? 'http://localhost:3000'
const TIMEOUT_MS = 12_000

/**
 * Thin fetch wrapper.
 * Returns { status, data, headers, ok, raw }
 * Never throws on non-2xx — callers assert on .status.
 * Throws only on network failure / timeout.
 */
export async function api(method, path, body) {
  const url        = `${BASE_URL}${path}`
  const controller = new AbortController()
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }
    if (body !== undefined) opts.body = JSON.stringify(body)

    const res = await fetch(url, opts)
    const ct  = res.headers.get('content-type') ?? ''

    let data
    if (ct.includes('application/json')) {
      data = await res.json().catch(() => null)
    } else {
      data = await res.text()
    }

    return { status: res.status, data, headers: res.headers, ok: res.ok }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `[http] Timeout (${TIMEOUT_MS}ms): ${method} ${url}\n` +
        `  → Is the dev server running?\n` +
        `  → Run:  NODE_ENV=development npm run dev`
      )
    }
    throw new Error(`[http] Network error: ${err.message}\n  URL: ${method} ${url}`)
  } finally {
    clearTimeout(timer)
  }
}
