import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const CategorySchema = z.object({
  name:        z.string().min(1, 'Name required').max(100),
  slug:        z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/),
  parent_id:   z.string().uuid().optional().nullable(),
  nav_section: z.string().max(100).optional().nullable(),
  hero_image_url: z.string().url().optional().nullable(),
  position:    z.number().int().min(0).optional(),
})

// GET /api/admin/categories — all categories
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:parent_id (id, name)')
      .order('position')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/categories — create category
export async function POST(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = CategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const data     = parsed.data
    const supabase = createServerClient()

    // Get max position for auto-ordering
    const { data: maxRow } = await supabase
      .from('categories')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const position = data.position ?? ((maxRow?.position ?? -1) + 1)

    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        name:           data.name,
        slug:           data.slug || slugify(data.name),
        parent_id:      data.parent_id ?? null,
        nav_section:    data.nav_section ?? null,
        hero_image_url: data.hero_image_url ?? null,
        position,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/categories — bulk reorder (array of { id, position })
export async function PATCH(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    const ReorderSchema = z.array(z.object({
      id:       z.string().uuid(),
      position: z.number().int().min(0),
    }))

    const parsed = ReorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reorder payload' }, { status: 422 })
    }

    const supabase = createServerClient()
    const updates  = parsed.data

    // Batch update positions
    const promises = updates.map(({ id, position }) =>
      supabase.from('categories').update({ position }).eq('id', id)
    )
    await Promise.all(promises)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
