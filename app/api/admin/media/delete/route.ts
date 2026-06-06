import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { r2Delete } from '@/lib/r2'

// ─── DELETE /api/admin/media/delete ──────────────────────────────────────────
// Body: { paths: string[] }  — storage paths relative to bucket root
// Returns: { deleted: string[], ok: true }

export async function DELETE(request: NextRequest) {
  if (!await requireAdminAuth(request)) {
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
    await r2Delete(validPaths)
    return NextResponse.json({ deleted: validPaths, ok: true })
  } catch (err) {
    console.error('[media/delete] unexpected:', err)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
