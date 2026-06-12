import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { r2List, r2PublicUrl } from '@/lib/r2'

// Subfolders to scan in addition to root
const SUBFOLDERS = ['products', 'uploads']

// ─── GET /api/admin/media/list ────────────────────────────────────────────────
// Returns all files from bucket root + known subfolders, merged and sorted newest first.
// Shape: { files: MediaFile[] }
// MediaFile: { name, url, size, created_at, fullPath, folder? }

export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    async function listFolder(folder: string) {
      const prefix = folder ? `${folder}/` : ''
      const objects = await r2List(prefix)
      return objects.map((obj) => {
        const key = obj.Key!
        return {
          name:       key.split('/').pop()!,
          url:        r2PublicUrl(key),
          size:       obj.Size ?? 0,
          created_at: obj.LastModified?.toISOString() ?? new Date().toISOString(),
          fullPath:   key,
          folder:     folder || undefined,
        }
      })
    }

    // List root + all subfolders in parallel
    const [rootFiles, ...subFiles] = await Promise.all([
      listFolder(''),
      ...SUBFOLDERS.map((f) => listFolder(f)),
    ])

    const allFiles = [...rootFiles, ...subFiles.flat()]
    allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ files: allFiles })
  } catch (err) {
    console.error('[media/list] unexpected:', err)
    return NextResponse.json({ error: 'Failed to list media' }, { status: 500 })
  }
}
