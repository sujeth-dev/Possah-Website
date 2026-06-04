import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

const ArticleUpdateSchema = z.object({
  title:          z.string().min(1).max(200).optional(),
  slug:           z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  category:       z.enum(['Style', 'Craft', 'Culture', 'Women', 'Occasions', 'Behind the Scenes', 'Inspiration']).optional(),
  author:         z.string().min(1).max(100).optional(),
  featured_image: z.string().url().optional().nullable(),
  body:           z.string().optional().nullable(),
  is_featured:    z.boolean().optional(),
  published_at:   z.string().datetime({ offset: true }).optional().nullable(),
})

// GET /api/admin/journal/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('journal_articles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/journal/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = ArticleUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const d = parsed.data
    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    if (d.title          !== undefined) updates.title          = d.title
    if (d.slug           !== undefined) updates.slug           = d.slug
    if (d.category       !== undefined) updates.category       = d.category
    if (d.author         !== undefined) updates.author         = d.author
    if (d.featured_image !== undefined) updates.featured_image = d.featured_image
    if (d.body           !== undefined) updates.body           = d.body
    if (d.is_featured    !== undefined) updates.is_featured    = d.is_featured
    if (d.published_at   !== undefined) updates.published_at   = d.published_at

    // Auto-slug if title changed without explicit slug
    if (d.title && !d.slug) updates.slug = slugify(d.title)

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

    const { error } = await supabase.from('journal_articles').update(updates).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/journal', 'layout')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/journal/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('journal_articles').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/journal', 'layout')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
