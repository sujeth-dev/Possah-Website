import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const HeroSlideSchema = z.object({
  image_url:    z.string().url(),
  headline:     z.string().max(120),
  sub_headline: z.string().max(200).optional().nullable(),
  cta_label:    z.string().max(50),
  cta_link:     z.string().max(200),
})

const CollectionBannerSchema = z.object({
  image_url: z.string().url(),
  headline:  z.string().max(120),
  subtitle:  z.string().max(200).optional().nullable(),
  cta_label: z.string().max(50).optional().nullable(),
  cta_link:  z.string().max(200),
})

const OccasionTileSchema = z.object({
  image_url: z.string().url().optional().nullable(),
  label:     z.string().max(60),
  link:      z.string().max(200),
})

const CategorySplitSchema = z.object({
  ethnic_image:  z.string().url().optional().nullable(),
  western_image: z.string().url().optional().nullable(),
})

const CategoryCirclesSchema = z.object({
  sarees:     z.string().url().optional().nullable(),
  lehengas:   z.string().url().optional().nullable(),
  co_ords:    z.string().url().optional().nullable(),
  dresses:    z.string().url().optional().nullable(),
  kurta_sets: z.string().url().optional().nullable(),
  tops:       z.string().url().optional().nullable(),
})

const MtmCtaSchema = z.object({
  image_url: z.string().url().optional().nullable(),
})

const PageHeroesSchema = z.object({
  women_hub_hero:    z.string().url().optional().nullable(),
  new_in_hero:       z.string().url().optional().nullable(),
  best_sellers_hero: z.string().url().optional().nullable(),
  festive_hero:      z.string().url().optional().nullable(),
  bridal_hero:       z.string().url().optional().nullable(),
})

const HomepageUpdateSchema = z.object({
  hero_slides:       z.array(HeroSlideSchema).optional(),
  collection_banner: z.union([CollectionBannerSchema, z.null(), z.record(z.unknown())]).optional(),
  new_arrival_ids:   z.array(z.string().uuid()).optional(),
  occasion_tiles:    z.array(OccasionTileSchema).length(8).optional(),
  category_split:    z.union([CategorySplitSchema, z.null(), z.record(z.unknown())]).optional(),
  category_circles:  z.union([CategoryCirclesSchema, z.null(), z.record(z.unknown())]).optional(),
  mtm_cta:           z.union([MtmCtaSchema, z.null(), z.record(z.unknown())]).optional(),
  page_heroes:       z.union([PageHeroesSchema, z.null(), z.record(z.unknown())]).optional(),
})

const SINGLETON_ID = '00000000-0000-0000-0000-000000000001'

// GET /api/admin/homepage — fetch config
export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('homepage_config')
      .select('*')
      .eq('id', SINGLETON_ID)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If no row yet, return defaults
    if (!data) {
      return NextResponse.json({
        hero_slides:       [],
        collection_banner: null,
        new_arrival_ids:   [],
        occasion_tiles:    Array.from({ length: 8 }, (_, i) => ({ image_url: null, label: `Occasion ${i + 1}`, link: '/shop' })),
      })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/homepage — update config
export async function PATCH(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = HomepageUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    if (parsed.data.hero_slides       !== undefined) updates.hero_slides       = parsed.data.hero_slides
    if (parsed.data.collection_banner !== undefined) updates.collection_banner = parsed.data.collection_banner ?? {}
    if (parsed.data.new_arrival_ids   !== undefined) updates.new_arrival_ids   = parsed.data.new_arrival_ids
    if (parsed.data.occasion_tiles    !== undefined) updates.occasion_tiles    = parsed.data.occasion_tiles
    if (parsed.data.category_split    !== undefined) updates.category_split    = parsed.data.category_split    ?? {}
    if (parsed.data.category_circles  !== undefined) updates.category_circles  = parsed.data.category_circles  ?? {}
    if (parsed.data.mtm_cta           !== undefined) updates.mtm_cta           = parsed.data.mtm_cta           ?? {}
    if (parsed.data.page_heroes       !== undefined) updates.page_heroes       = parsed.data.page_heroes       ?? {}

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

    // Upsert the singleton row
    const { error } = await supabase
      .from('homepage_config')
      .upsert({ id: SINGLETON_ID, ...updates }, { onConflict: 'id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/', 'layout')
    revalidatePath('/journal', 'layout')
    revalidatePath('/festive', 'page')
    revalidatePath('/bridal', 'page')
    revalidatePath('/new-in', 'page')
    revalidatePath('/best-sellers', 'page')
    revalidatePath('/women', 'page')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
