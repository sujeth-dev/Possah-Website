import type { Metadata } from 'next'
import { r2List, r2PublicUrl } from '@/lib/r2'
import { MediaLibrary } from './MediaLibrary'

export const metadata: Metadata = { title: 'Media' }
export const dynamic = 'force-dynamic'

const BUCKET = 'possah-media'
const SUBFOLDERS = ['products']

interface MediaFile {
  name:       string
  url:        string
  size:       number
  created_at: string
  fullPath:   string
  folder?:    string
}

async function listFolder(folder: string): Promise<MediaFile[]> {
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

async function getMediaFiles(): Promise<MediaFile[]> {
  try {
    const [rootFiles, ...subFiles] = await Promise.all([
      listFolder(''),
      ...SUBFOLDERS.map((f) => listFolder(f)),
    ])
    const all = [...rootFiles, ...subFiles.flat()]
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return all
  } catch (err) {
    console.error('[Admin Media] unexpected:', err)
    return []
  }
}

export default async function AdminMediaPage() {
  const files = await getMediaFiles()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          Media Library
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {files.length} file{files.length !== 1 ? 's' : ''} across all folders in{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', backgroundColor: 'var(--color-border)', padding: '1px 5px', borderRadius: '3px' }}>
            {BUCKET}
          </code>
          . Drag & drop or click to upload. Copy URL to use in products, hero slides, etc.
        </p>
      </div>

      <MediaLibrary initialFiles={files} />
    </div>
  )
}
