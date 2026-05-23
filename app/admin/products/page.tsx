import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { ProductListActions } from './ProductListActions'

export const metadata: Metadata = { title: 'Products' }
export const dynamic = 'force-dynamic'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductRow {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  stock_qty: number
  is_active: boolean
  is_new_arrival: boolean
  created_at: string
  category_name: string | null
  category_slug: string | null
  thumbnail: string | null
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getProducts(search: string, page: number): Promise<{
  products: ProductRow[]
  total: number
}> {
  const perPage = 20
  const offset  = (page - 1) * perPage

  try {
    const supabase = createServerClient()

    let query = supabase
      .from('products')
      .select(`
        id, name, slug, price, compare_price, stock_qty, is_active, is_new_arrival, created_at,
        categories:category_id ( name, slug ),
        product_images ( url, position )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (search) query = query.ilike('name', `%${search}%`)

    const { data, count, error } = await query
    if (error) {
      console.error('[Admin Products list]', error)
      return { products: [], total: 0 }
    }

    const products: ProductRow[] = (data ?? []).map((p) => {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
      const imgs = (p.product_images as { url: string; position: number }[] | null) ?? []
      imgs.sort((a, b) => a.position - b.position)
      return {
        id:            p.id,
        name:          p.name,
        slug:          p.slug,
        price:         p.price,
        compare_price: p.compare_price,
        stock_qty:     p.stock_qty,
        is_active:     p.is_active,
        is_new_arrival: p.is_new_arrival,
        created_at:    p.created_at,
        category_name: (cat as { name?: string; slug?: string } | null)?.name ?? null,
        category_slug: (cat as { name?: string; slug?: string } | null)?.slug ?? null,
        thumbnail:     imgs[0]?.url ?? null,
      }
    })

    return { products, total: count ?? 0 }
  } catch (err) {
    console.error('[Admin Products list] unexpected:', err)
    return { products: [], total: 0 }
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const search = searchParams.search ?? ''
  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const { products, total } = await getProducts(search, page)
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--color-text)',
            }}
          >
            Products
          </h1>
          <p
            className="mt-0.5"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
            }}
          >
            {total} {total === 1 ? 'product' : 'products'} total
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-bg)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: '500',
            letterSpacing: '0.06em',
            textDecoration: 'none',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 1v10M1 6h10" />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth="1.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 h-10"
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-input)',
              backgroundColor: 'var(--color-white)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <button
          type="submit"
          className="px-4 h-10 hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-bg)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
        {search && (
          <Link
            href="/admin/products"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
            }}
            className="hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      {products.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <>
          <div className="overflow-x-auto rounded" style={{ border: '1px solid var(--color-border)' }}>
            <table className="w-full min-w-[700px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-border)' }}>
                  {['', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-muted)',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => (
                  <tr
                    key={product.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? 'var(--color-white)' : 'rgba(244,236,223,0.35)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Thumbnail */}
                    <td className="px-4 py-3 w-14">
                      <div
                        className="relative overflow-hidden rounded-sm flex-shrink-0"
                        style={{ width: 40, height: 50 }}
                      >
                        {product.thumbnail ? (
                          <Image
                            src={product.thumbnail}
                            alt={product.name}
                            fill
                            className="object-cover object-top"
                            sizes="40px"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-border)' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" aria-hidden="true">
                              <rect x="1" y="2" width="14" height="12" rx="1" />
                              <circle cx="5.5" cy="6" r="1.2" />
                              <path d="M1 10l4-3 3 2.5 2-1.5 5 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name + slug */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="hover:underline block"
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                          textDecoration: 'none',
                        }}
                      >
                        {product.name}
                        {product.is_new_arrival && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded-sm"
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '8px',
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              backgroundColor: 'var(--color-orange)',
                              color: 'var(--color-white)',
                            }}
                          >
                            New
                          </span>
                        )}
                      </Link>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {product.slug}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        {product.category_name ?? '—'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500', color: 'var(--color-text)' }}>
                        {formatPrice(product.price)}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>
                          {formatPrice(product.compare_price)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: product.stock_qty === 0
                            ? 'var(--color-error)'
                            : product.stock_qty <= 3
                            ? '#D97706'
                            : 'var(--color-text)',
                          fontWeight: product.stock_qty <= 3 ? '600' : '400',
                        }}
                      >
                        {product.stock_qty === 0 ? 'Out of stock' : `${product.stock_qty} units`}
                      </span>
                    </td>

                    {/* Status + toggle */}
                    <td className="px-4 py-3">
                      <ProductListActions
                        productId={product.id}
                        isActive={product.is_active}
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--color-green)',
                            textDecoration: 'none',
                            fontWeight: '500',
                          }}
                          className="hover:underline"
                        >
                          Edit
                        </Link>
                        {product.category_slug && (
                          <Link
                            href={`/shop/${product.category_slug}/${product.slug}`}
                            target="_blank"
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '12px',
                              color: 'var(--color-text-muted)',
                              textDecoration: 'none',
                            }}
                            className="hover:underline"
                          >
                            View ↗
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination current={page} total={totalPages} search={search} />
          )}
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded"
      style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-white)' }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--color-border)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 5S9 12 20 12 32 5 32 5L38 8.5 33 14v22H7V14L2 8.5z" />
      </svg>
      <p className="mt-4" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
        {search ? `No products matching "${search}"` : 'No products yet.'}
      </p>
      {!search && (
        <Link
          href="/admin/products/new"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-bg)',
            borderRadius: 'var(--radius-btn)',
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: '500',
            textDecoration: 'none',
          }}
        >
          Add your first product
        </Link>
      )}
    </div>
  )
}

function Pagination({ current, total, search }: { current: number; total: number; search: string }) {
  const searchQ = search ? `&search=${encodeURIComponent(search)}` : ''
  return (
    <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Page {current} of {total}
      </span>
      <div className="flex items-center gap-2">
        {current > 1 && (
          <Link
            href={`/admin/products?page=${current - 1}${searchQ}`}
            className="px-4 py-2 hover:opacity-80"
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-btn)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            ← Previous
          </Link>
        )}
        {current < total && (
          <Link
            href={`/admin/products?page=${current + 1}${searchQ}`}
            className="px-4 py-2 hover:opacity-80"
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-btn',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            Next →
          </Link>
        )}
      </div>
    </div>
  )
}
