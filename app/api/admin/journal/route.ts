import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const ArticleSchema = z.object({
  title:          z.string().min(1).max(200),
  slug:           z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  category:       z.enum(['Style', 'Craft', 'Culture', 'Women', 'Occasions', 'Behind the Scenes', 'Inspiration']),
  author:         z.string().min(1).max(100),
  featured_image: z.string().url().optional().nullable(),
  body:           z.string().optional().nullable(),
  is_featured:    z.boolean().default(false),
  published_at:   z.string().datetime({ offset: true }).optional().nullable(),
})

type ArticleInput = z.infer<typeof ArticleSchema>

// GET /api/admin/journal
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('journal_articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/journal
export async function POST(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = ArticleSchema.safeParse({
      ...body,
      slug: body.slug || slugify(body.title ?? ''),
    })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const supabase = createServerClient()

    // Slug uniqueness check
    const { count } = await supabase
      .from('journal_articles')
      .select('id', { count: 'exact', head: true })
      .eq('slug', parsed.data.slug)

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Slug already exists. Choose a different title or edit the slug.' }, { status: 409 })
    }

    const { data: created, error } = await supabase
      .from('journal_articles')
      .insert({
        title:          parsed.data.title,
        slug:           parsed.data.slug,
        category:       parsed.data.category,
        author:         parsed.data.author,
        featured_image: parsed.data.featured_image ?? null,
        body:           parsed.data.body ?? null,
        is_featured:    parsed.data.is_featured,
        published_at:   parsed.data.published_at ?? null,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
