import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsEditor } from './SettingsEditor'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

const DEFAULT_SETTINGS = {
  announcement_text:       'FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE',
  store_email:             '',
  whatsapp_number:         '',
  free_shipping_threshold: 5000,
  express_delivery_fee:    499,
  seo_title:               'The Possah — Luxury Indian Fashion',
  seo_description:         '',
  seo_og_image:            null as string | null,
}

async function getSettings() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .maybeSingle()

    return data ?? DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          Settings
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Store configuration, WhatsApp number, shipping thresholds, SEO defaults.
        </p>
      </div>

      <SettingsEditor initial={{
        announcement_text:       settings.announcement_text ?? DEFAULT_SETTINGS.announcement_text,
        store_email:             settings.store_email ?? '',
        whatsapp_number:         settings.whatsapp_number ?? '',
        free_shipping_threshold: settings.free_shipping_threshold ?? 5000,
        express_delivery_fee:    settings.express_delivery_fee ?? 499,
        seo_title:               settings.seo_title ?? DEFAULT_SETTINGS.seo_title,
        seo_description:         settings.seo_description ?? '',
        seo_og_image:            settings.seo_og_image ?? null,
      }} />
    </div>
  )
}
