// Check if page_heroes is readable via both anon (public) and service role (admin) clients
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

const SINGLETON = '00000000-0000-0000-0000-000000000001'

// Test 1: anon client (what the shop pages use)
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { data: anonData, error: anonErr } = await anon
  .from('homepage_config')
  .select('page_heroes')
  .eq('id', SINGLETON)
  .maybeSingle()

console.log('Anon client:')
if (anonErr) console.error('  ERROR:', anonErr.message)
else console.log('  page_heroes:', JSON.stringify(anonData?.page_heroes))

// Test 2: service role (what admin uses)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data: adminData, error: adminErr } = await admin
  .from('homepage_config')
  .select('page_heroes')
  .eq('id', SINGLETON)
  .maybeSingle()

console.log('Admin client:')
if (adminErr) console.error('  ERROR:', adminErr.message)
else console.log('  page_heroes:', JSON.stringify(adminData?.page_heroes))
