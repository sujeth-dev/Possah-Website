import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

const CategoryUpdateSchema = z.object({
  name:           z.string().min(1).max(100).optional(),
  slug:           z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  parent_id:      z.string().uuid().optional().nullable(),
  nav_section:    z.string().max(100).optional().nullable(),
  hero_image_url: z.string().url().optional().nullable(),
  position:       z.number().int().min(0).optional(),
})

// PATCH /api/admin/categories/[id] — update category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = CategoryUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const data     = parsed.data
    const supabase = createAdminClient()

    const updateFields: Record<string, unknown> = {}
    if (data.name !== undefined)           updateFields.name           = data.name
    if (data.slug !== undefined)           updateFields.slug           = data.slug
    if (data.parent_id !== undefined)      updateFields.parent_id      = data.parent_id
    if (data.nav_section !== undefined)    updateFields.nav_section    = data.nav_section
    if (data.hero_image_url !== undefined) updateFields.hero_image_url = data.hero_image_url
    if (data.position !== undefined)       updateFields.position       = data.position

    // Auto-slug if name changed but slug not explicitly set
    if (data.name && !data.slug) {
      updateFields.slug = slugify(data.name)
    }

    const { error } = await supabase
      .from('categories')
      .update(updateFields)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/categories/[id] — hard delete (warn if products linked)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()

    // Check for linked products
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', params.id)
      .eq('is_active', true)

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: `This category has ${count} active product(s). Move or deactivate them first.` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
