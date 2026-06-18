import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const bytes = readFileSync('.env.local')
const startIdx = (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) ? 3 : 0
const envContent = bytes.slice(startIdx).toString('utf8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await supabase
  .from('homepage_config')
  .select('page_heroes')
  .eq('id', '00000000-0000-0000-0000-000000000001')
  .maybeSingle()

if (error?.message?.includes('page_heroes')) {
  console.error('❌ Column page_heroes DOES NOT EXIST')
  process.exit(1)
} else if (error) {
  console.error('Query error:', error.message)
  process.exit(1)
} else {
  console.log('✓ Column page_heroes EXISTS. Value:', JSON.stringify(data?.page_heroes ?? {}))
}
