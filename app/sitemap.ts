import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'

const BASE_URL = 'https://thepossah.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE_URL,                            priority: 1.0,  changeFrequency: 'daily'   },
  { url: `${BASE_URL}/about`,                 priority: 0.7,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/bridal`,                priority: 0.8,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/festive`,               priority: 0.8,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/made-to-measure`,       priority: 0.8,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/lookbook`,              priority: 0.7,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/journal`,               priority: 0.7,  changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/contact`,               priority: 0.5,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/faq`,                   priority: 0.5,  changeFrequency: 'monthly' },
  { url: `${BASE_URL}/size-guide`,            priority: 0.5,  changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient()

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('slug')

  const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE_URL}/shop/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
    priority: 0.9,
    changeFrequency: 'daily' as const,
  }))

  // Products
  const { data: products } = await supabase
    .from('products')
    .select(`
      slug, updated_at,
      categories (slug)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => {
    const categorySlug = ((p.categories as unknown) as { slug: string } | null)?.slug ?? 'sarees'
    return {
      url: `${BASE_URL}/shop/${categorySlug}/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    }
  })

  // Journal articles
  const { data: articles } = await supabase
    .from('journal_articles')
    .select('slug, published_at')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${BASE_URL}/journal/${a.slug}`,
    lastModified: a.published_at ? new Date(a.published_at) : undefined,
    priority: 0.6,
    changeFrequency: 'monthly' as const,
  }))

  return [...STATIC_ROUTES, ...categoryRoutes, ...productRoutes, ...articleRoutes]
}
