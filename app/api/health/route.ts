// FIX-INFRA-02: Health check endpoint
// Used by Vercel health checks and uptime monitors.
// Returns 200 + {"status":"ok"} when DB is reachable.
// Returns 503 + {"status":"error"} when DB is unreachable.

import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    const supabase = createPublicClient()
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows — acceptable, DB is still up
      return NextResponse.json(
        {
          status: 'degraded',
          db: 'error',
          error: error.message,
          latency_ms: Date.now() - start,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      latency_ms: Date.now() - start,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        db: 'unreachable',
        latency_ms: Date.now() - start,
        error: err instanceof Error ? err.message : 'unknown',
      },
      { status: 503 }
    )
  }
}
