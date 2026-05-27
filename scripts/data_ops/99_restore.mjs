/**
 * ROLLBACK — RESTORE FROM BACKUP
 *
 * Reads the most recent BACKUP_*.json from scripts/data_ops/backup/
 * and re-inserts all data in FK-safe order.
 *
 * Run: node scripts/data_ops/99_restore.mjs
 * Or specify a backup file: node scripts/data_ops/99_restore.mjs backup/BACKUP_2026-05-27T10-30-00.json
 */
import { readdirSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { supabase, check } from './lib/db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = resolve(__dirname, 'backup')

// Tables in FK-safe INSERT order (reverse of delete order)
const RESTORE_ORDER = [
  'categories',
  'products',
  'product_images',
  'product_variants',
  'product_tags',
  'product_look_links',
  'reviews',
  'orders',
  'wishlists',
  'cart_items',
]

// Tables to clean before restoring (same FK order as 02_clean)
const CLEAN_ORDER = [
  'cart_items', 'wishlists', 'reviews', 'product_look_links',
  'product_tags', 'product_images', 'product_variants', 'products', 'orders',
]

async function restore() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ROLLBACK — RESTORE FROM BACKUP')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // ── Find backup file ───────────────────────────────────────────────────────
  let backupPath
  if (process.argv[2]) {
    backupPath = resolve(__dirname, process.argv[2])
  } else {
    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('BACKUP_') && f.endsWith('.json'))
      .sort()
      .reverse()
    if (files.length === 0) throw new Error('No backup files found in scripts/data_ops/backup/')
    backupPath = resolve(BACKUP_DIR, files[0])
  }

  console.log(`  Using backup: ${backupPath}\n`)
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'))

  // ── Clean current state ────────────────────────────────────────────────────
  console.log('  Cleaning current DB state...')
  for (const table of CLEAN_ORDER) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) console.warn(`  ⚠ clean ${table}: ${error.message}`)
    else process.stdout.write(`  ✓ cleared ${table}\n`)
  }

  // ── Restore in order ───────────────────────────────────────────────────────
  console.log('\n  Restoring backup data...')
  for (const table of RESTORE_ORDER) {
    const rows = backup.tables[table]
    if (!rows || rows.error) {
      console.log(`  ⚠ skip ${table} (no data or error in backup)`)
      continue
    }
    if (rows.length === 0) {
      console.log(`  ─ ${table}: 0 rows`)
      continue
    }

    // Insert in batches of 100 to avoid payload limits
    const BATCH = 100
    let inserted = 0
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await supabase.from(table).insert(batch)
      if (error) {
        console.error(`  ✗ ${table} batch ${i}–${i + BATCH}: ${error.message}`)
      } else {
        inserted += batch.length
      }
    }
    console.log(`  ✓ ${table.padEnd(24)} ${inserted} rows restored`)
  }

  console.log('\n  ROLLBACK COMPLETE ✓\n')
  console.log('  Run 06_verify.mjs to confirm state.\n')
}

restore().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
