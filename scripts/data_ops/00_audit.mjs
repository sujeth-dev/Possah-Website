/**
 * PHASE 0 — AUDIT + BACKUP
 * READ-ONLY. Safe to run at any time.
 * Dumps current DB state to scripts/data_ops/backup/BACKUP_<timestamp>.json
 *
 * Run: node scripts/data_ops/00_audit.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { supabase } from './lib/db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = resolve(__dirname, 'backup')

async function audit() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 0 — AUDIT + BACKUP')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const tables = [
    'categories',
    'products',
    'product_images',
    'product_variants',
    'product_tags',
    'product_look_links',
    'reviews',
    'wishlists',
    'cart_items',
    'orders',
  ]

  const backup = { timestamp: new Date().toISOString(), tables: {} }

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      console.error(`  ✗ ${table}: ${error.message}`)
      backup.tables[table] = { error: error.message }
    } else {
      console.log(`  ✓ ${table.padEnd(24)} ${String(data.length).padStart(5)} rows`)
      backup.tables[table] = data
    }
  }

  // Write backup file
  mkdirSync(BACKUP_DIR, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = resolve(BACKUP_DIR, `BACKUP_${ts}.json`)
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8')

  console.log(`\n  Backup saved → ${backupPath}`)
  console.log('\n  AUDIT COMPLETE — no changes made.\n')
}

audit().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
