# Image Performance — Possah

## Current Setup (Option A — Active)

### What Is Running Now

All images are stored in **Supabase Storage** (`possah-media` bucket) and served
through **Vercel's built-in image optimisation layer** (`next/image`).

```
Browser request
  → /_next/image?url=<supabase-url>&w=<width>&q=<quality>
      → Vercel edge fetches from Supabase (first time only)
      → Converts to AVIF or WebP (whichever browser supports)
      → Resizes to exact display width
      → Caches at Vercel edge for 1 year
  → All subsequent requests served from Vercel CDN (Supabase never hit again)
```

### Files Changed (2026-05-26)

| File | Change | Reason |
|---|---|---|
| `next.config.mjs` | Added `minimumCacheTTL: 31536000` | Default was 60 s — Vercel was re-fetching from Supabase every minute |
| `next.config.mjs` | `formats: ['image/avif', 'image/webp']` | Already present — serves smallest supported format |
| `components/shop/ProductCard.tsx` | Added `quality={80}` to primary + hover images | Defaults to 75; 80 is noticeably sharper for product cards |
| `components/shop/ProductCard.tsx` | `sizes` last breakpoint: `16vw` → `25vw` | 16vw was undersizing images on wide screens (6-col grid) |
| `components/pdp/ProductGallery.tsx` | Added `quality={90}` to primary image | Hero PDP image needs higher fidelity |
| `app/admin/products/BucketPicker.tsx` | Removed `unoptimized` | Was bypassing Vercel optimization entirely for picker grid |
| `app/admin/media/MediaLibrary.tsx` | Removed `unoptimized` (×2) | Same — grid view and list view thumbnails were raw Supabase files |

### What Was NOT Changed

- Upload flow: still goes to Supabase (`/api/admin/upload` → Supabase storage)
- Delete flow: still deletes from Supabase (`/api/admin/media/delete`)
- Media library list: still reads from Supabase bucket
- Admin UI: no visual changes
- Database: no schema changes
- URLs stored in `product_images` table: unchanged (still Supabase public URLs)

### Speed Gains

- **File size**: 2 MB JPEG → ~35–60 KB AVIF/WebP (40–60× smaller)
- **Right sizing**: 1400 px original served as 400 px card = no wasted bandwidth
- **CDN caching**: After first request per image, served from Vercel edge globally
- **Admin**: Picker and library grids now optimised — faster to browse large catalogs

### Vercel Image Optimisation Limits (Free Tier)

Free tier includes **1,000 unique image optimisations/month**.  
Each unique `(url, width, quality, format)` combination counts as one.  
Once cached (1 year TTL), repeat requests are free — they hit CDN, not the optimiser.  
For a small store this is well within limits.

If you exceed 1,000: Vercel charges $5 per additional 1,000. Still cheap.

---

## Future Option — Cloudflare R2 (Option C)

Switch storage backend from Supabase to Cloudflare R2.  
`next/image` continues to handle optimisation/CDN — only the storage origin changes.

### Why Switch to R2

- **Zero egress fees** — Supabase charges for bandwidth out of storage; R2 does not
- **Faster cache miss**: R2 is on Cloudflare's network → first load also faster
- **Free tier**: 10 GB storage, 1M Class A ops, 10M Class B ops/month
- **When to switch**: If Supabase storage bandwidth costs appear on your bill, or if
  you want first-load speed on par with cached loads

### Pre-Migration Checklist

- [ ] Create Cloudflare account (cloudflare.com)
- [ ] Enable R2 (Dashboard → R2 → Create bucket → name: `possah-media`)
- [ ] Create R2 API token: Dashboard → R2 → Manage R2 API Tokens → Create Token
  - Permissions: Object Read & Write
  - Copy: Access Key ID, Secret Access Key
- [ ] Enable public access on bucket: R2 bucket → Settings → Public Access → Allow
  - Copy the public bucket URL: `https://<hash>.r2.dev`
- [ ] Add env vars to Vercel + `.env.local`:
  ```env
  IMAGE_PROVIDER=r2
  R2_ACCOUNT_ID=
  R2_ACCESS_KEY_ID=
  R2_SECRET_ACCESS_KEY=
  R2_BUCKET_NAME=possah-media
  R2_PUBLIC_URL=https://<hash>.r2.dev
  ```
- [ ] Add R2 domain to `next.config.mjs` `remotePatterns`

### Files to Change for R2

**1. Install AWS SDK (R2 uses S3-compatible API)**
```bash
npm install @aws-sdk/client-s3
```

**2. `lib/r2.ts` — new file**
```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET  = process.env.R2_BUCKET_NAME!
export const R2_PUBLIC  = process.env.R2_PUBLIC_URL!   // https://<hash>.r2.dev
```

**3. `app/api/admin/upload/route.ts` — replace Supabase upload with R2**
```ts
import { r2, R2_BUCKET, R2_PUBLIC } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

// Inside POST handler, replace supabase.storage.upload with:
const key = `products/${Date.now()}-${safeName}.webp`
await r2.send(new PutObjectCommand({
  Bucket:      R2_BUCKET,
  Key:         key,
  Body:        Buffer.from(await file.arrayBuffer()),
  ContentType: 'image/webp',
}))
const publicUrl = `${R2_PUBLIC}/${key}`
return NextResponse.json({ publicUrl })
```

**4. `app/api/admin/media/delete/route.ts` — replace Supabase remove with R2**
```ts
import { r2, R2_BUCKET } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

// Replace supabase.storage.remove with:
for (const path of validPaths) {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: path }))
}
```

**5. `app/api/admin/media/list/route.ts` — replace Supabase list with R2**
```ts
import { r2, R2_BUCKET, R2_PUBLIC } from '@/lib/r2'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

const { Contents } = await r2.send(new ListObjectsV2Command({ Bucket: R2_BUCKET }))
const files = (Contents ?? []).map(obj => ({
  name:       obj.Key!.split('/').pop()!,
  url:        `${R2_PUBLIC}/${obj.Key}`,
  size:       obj.Size ?? 0,
  created_at: obj.LastModified?.toISOString() ?? '',
  fullPath:   obj.Key!,
  folder:     obj.Key!.includes('/') ? obj.Key!.split('/')[0] : undefined,
}))
```

**6. `next.config.mjs` — add R2 domain**
```js
{
  protocol: 'https',
  hostname: '*.r2.dev',
},
// or if using custom domain:
{
  protocol: 'https',
  hostname: 'cdn.thepossah.com',
},
```

### Migration Script (move existing Supabase images to R2)

Run once after R2 setup to migrate all existing `product_images` URLs:

```ts
// scripts/migrate-to-r2.ts
// Usage: npx tsx scripts/migrate-to-r2.ts

import { createAdminClient } from '@/lib/supabase/admin'
import { r2, R2_BUCKET, R2_PUBLIC } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function migrate() {
  const supabase = createAdminClient()
  const { data: images } = await supabase
    .from('product_images')
    .select('id, url')
    .like('url', '%supabase.co%')   // only Supabase URLs

  let done = 0
  for (const img of images ?? []) {
    try {
      // Fetch from Supabase
      const blob   = await fetch(img.url).then(r => r.arrayBuffer())
      const key    = `products/${Date.now()}-${img.id}.webp`

      // Upload to R2
      await r2.send(new PutObjectCommand({
        Bucket:      R2_BUCKET,
        Key:         key,
        Body:        Buffer.from(blob),
        ContentType: 'image/webp',
      }))

      // Update DB
      const newUrl = `${R2_PUBLIC}/${key}`
      await supabase.from('product_images').update({ url: newUrl }).eq('id', img.id)

      done++
      console.log(`✓ [${done}] ${img.id} → ${newUrl}`)
    } catch (err) {
      console.error(`✗ ${img.id}:`, err)
    }
  }
  console.log(`\nMigration complete. ${done} images moved to R2.`)
}

migrate().catch(console.error)
```

### Rollback (R2 → Supabase in one command)

```bash
# Change provider back in env, then run:
npx tsx scripts/migrate-to-supabase.ts
```

Mirror of the above script with source/destination swapped.

---

## Performance Verification Checklist

After any deploy, use these checks to confirm images are loading fast:

### Browser DevTools

- [ ] Open DevTools → Network tab → filter `Img`
- [ ] Load the shop page. Check response headers on any product image:
  - `content-type` should be `image/avif` or `image/webp` (not `image/jpeg`)
  - `cache-control` should contain `max-age=31536000` or `s-maxage=...`
  - `x-vercel-cache` should be `HIT` on second load (means CDN served it)
- [ ] Image file sizes: product cards should be under 60 KB each
- [ ] Image file sizes: PDP hero should be under 150 KB

### Lighthouse / PageSpeed

- [ ] Run Lighthouse on the shop page (Chrome DevTools → Lighthouse tab)
- [ ] Target: LCP (Largest Contentful Paint) under 2.5 s on mobile
- [ ] "Serve images in next-gen formats" warning should be gone
- [ ] "Properly size images" warning should be gone

### Vercel Dashboard

- [ ] Vercel → Project → Analytics → Web Vitals → LCP trend
- [ ] Vercel → Project → Usage → Image Optimisations (check you're under 1,000/month free)

### Admin Panel

- [ ] Open `/admin/media` — grid thumbnails should load noticeably faster
- [ ] Open product edit → "Choose / Upload" button → BucketPicker grid should load fast
- [ ] Upload a new image → confirm it appears in picker and saves to product correctly

---

## Quick Reference

| Setting | Value | File |
|---|---|---|
| Cache TTL | 31,536,000 s (1 year) | `next.config.mjs` |
| Formats | AVIF → WebP → original | `next.config.mjs` |
| Card quality | 80 | `ProductCard.tsx` |
| Gallery hero quality | 90 | `ProductGallery.tsx` |
| Card sizes | `50vw / 33vw / 25vw` | `ProductCard.tsx` |
| Gallery sizes | `100vw / 50vw / 600px` | `ProductGallery.tsx` |
| Storage bucket | `possah-media` (Supabase) | `lib/supabase/admin.ts` |
| Active provider | Supabase | — |
