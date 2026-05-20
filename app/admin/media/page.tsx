import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { MediaLibrary } from './MediaLibrary'

export const metadata: Metadata = { title: 'Media' }
export const dynamic = 'force-dynamic'

const BUCKET = 'possah-media'

interface MediaFile {
  name:       string
  url:        string
  size:       number
  created_at: string
  fullPath:   string
}

async function getMediaFiles(): Promise<MediaFile[]> {
  try {
    const supabase = createServerClient()

    // List all files in the bucket root
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        limit:  500,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) {
      // Bucket may not exist yet — return empty, upload will create it
      console.warn('[Admin Media] Bucket list error (may not exist yet):', error.message)
      return []
    }

    return (data ?? [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(f.name)
        return {
          name:       f.metadata?.originalName ?? f.name,
          url:        publicUrl,
          size:       f.metadata?.size ?? 0,
          created_at: f.created_at ?? new Date().toISOString(),
          fullPath:   f.name,
        }
      })
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
          {files.length} file{files.length !== 1 ? 's' : ''} in Supabase Storage bucket{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', backgroundColor: 'var(--color-border)', padding: '1px 5px', borderRadius: '3px' }}>
            {BUCKET}
          </code>
          . Drag & drop or click to upload. Copy URL to use in product images, hero slides, etc.
        </p>
      </div>

      <MediaLibrary initialFiles={files} />
    </div>
  )
}
