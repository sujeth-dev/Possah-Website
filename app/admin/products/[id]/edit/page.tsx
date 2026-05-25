import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductForm, type ProductFormData } from '../../ProductForm'

export const metadata: Metadata = { title: 'Edit Product' }
export const dynamic = 'force-dynamic'

async function getProductAndCategories(id: string) {
  try {
    const supabase = createAdminClient()

    const [productRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          product_images (id, url, alt, position),
          product_variants (id, colour_name, colour_hex, size, stock_qty),
          product_tags (id, tag)
        `)
        .eq('id', id)
        .single(),

      supabase
        .from('categories')
        .select('id, name, slug')
        .order('name'),
    ])

    if (productRes.error) {
      if (productRes.error.code === 'PGRST116') return null
      console.error('[Admin Products Edit] fetch:', productRes.error)
      return null
    }

    return {
      product: productRes.data,
      categories: categoriesRes.data ?? [],
    }
  } catch {
    return null
  }
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getProductAndCategories(params.id)

  if (!result) notFound()

  const { product, categories } = result

  // Shape product data into ProductFormData
  const images = (product.product_images as {
    id: string; url: string; alt: string | null; position: number
  }[] | null ?? [])
  images.sort((a, b) => a.position - b.position)

  const initialData: Partial<ProductFormData> = {
    id:                product.id,
    name:              product.name,
    slug:              product.slug,
    description:       product.description ?? '',
    sub_line:          product.sub_line ?? '',
    category_id:       product.category_id ?? '',
    price:             product.price,
    compare_price:     product.compare_price ?? null,
    fabric:            product.fabric ?? '',
    craft_description: product.craft_description ?? '',
    care_instructions: product.care_instructions ?? '',
    drape_guide:       product.drape_guide ?? '',
    craft_story_title: product.craft_story_title ?? '',
    craft_story_body:  product.craft_story_body ?? '',
    craft_story_image: product.craft_story_image ?? '',
    audio_url:         product.audio_url ?? '',
    meta_title:        product.meta_title ?? '',
    meta_description:  product.meta_description ?? '',
    is_new_arrival:    product.is_new_arrival,
    is_top_selling:    product.is_top_selling,
    is_featured:       product.is_featured,
    is_active:         product.is_active,
    tags: (product.product_tags as { tag: string }[] | null ?? []).map((t) => t.tag) as ProductFormData['tags'],
    variants: (product.product_variants as {
      id: string; colour_name: string; colour_hex: string; size: string; stock_qty: number
    }[] | null ?? []),
    images: images.map((img) => ({
      id:       img.id,
      url:      img.url,
      alt:      img.alt ?? '',
      position: img.position,
    })),
  }

  return (
    <div>
      {/* Breadcrumb header */}
      <div
        className="px-6 md:px-8 py-4 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)' }}
      >
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
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--color-text)',
          }}
          className="truncate max-w-[200px]"
        >
          {product.name}
        </span>
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Edit
        </span>
      </div>

      <ProductForm
        initialData={initialData}
        categories={categories}
        mode="edit"
      />
    </div>
  )
}
