import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

const SettingsSchema = z.object({
  announcement_text:       z.string().max(300).optional(),
  store_email:             z.string().email().optional(),
  whatsapp_number:         z.string().max(20).optional(),
  free_shipping_threshold: z.number().int().min(0).optional(),
  express_delivery_fee:    z.number().int().min(0).optional(),
  seo_title:               z.string().max(70).optional(),
  seo_description:         z.string().max(160).optional(),
  seo_og_image:            z.string().url().optional().nullable(),
})

// GET /api/admin/settings
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Return defaults if no row
    if (!data) {
      return NextResponse.json({
        id:                      SETTINGS_ID,
        announcement_text:       'FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE',
        store_email:             '',
        whatsapp_number:         '',
        free_shipping_threshold: 5000,
        express_delivery_fee:    499,
        seo_title:               'The Possah — Luxury Indian Fashion',
        seo_description:         '',
        seo_og_image:            null,
      })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/settings
export async function PATCH(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = SettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const updates: Record<string, unknown> = { id: SETTINGS_ID }
    const d = parsed.data

    if (d.announcement_text       !== undefined) updates.announcement_text       = d.announcement_text
    if (d.store_email             !== undefined) updates.store_email             = d.store_email
    if (d.whatsapp_number         !== undefined) updates.whatsapp_number         = d.whatsapp_number
    if (d.free_shipping_threshold !== undefined) updates.free_shipping_threshold = d.free_shipping_threshold
    if (d.express_delivery_fee    !== undefined) updates.express_delivery_fee    = d.express_delivery_fee
    if (d.seo_title               !== undefined) updates.seo_title               = d.seo_title
    if (d.seo_description         !== undefined) updates.seo_description         = d.seo_description
    if (d.seo_og_image            !== undefined) updates.seo_og_image            = d.seo_og_image

    if (Object.keys(updates).length <= 1) return NextResponse.json({ ok: true })

    updates.updated_at = new Date().toISOString()

    const supabase = createServerClient()
    const { error } = await supabase
      .from('store_settings')
      .upsert(updates, { onConflict: 'id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
