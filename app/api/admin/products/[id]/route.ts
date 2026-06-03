import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductCreateSchema, type VariantInput, type ImageInput } from '@/lib/validations/admin-products'

// ─── GET /api/admin/products/[id] ─ single product with all relations ─────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (id, name, slug),
        product_images (id, url, alt, position),
        product_variants (id, colour_name, colour_hex, size, stock_qty),
        product_tags (id, tag)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[Admin Products GET/:id] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/products/[id] ─ partial update ─────────────────────────

const ProductUpdateSchema = ProductCreateSchema.partial()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = ProductUpdateSchema.safeParse(body)

    if (!parsed.success) {
      console.error('[Admin Products PATCH] validation issues:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const data = parsed.data
    const supabase = createAdminClient()

    // Check product exists
    const { data: existing, error: fetchErr } = await supabase
      .from('products')
      .select('id, slug, categories:category_id (slug)')
      .eq('id', params.id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check slug uniqueness if slug is being changed
    if (data.slug && data.slug !== existing.slug) {
      const { data: slugCheck } = await supabase
        .from('products')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', params.id)
        .maybeSingle()

      if (slugCheck) {
        return NextResponse.json(
          { error: 'Validation failed', issues: { slug: ['Slug already exists.'] } },
          { status: 422 }
        )
      }
    }

    // Build update object — only include fields that were sent
    const updateFields: Record<string, unknown> = {}
    const scalarFields = [
      'name', 'slug', 'description', 'sub_line', 'category_id',
      'price', 'compare_price', 'fabric', 'craft_description',
      'care_instructions', 'drape_guide', 'craft_story_title',
      'craft_story_body', 'craft_story_image', 'audio_url',
      'meta_title', 'meta_description', 'is_new_arrival',
      'is_top_selling', 'is_featured', 'is_festive', 'is_bridal', 'is_active',
    ] as const

    for (const field of scalarFields) {
      if (field in data) {
        updateFields[field] = data[field as keyof typeof data] ?? null
      }
    }

    // Recalculate stock_qty from variants if provided
    if (data.variants) {
      updateFields.stock_qty = data.variants.reduce((sum: number, v: VariantInput) => sum + v.stock_qty, 0)
    }

    if (Object.keys(updateFields).length > 0) {
      const { error: updateErr } = await supabase
        .from('products')
        .update(updateFields)
        .eq('id', params.id)

      if (updateErr) {
        console.error('[Admin Products PATCH] update:', updateErr)
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
    }

    // Replace tags if provided
    if (data.tags !== undefined) {
      await supabase.from('product_tags').delete().eq('product_id', params.id)
      if (data.tags.length > 0) {
        await supabase.from('product_tags').insert(
          data.tags.map((tag: string) => ({ product_id: params.id, tag }))
        )
      }
    }

    // Replace variants if provided
    if (data.variants !== undefined) {
      await supabase.from('product_variants').delete().eq('product_id', params.id)
      if (data.variants.length > 0) {
        await supabase.from('product_variants').insert(
          data.variants.map((v: VariantInput) => ({
            product_id:  params.id,
            colour_name: v.colour_name,
            colour_hex:  v.colour_hex,
            size:        v.size,
            stock_qty:   v.stock_qty,
          }))
        )
      }
    }

    // Replace images if provided
    if (data.images !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', params.id)
      if (data.images.length > 0) {
        await supabase.from('product_images').insert(
          data.images.map((img: ImageInput, idx: number) => ({
            product_id: params.id,
            url:        img.url,
            alt:        img.alt ?? null,
            position:   img.position ?? idx,
          }))
        )
      }
    }

    // Bust ISR cache so shop pages reflect changes immediately
    const finalSlug = (data.slug ?? existing.slug) as string
    const catSlug   = (existing.categories as { slug?: string } | null)?.slug
    revalidatePath('/', 'layout')
    revalidatePath('/festive')
    revalidatePath('/bridal')
    if (catSlug) {
      revalidatePath(`/shop/${catSlug}`)
      revalidatePath(`/shop/${catSlug}/${finalSlug}`)
    }

    return NextResponse.json({ id: params.id, ok: true })
  } catch (err) {
    console.error('[Admin Products PATCH] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/products/[id] ─ soft delete (set is_active=false) ─────

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    // Soft delete — never hard delete products (orders reference them)
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) {
      console.error('[Admin Products DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Bust ISR — deactivated product must disappear from shop
    revalidatePath('/', 'layout')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Admin Products DELETE] unexpected:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
