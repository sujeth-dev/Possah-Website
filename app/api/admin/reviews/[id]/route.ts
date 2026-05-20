import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

// PATCH /api/admin/reviews/[id] — approve or reject single
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    if (typeof body.is_approved !== 'boolean') {
      return NextResponse.json({ error: 'is_approved (boolean) required' }, { status: 422 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: body.is_approved })
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/reviews/[id] — hard delete
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
    const { error } = await supabase.from('reviews').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
