import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MEDIA_BUCKET = 'possah-media'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return (
    cookie.includes('next-auth.session-token') ||
    cookie.includes('__Secure-next-auth.session-token')
  )
}

// ─── DELETE /api/admin/media/delete ──────────────────────────────────────────
// Body: { paths: string[] }  — storage paths relative to bucket root
// Returns: { deleted: string[], ok: true }

export async function DELETE(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { paths?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const paths = body.paths
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: 'paths array required' }, { status: 400 })
  }

  const validPaths = paths.filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
  if (validPaths.length === 0) {
    return NextResponse.json({ error: 'No valid paths provided' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove(validPaths)

    if (error) {
      console.error('[media/delete]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: data?.map((f) => f.name) ?? [], ok: true })
  } catch (err) {
    console.error('[media/delete] unexpected:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
