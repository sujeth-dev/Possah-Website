import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/public'

export const revalidate = 3600

const VALID_GENDERS = ['women', 'men', 'kids', 'unisex']

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('slug, categories(slug, gender)')
    .eq('is_active', true)
  return (data ?? []).map((p) => {
    const cat = (p.categories as unknown) as { slug: string; gender: string } | null
    return {
      gender:   cat?.gender   ?? 'women',
      category: cat?.slug     ?? 'uncategorised',
      slug:     p.slug,
    }
  })
}

import { formatPrice, isImageUrl } from '@/lib/utils'
import { ProductGallery } from '@/components/pdp/ProductGallery'
import { ProductInfo } from '@/components/pdp/ProductInfo'
import { CraftBehind } from '@/components/pdp/CraftBehind'
import { CompleteTheLook } from '@/components/pdp/CompleteTheLook'
import { ReviewsSection } from '@/components/pdp/ReviewsSection'
import { YouMightAlsoLike } from '@/components/shop/YouMightAlsoLike'
import type { ProductCardData } from '@/app/(shop)/page'

void formatPrice

interface PageProps {
  params: { gender: string; category: string; slug: string }
}

async function getProductData(slug: string) {
  try {
    const supabase = createPublicClient()

    const { data: product } = await supabase
      .from('products')
      .select(`
        id, slug, name, fabric, description, care_instructions,
        drape_guide, craft_story_body, craft_story_image,
        price, compare_price, is_new_arrival, is_top_selling,
        is_active, audio_url, sub_line, category_id,
        meta_title, meta_description,
        categories (slug, name, gender),
        product_images (url, alt, position),
        product_tags (tag)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!product) return null

    const [
      { data: variants },
      { data: reviews },
      { data: categoryProducts },
      { data: related },
    ] = await Promise.all([
      supabase
        .from('product_variants')
        .select('id, colour_name, colour_hex, size, stock_qty')
        .eq('product_id', product.id)
        .gt('stock_qty', 0)
        .order('colour_name')
        .order('size'),
      supabase
        .from('reviews')
        .select('id, reviewer_name, rating, body, created_at')
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('products')
        .select(`
          id, slug, name, fabric, price, compare_price,
          is_new_arrival, is_top_selling,
          categories (slug, gender),
          product_images (url, alt, position),
          product_tags (tag)
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .neq('id', product.id)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('products')
        .select(`
          id, slug, name, fabric, price, compare_price,
          is_new_arrival, is_top_selling,
          categories (slug, gender),
          product_images (url, alt, position),
          product_tags (tag)
        `)
        .eq('is_active', true)
        .neq('category_id', product.category_id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const catInfo = (product.categories as unknown) as { slug: string; name: string; gender: string } | null
    const categorySlug   = catInfo?.slug   ?? ''
    const categoryName   = catInfo?.name   ?? ''
    const categoryGender = catInfo?.gender ?? 'women'

    const mapProductCard = (raw: typeof categoryProducts): ProductCardData[] =>
      (raw ?? []).map((p) => ({
        id: p.id,
        slug: p.slug,
        category_slug:   ((p.categories as unknown) as { slug: string; gender: string } | null)?.slug   ?? categorySlug,
        category_gender: ((p.categories as unknown) as { slug: string; gender: string } | null)?.gender ?? categoryGender,
        name: p.name,
        fabric: p.fabric,
        price: p.price,
        compare_price: p.compare_price ?? null,
        is_new_arrival: p.is_new_arrival,
        is_top_selling: p.is_top_selling,
        images: ((p.product_images as { url: string; alt: string | null; position: number }[]) ?? [])
          .sort((a, b) => a.position - b.position)
          .map((img) => ({ url: img.url, alt: img.alt })),
        tags: ((p.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
      }))

    const sortedImages = ((product.product_images as { url: string; alt: string | null; position: number }[]) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ url: img.url, alt: img.alt }))

    const reviewList = (reviews ?? []) as {
      id: string
      reviewer_name: string
      rating: number
      body: string
      created_at: string
    }[]

    const avgRating = reviewList.length > 0
      ? reviewList.reduce((sum, r) => sum + r.rating, 0) / reviewList.length
      : 0

    return {
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        fabric: product.fabric,
        description: product.description,
        meta_title: product.meta_title ?? null,
        meta_description: product.meta_description ?? null,
        care_instructions: product.care_instructions,
        drape_guide: product.drape_guide,
        craft_story_body: product.craft_story_body,
        craft_story_image: product.craft_story_image,
        price: product.price,
        compare_price: product.compare_price ?? null,
        is_new_arrival: product.is_new_arrival,
        is_top_selling: product.is_top_selling,
        audio_url: product.audio_url,
        sub_line: product.sub_line,
        category_slug: categorySlug,
        category_gender: categoryGender,
        images: sortedImages,
        tags: ((product.product_tags as { tag: string }[]) ?? []).map((t) => t.tag),
      },
      categoryName,
      categoryGender,
      variants: (variants ?? []).map((v) => ({
        id: v.id,
        colour: v.colour_name,
        colour_hex: v.colour_hex,
        size: v.size,
        stock_qty: v.stock_qty,
      })),
      reviews: reviewList,
      avgRating,
      categoryProducts: mapProductCard(categoryProducts),
      relatedProducts: mapProductCard(related),
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getProductData(params.slug)
  if (!data) return { title: 'Product Not Found', robots: { index: false } }
  const { product, categoryName } = data
  const firstImage = product.images[0]?.url
  const title = product.meta_title || product.name
  const description = product.meta_description
    || product.description
    || `${product.name} — ${product.fabric ?? categoryName} at The Possah. Handcrafted luxury Indian fashion.`
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: `https://thepossah.com/${params.gender}/${product.category_slug}/${product.slug}` },
    openGraph: {
      type: 'product',
      title,
      description: description.slice(0, 160),
      ...(firstImage && { images: [{ url: firstImage, width: 1200, height: 630, alt: product.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
      ...(firstImage && { images: [firstImage] }),
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  if (!VALID_GENDERS.includes(params.gender)) notFound()

  const data = await getProductData(params.slug)
  if (!data) notFound()

  const { product, categoryName, variants, reviews, avgRating, categoryProducts, relatedProducts } = data

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((img) => img.url),
    sku: product.id,
    brand: { '@type': 'Brand', name: 'The Possah' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: variants.length > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://thepossah.com/${params.gender}/${product.category_slug}/${product.slug}`,
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',                                    item: 'https://thepossah.com' },
      { '@type': 'ListItem', position: 2, name: params.gender.charAt(0).toUpperCase() + params.gender.slice(1), item: `https://thepossah.com/${params.gender}` },
      { '@type': 'ListItem', position: 3, name: categoryName,                               item: `https://thepossah.com/${params.gender}/${product.category_slug}` },
      { '@type': 'ListItem', position: 4, name: product.name,                               item: `https://thepossah.com/${params.gender}/${product.category_slug}/${product.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="container-site py-3">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 flex-wrap"
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <li><Link href="/" className="hover:opacity-70">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/${params.gender}`} className="hover:opacity-70" style={{ textTransform: 'capitalize' }}>{params.gender}</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href={`/${params.gender}/${product.category_slug}`} className="hover:opacity-70">{categoryName}</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" style={{ color: 'var(--color-text)' }}>{product.name}</li>
          </ol>
        </nav>
      </div>

      {/* PDP grid */}
      <div className="container-site pb-20">
        <div className="grid md:grid-cols-[1fr_480px] lg:grid-cols-[1fr_520px] gap-10 lg:gap-16 xl:gap-20">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductInfo product={product} variants={variants} />
        </div>
      </div>

      {product.craft_story_body && (
        <CraftBehind
          craftStory={product.craft_story_body}
          imageUrl={isImageUrl(product.craft_story_image) ? product.craft_story_image : product.images[1]?.url}
          productName={product.name}
        />
      )}

      <CompleteTheLook products={categoryProducts} />

      {reviews.length > 0 && (
        <ReviewsSection reviews={reviews} averageRating={avgRating} totalCount={reviews.length} />
      )}

      <YouMightAlsoLike products={relatedProducts} heading="You might also like" />
    </>
  )
}
