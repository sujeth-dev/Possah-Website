import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ProductForm } from '../ProductForm'

export const metadata: Metadata = { title: 'Add Product' }
export const dynamic = 'force-dynamic'

async function getCategories() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')

    if (error) {
      console.error('[Admin Products New] categories:', error)
      return []
    }
    return data ?? []
  } catch {
    return []
  }
}

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div>
      {/* Breadcrumb header */}
      <div
        className="px-6 md:px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)' }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
            }}
            className="hover:underline"
          >
            Products
          </Link>
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500', color: 'var(--color-text)' }}>
            Add Product
          </span>
        </div>
      </div>

      <ProductForm
        categories={categories}
        mode="new"
      />
    </div>
  )
}
