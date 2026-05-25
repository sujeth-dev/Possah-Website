import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MEDIA_BUCKET = 'possah-media'
// Subfolders to scan in addition to root
const SUBFOLDERS = ['products']

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return (
    cookie.includes('next-auth.session-token') ||
    cookie.includes('__Secure-next-auth.session-token')
  )
}

// ─── GET /api/admin/media/list ────────────────────────────────────────────────
// Returns all files from bucket root + known subfolders, merged and sorted newest first.
// Shape: { files: MediaFile[] }
// MediaFile: { name, url, size, created_at, fullPath, folder? }

export async function GET(request: Request) {
  if (!requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    async function listFolder(folder: string) {
      const prefix = folder === '' ? '' : folder
      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .list(prefix, { limit: 500, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })

      if (error) {
        console.warn(`[media/list] folder="${folder}" error:`, error.message)
        return []
      }

      return (data ?? [])
        .filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.endsWith('/'))
        .map(f => {
          const storagePath = folder ? `${folder}/${f.name}` : f.name
          const { data: { publicUrl } } = supabase.storage
            .from(MEDIA_BUCKET)
            .getPublicUrl(storagePath)
          return {
            name:       f.metadata?.originalName ?? f.name,
            url:        publicUrl,
            size:       f.metadata?.size ?? 0,
            created_at: f.created_at ?? new Date().toISOString(),
            fullPath:   storagePath,
            folder:     folder || undefined,
          }
        })
    }

    // List root + all subfolders in parallel
    const [rootFiles, ...subFiles] = await Promise.all([
      listFolder(''),
      ...SUBFOLDERS.map(f => listFolder(f)),
    ])

    const allFiles = [...rootFiles, ...subFiles.flat()]
    // Sort newest first across all folders
    allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ files: allFiles })
  } catch (err) {
    console.error('[media/list] unexpected:', err)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}
