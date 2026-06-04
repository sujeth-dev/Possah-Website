import type { Metadata } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { HeroSlider } from '@/components/homepage/HeroSlider'
import { CategorySplit } from '@/components/homepage/CategorySplit'
import { CategoryCircles } from '@/components/homepage/CategoryCircles'
import { NewArrivals } from '@/components/homepage/NewArrivals'
import { CollectionBanner } from '@/components/homepage/CollectionBanner'
import { OccasionGrid } from '@/components/homepage/OccasionGrid'
import { MtmCta } from '@/components/homepage/MtmCta'
import { parseJson } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'The Possah — she wants what she wants.',
  description:
    'Luxury Indian fashion. Handcrafted sarees, lehengas, co-ord sets. Made to fit you. Not for trends — for you.',
}

// Fallback data in case DB isn't seeded yet
const FALLBACK_HERO_SLIDES = [
  {
    id: 'slide-1',
    image: 'https://placehold.co/1440x820/1F3A2D/F4ECDF.png?text=The+Possah',
    headline: 'she wants what she wants.',
    subheadline: 'Couture, off-duty. Spring \'26',
    ctaLabel: 'Shop the Collection',
    ctaLink: '/shop/sarees',
  },
]

const FALLBACK_COLLECTION_BANNER = {
  image: 'https://placehold.co/1440x580/1F3A2D/F4ECDF.png?text=Collection',
  headline: 'Chapter 04: Veil',
  subtitle: 'The Spring Collection',
  ctaLabel: 'Shop the Collection',
  ctaLink: '/lookbook/spring-26',
}

const FALLBACK_OCCASION_TILES = [
  { id: 'everyday', label: 'EVERYDAY', image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Everyday', link: '/shop/sarees?occasion=Everyday' },
  { id: 'brunch',   label: 'BRUNCH',   image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Brunch',   link: '/shop/sarees?occasion=Brunch'   },
  { id: 'workwear', label: 'WORKWEAR', image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Workwear', link: '/shop/co-ords?occasion=Workwear' },
  { id: 'evening',  label: 'EVENING',  image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Evening',  link: '/shop/lehengas?occasion=Evening' },
  { id: 'sangeet',  label: 'SANGEET',  image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Sangeet',  link: '/shop/lehengas?occasion=Sangeet' },
  { id: 'mehendi',  label: 'MEHENDI',  image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Mehendi',  link: '/shop/sarees?occasion=Mehendi'  },
  { id: 'haldi',    label: 'HALDI',    image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Haldi',    link: '/shop/kurta-sets?occasion=Haldi' },
  { id: 'wedding',  label: 'WEDDING',  image: 'https://placehold.co/400x400/1F3A2D/F4ECDF.png?text=Wedding',  link: '/shop/lehengas?occasion=Wedding' },
]

export interface HeroSlide {
  id: string
  image: string
  headline: string
  subheadline: string
  ctaLabel: string
  ctaLink: string
}

export interface CollectionBannerData {
  image: string
  headline: string
  subtitle: string
  ctaLabel: string
  ctaLink: string
}

export interface OccasionTile {
  id: string
  label: string
  image: string
  link: string
}

export interface ProductCardData {
  id: string
  slug: string
  category_slug: string
  name: string
  fabric: string | null
  price: number
  compare_price: number | null
  is_new_arrival: boolean
  is_top_selling: boolean
  images: { url: string; alt: string | null }[]
  tags: string[]
}

async function getHomepageData() {
  try {
    const supabase = createPublicClient()

    const [{ data: config }, { data: products }] = await Promise.all([
      supabase
        .from('homepage_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single(),

      supabase
        .from('products')
        .select(`
          id, slug, name, fabric, price, compare_price,
          is_new_arrival, is_top_selling,
          categories (slug),
          product_images (url, alt, position),
          product_tags (tag)
        `)
        .eq('is_active', true)
        .eq('is_new_arrival', true)
        .order('created_at', { ascending: false })
        .limit(12),
    ])

    return { config, products }
  } catch {
    // DB not connected — return nulls, page uses fallback data
    return { config: null, products: null }
  }
}

export default async function HomePage() {
  const { config, products } = await getHomepageData()

  const heroSlides = (() => {
    const slides = config
      ? parseJson<HeroSlide[]>(config.hero_slides, FALLBACK_HERO_SLIDES)
      : FALLBACK_HERO_SLIDES
    return slides.length > 0 ? slides : FALLBACK_HERO_SLIDES
  })()

  const rawBanner = config
    ? parseJson<Partial<CollectionBannerData>>(config.collection_banner, FALLBACK_COLLECTION_BANNER)
    : FALLBACK_COLLECTION_BANNER
  const collectionBanner: CollectionBannerData =
    rawBanner?.ctaLink && rawBanner?.image && rawBanner?.headline
      ? (rawBanner as CollectionBannerData)
      : FALLBACK_COLLECTION_BANNER

  const occasionTiles = config
    ? parseJson<OccasionTile[]>(config.occasion_tiles, FALLBACK_OCCASION_TILES)
    : FALLBACK_OCCASION_TILES

  const newArrivalProducts: ProductCardData[] = (products ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    category_slug: ((p.categories as unknown) as { slug: string } | null)?.slug ?? 'sarees',
    name: p.name,
    fabric: p.fabric,
    price: p.price,
    compare_price: p.compare_price ?? null,
    is_new_arrival: p.is_new_arrival,
    is_top_selling: p.is_top_selling,
    images: ((p.product_images as { url: string; alt: string | null; position: number }[] | null) ?? [])
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ url: img.url, alt: img.alt })),
    tags: ((p.product_tags as { tag: string }[] | null) ?? []).map((t) => t.tag),
  }))

  return (
    <>
      {/* Structured data — Organization schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ClothingStore',
            name: 'ThePossah',
            description: 'Haute couture fashion house in Bengaluru, Karnataka.',
            url: 'https://thepossah.com',
            telephone: '+919151512323',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Shop No. 1, Ground Floor, No. 30, 1st Main Rd, behind Maharaja Furniture Store, Munireddy Layout',
              addressLocality: 'Horamavu, Bengaluru',
              addressRegion: 'Karnataka',
              postalCode: '560113',
              addressCountry: 'IN',
            },
            sameAs: ['https://www.instagram.com/thepossahhautecouture/'],
          }),
        }}
      />

      <HeroSlider slides={heroSlides} />
      <CategorySplit />
      <CategoryCircles />
      <NewArrivals products={newArrivalProducts} />
      <CollectionBanner data={collectionBanner} />
      <OccasionGrid tiles={occasionTiles} />
      <MtmCta />
    </>
  )
}
