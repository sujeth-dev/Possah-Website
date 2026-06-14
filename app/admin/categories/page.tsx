import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryManager } from './CategoryManager'

export const metadata: Metadata = { title: 'Categories' }
export const dynamic = 'force-dynamic'

interface CategoryRow {
  id: string
  name: string
  slug: string
  parent_id: string | null
  parent_name: string | null
  nav_section: string | null
  gender: string | null
  hero_image_url: string | null
  position: number
  product_count: number
}

async function getCategories(): Promise<CategoryRow[]> {
  try {
    const supabase = createAdminClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id, name, slug, parent_id, nav_section, gender, hero_image_url, position,
        parent:parent_id (name)
      `)
      .order('position')

    if (error) {
      console.error('[Admin Categories]', error)
      return []
    }

    // Get product counts per category
    const { data: counts } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true)

    const countMap: Record<string, number> = {}
    for (const p of counts ?? []) {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1
      }
    }

    return (categories ?? []).map((cat) => {
      const parent = Array.isArray(cat.parent) ? cat.parent[0] : cat.parent
      return {
        id:             cat.id,
        name:           cat.name,
        slug:           cat.slug,
        parent_id:      cat.parent_id,
        parent_name:    (parent as { name?: string } | null)?.name ?? null,
        nav_section:    cat.nav_section,
        gender:         (cat as unknown as { gender?: string | null }).gender ?? null,
        hero_image_url: cat.hero_image_url,
        position:       cat.position,
        product_count:  countMap[cat.id] ?? 0,
      }
    })
  } catch (err) {
    console.error('[Admin Categories] unexpected:', err)
    return []
  }
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--color-text)',
          }}
        >
          Categories
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {categories.length} categories. Drag to reorder.
        </p>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  )
}
