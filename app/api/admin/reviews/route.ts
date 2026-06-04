import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/admin/reviews?status=pending|approved|all
export async function GET(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? 'all'

    const supabase = createAdminClient()
    let query = supabase
      .from('reviews')
      .select(`
        *,
        product:product_id ( id, name, slug )
      `)
      .order('created_at', { ascending: false })

    if (status === 'pending')  query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/reviews — bulk approve
export async function PATCH(request: NextRequest) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const BulkSchema = z.object({
      ids:         z.array(z.string().uuid()).min(1),
      is_approved: z.boolean(),
    })

    const parsed = BulkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: parsed.data.is_approved })
      .in('id', parsed.data.ids)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
