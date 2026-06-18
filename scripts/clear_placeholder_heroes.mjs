// Clear any page_heroes values that are just the placeholder SVG (accidental saves)
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const bytes = readFileSync('.env.local')
const startIdx = (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) ? 3 : 0
const env = Object.fromEntries(
  bytes.slice(startIdx).toString('utf8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const SINGLETON = '00000000-0000-0000-0000-000000000001'
const PH = 'https://cdn.thepossah.com/ui/placeholder.svg'

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// Read current page_heroes
const { data, error } = await supabase
  .from('homepage_config')
  .select('page_heroes')
  .eq('id', SINGLETON)
  .maybeSingle()

if (error) { console.error(error.message); process.exit(1) }

const heroes = (data?.page_heroes ?? {})
const cleaned = Object.fromEntries(
  Object.entries(heroes).map(([k, v]) => [k, v === PH ? null : v])
)

console.log('Before:', JSON.stringify(heroes, null, 2))
console.log('After: ', JSON.stringify(cleaned, null, 2))

const { error: updateErr } = await supabase
  .from('homepage_config')
  .update({ page_heroes: cleaned })
  .eq('id', SINGLETON)

if (updateErr) { console.error('Update failed:', updateErr.message); process.exit(1) }
console.log('\n✓ Cleared placeholder URLs from page_heroes. Fields are now empty — upload real images in /admin/homepage.')
