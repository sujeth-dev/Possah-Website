import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { HomepageEditor } from './HomepageEditor'

export const metadata: Metadata = { title: 'Homepage Config' }
export const dynamic = 'force-dynamic'

interface HeroSlide {
  image_url:    string
  headline:     string
  sub_headline: string
  cta_label:    string
  cta_link:     string
}

interface CollectionBanner {
  image_url: string
  headline:  string
  subtitle:  string
  cta_link:  string
}

interface OccasionTile {
  image_url: string
  label:     string
  link:      string
}

interface HomepageConfig {
  hero_slides:       HeroSlide[]
  collection_banner: CollectionBanner | null
  new_arrival_ids:   string[]
  occasion_tiles:    OccasionTile[]
}

// Must stay in sync with the constant in app/api/admin/homepage/route.ts
const SINGLETON_ID = '00000000-0000-0000-0000-000000000001'

async function getHomepageConfig(): Promise<HomepageConfig> {
  const defaults: HomepageConfig = {
    hero_slides:       [],
    collection_banner: null,
    new_arrival_ids:   [],
    occasion_tiles:    Array.from({ length: 8 }, (_, i) => ({
      image_url: '',
      label:     ['Everyday', 'Brunch', 'Workwear', 'Evening', 'Sangeet', 'Mehendi', 'Haldi', 'Wedding'][i],
      link:      `/women/sarees?occasion=${['Everyday','Brunch','Workwear','Evening','Sangeet','Mehendi','Haldi','Wedding'][i]}`,
    })),
  }

  try {
    const supabase = createAdminClient()
    // Query the singleton row — same ID the PATCH route saves to
    const { data }  = await supabase.from('homepage_config').select('*').eq('id', SINGLETON_ID).maybeSingle()
    if (!data) return defaults

    const rawSlides = (data.hero_slides as Record<string, string>[]) ?? []
    const rawBanner = data.collection_banner as Record<string, string> | null
    const rawTiles  = (data.occasion_tiles as Record<string, string>[]) ?? []

    return {
      hero_slides: rawSlides.map(s => ({
        image_url:    s.image_url    || s.image       || '',
        headline:     s.headline     || '',
        sub_headline: s.sub_headline || s.subheadline || '',
        cta_label:    s.cta_label    || s.ctaLabel    || '',
        cta_link:     s.cta_link     || s.ctaLink     || '',
      })),
      collection_banner: rawBanner ? {
        image_url: rawBanner.image_url || rawBanner.image   || '',
        headline:  rawBanner.headline  || '',
        subtitle:  rawBanner.subtitle  || '',
        cta_link:  rawBanner.cta_link  || rawBanner.ctaLink || '',
      } : null,
      new_arrival_ids: (data.new_arrival_ids as string[]) ?? [],
      occasion_tiles: (() => {
        const tiles = rawTiles.map(t => ({
          image_url: t.image_url || t.image || '',
          label:     t.label     || '',
          link:      t.link      || '',
        }))
        return Array.from({ length: 8 }, (_, i) => tiles[i] ?? defaults.occasion_tiles[i])
      })(),
    }
  } catch {
    return defaults
  }
}

async function getActiveProducts() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name')
    return data ?? []
  } catch {
    return []
  }
}

export default async function AdminHomepagePage() {
  const [config, products] = await Promise.all([
    getHomepageConfig(),
    getActiveProducts(),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          Homepage Config
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Changes save per-section. Refresh the homepage to see updates.
        </p>
      </div>

      <HomepageEditor initial={config} products={products} />
    </div>
  )
}
