import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

const MEDIA_BUCKET = 'possah-media'

// Service-role client — bypasses RLS. Never expose this key to the browser.
function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ─── POST /api/admin/upload ────────────────────────────────────────────────
// Accepts: multipart/form-data with fields:
//   file     — the image File
//   path     — storage path, e.g. "products/1234567890-0-photo.webp"
//
// Returns: { publicUrl: string }

export async function POST(request: NextRequest) {
  if (!await requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const path = formData.get('path')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (typeof path !== 'string' || !path.trim()) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 })
  }

  // 10 MB guard
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
  }

  const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  try {
    const supabase = serviceClient()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: upErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (upErr) {
      console.error('[upload route]', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path)

    return NextResponse.json({ publicUrl })
  } catch (err) {
    console.error('[upload route] unexpected:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
