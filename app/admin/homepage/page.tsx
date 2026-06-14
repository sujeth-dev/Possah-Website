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

    return {
      hero_slides:       (data.hero_slides as HeroSlide[]) ?? [],
      collection_banner: data.collection_banner as CollectionBanner | null,
      new_arrival_ids:   (data.new_arrival_ids as string[]) ?? [],
      occasion_tiles:    (data.occasion_tiles as OccasionTile[])?.length === 8
        ? data.occasion_tiles as OccasionTile[]
        : defaults.occasion_tiles,
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
