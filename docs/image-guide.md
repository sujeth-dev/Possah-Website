# The Possah — Image Guide

> **Status as of 2026-06-13:** All missing images replaced with a branded CDN placeholder SVG. Zero broken image errors. When real photography is ready, follow this guide page-by-page to swap each placeholder for the real image.

---

## 1. How The Image System Works

```
┌─────────────────────────────────────────────────────────────────┐
│ Source type         │ How it loads                              │
│─────────────────────│───────────────────────────────────────────│
│ /images/*.xxx       │ Served from public/ folder on Vercel     │
│                     │ (only logos + og-default.jpg live here)   │
│─────────────────────│───────────────────────────────────────────│
│ https://cdn.the...  │ Served from Cloudflare R2 via custom CDN │
│ https://pub-*.r2... │ Served from R2 public URL (same bucket)   │
│─────────────────────│───────────────────────────────────────────│
│ Dynamic (DB)        │ URL stored in Supabase → product_images,  │
│                     │ homepage_config, journal_articles,        │
│                     │ lookbooks tables. Updated via admin panel. │
└─────────────────────────────────────────────────────────────────┘
```

**`ImageWithFallback` component** (`components/ui/ImageWithFallback.tsx`):
Wraps Next.js `Image`. If the primary `src` fails to load (network error, 404, 400), the `onError` handler fires and swaps `src` to the fallback URL. Default fallback is now the branded placeholder SVG.

**`next.config.mjs`** already allows:
- `cdn.thepossah.com` — custom CDN domain (use this for all real images)
- `*.r2.dev` — R2 direct public URL (current placeholder lives here)
- `dangerouslyAllowSVG: true` — SVG files work with next/image

---

## 2. The Branded Placeholder SVG

**Current URL:** `https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg`

**Design:** 600×600 viewBox, deep green `#1F3A2D` background, cream `#F4ECDF` "P" monogram, thin separator, "THE POSSAH" wordmark, diamond ornaments. Crops cleanly to any aspect ratio (hero, portrait, square, landscape) via `object-fit: cover`.

**SVG source file** (re-upload if needed):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#1F3A2D"/>
  <rect x="24" y="24" width="552" height="552" fill="none" stroke="#F4ECDF" stroke-width="0.5" opacity="0.2"/>
  <g transform="translate(300, 300)">
    <polygon points="0,-108 7,-100 0,-92 -7,-100" fill="#F4ECDF" opacity="0.3"/>
    <text font-family="Georgia, 'Times New Roman', serif" font-size="128" font-weight="300"
      fill="#F4ECDF" opacity="0.82" text-anchor="middle" dominant-baseline="middle">P</text>
    <line x1="-56" y1="76" x2="56" y2="76" stroke="#F4ECDF" stroke-width="0.6" opacity="0.35"/>
    <text font-family="'Courier New', Courier, monospace" font-size="13" fill="#F4ECDF"
      opacity="0.48" text-anchor="middle" y="98" letter-spacing="9">THE POSSAH</text>
    <polygon points="0,118 7,128 0,138 -7,128" fill="#F4ECDF" opacity="0.3"/>
  </g>
</svg>
```

**To re-upload:** Cloudflare Dashboard → R2 → your bucket → `ui/` folder → upload `placeholder.svg`

---

## 3. How To Replace A Placeholder With A Real Image

For every image below, the process is:

1. **Prepare the image** — see recommended dimensions per context
2. **Upload to R2** — Cloudflare Dashboard → R2 → your bucket → correct folder → upload file
3. **Get the CDN URL** — format: `https://cdn.thepossah.com/<folder>/<filename.jpg>`
4. **Edit the code file** — find the file + line listed below, change `src` from the placeholder URL to the real CDN URL
5. **Verify locally** — `npm run dev`, open the page, confirm image loads
6. **Commit + push** — `git add -p`, commit, push to trigger Vercel deploy

### Image format recommendations
| Context | Format | Quality |
|---|---|---|
| Large heroes (full-width) | WebP or JPG | 85–90% |
| Gallery tiles, occasion tiles | WebP or JPG | 80–85% |
| Thumbnails (journal, lookbook) | WebP or JPG | 80% |
| Founder portrait | WebP or JPG | 85–90% |

---

## 4. Page-by-Page Image Inventory

---

### 4.1 Homepage (`app/(shop)/page.tsx`)

> These are **fallback values** used only when the admin hasn't saved content in the database via the Admin → Homepage panel. Once the admin saves config, DB values are used and these fallbacks never show. **Recommended: update via Admin panel instead of code.**

#### Section: Hero Slider (fallback only)

| # | Image | Current src | Real CDN path | Dimensions | Code line |
|---|---|---|---|---|---|
| 1 | Hero slide background | `placeholder.svg` | `cdn.thepossah.com/homepage/hero-slide-1.jpg` | 1440 × 820px | `FALLBACK_HERO_SLIDES[0].image` ~line 22 |

> To update via admin (preferred): Admin → Homepage → Hero Slider → upload image there.

#### Section: Collection Banner (fallback only)

| # | Image | Current src | Real CDN path | Dimensions | Code line |
|---|---|---|---|---|---|
| 1 | Collection banner bg | `placeholder.svg` | `cdn.thepossah.com/homepage/collection-banner.jpg` | 1440 × 580px | `FALLBACK_COLLECTION_BANNER.image` ~line 32 |

> To update via admin: Admin → Homepage → Collection Banner.

#### Section: Occasion Tiles (fallback only — 8 tiles)

| # | Tile label | Current src | Real CDN path | Dimensions | Code line |
|---|---|---|---|---|---|
| 1 | EVERYDAY | `placeholder.svg` | `cdn.thepossah.com/occasions/everyday.jpg` | 400 × 400px | `FALLBACK_OCCASION_TILES[0].image` |
| 2 | BRUNCH | `placeholder.svg` | `cdn.thepossah.com/occasions/brunch.jpg` | 400 × 400px | same array |
| 3 | WORKWEAR | `placeholder.svg` | `cdn.thepossah.com/occasions/workwear.jpg` | 400 × 400px | same array |
| 4 | EVENING | `placeholder.svg` | `cdn.thepossah.com/occasions/evening.jpg` | 400 × 400px | same array |
| 5 | SANGEET | `placeholder.svg` | `cdn.thepossah.com/occasions/sangeet.jpg` | 400 × 400px | same array |
| 6 | MEHENDI | `placeholder.svg` | `cdn.thepossah.com/occasions/mehendi.jpg` | 400 × 400px | same array |
| 7 | HALDI | `placeholder.svg` | `cdn.thepossah.com/occasions/haldi.jpg` | 400 × 400px | same array |
| 8 | WEDDING | `placeholder.svg` | `cdn.thepossah.com/occasions/wedding.jpg` | 400 × 400px | same array |

> To update via admin: Admin → Homepage → Occasion Tiles.

---

### 4.2 Homepage — Category Split (`components/homepage/CategorySplit.tsx`)

> Hardcoded in component. Must be updated via code.

#### Section: Split panels (lines 11 and 60)

| # | Panel | What it should show | Current src | Real CDN path | Dimensions |
|---|---|---|---|---|---|
| 1 | ETHNIC panel | Woman in saree/lehenga | `placeholder.svg` | `cdn.thepossah.com/categories/ethnic-split.jpg` | 720 × 900px |
| 2 | WESTERN panel | Woman in co-ord/dress | `placeholder.svg` | `cdn.thepossah.com/categories/western-split.jpg` | 720 × 900px |

**To replace (both panels):**
```diff
// components/homepage/CategorySplit.tsx  line 11
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/categories/ethnic-split.jpg"

// line 60
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/categories/western-split.jpg"
```

---

### 4.3 Homepage — Category Circles (`components/homepage/CategoryCircles.tsx`)

> Hardcoded in component via `PH` constant. Update individual entries in the `CATEGORIES` array.

#### Section: 6 category circles (lines 5–10)

| # | Category | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | SAREES | Saree editorial | `cdn.thepossah.com/categories/cat-sarees.jpg` | 400 × 400px |
| 2 | LEHENGAS | Lehenga editorial | `cdn.thepossah.com/categories/cat-lehengas.jpg` | 400 × 400px |
| 3 | CO-ORDS | Co-ord editorial | `cdn.thepossah.com/categories/cat-co-ords.jpg` | 400 × 400px |
| 4 | DRESSES | Dress editorial | `cdn.thepossah.com/categories/cat-dresses.jpg` | 400 × 400px |
| 5 | KURTA SETS | Kurta set editorial | `cdn.thepossah.com/categories/cat-kurta-sets.jpg` | 400 × 400px |
| 6 | TOPS | Tops editorial | `cdn.thepossah.com/categories/cat-tops.jpg` | 400 × 400px |

**To replace:** Update each `image:` field in the `CATEGORIES` array, e.g.:
```diff
- { label: 'SAREES', href: '/shop/sarees', image: PH },
+ { label: 'SAREES', href: '/shop/sarees', image: 'https://cdn.thepossah.com/categories/cat-sarees.jpg' },
```
Once all 6 are updated, remove the `const PH = ...` line.

---

### 4.4 Homepage — Made-to-Measure CTA (`components/homepage/MtmCta.tsx`)

#### Section: Right-side image (line 84)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | MTM promo photo | Artisan working on fabric | `cdn.thepossah.com/mtm/mtm-cta.jpg` | 720 × 500px |

**To replace:**
```diff
// components/homepage/MtmCta.tsx  line 84
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/mtm/mtm-cta.jpg"
```

---

### 4.5 About Page (`app/(shop)/about/page.tsx`)

#### Section: Hero (line ~35)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | About hero | Artisan weaving / atelier scene | `cdn.thepossah.com/about/about-hero.jpg` | 1440 × 820px |

**To replace:**
```diff
// app/(shop)/about/page.tsx  line ~35  (inside ImageWithFallback)
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/about/about-hero.jpg"
```

#### Section: Founder photo (line ~168)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Founder portrait | Deepthi, founder of The Possah | `cdn.thepossah.com/about/founder.jpg` | 800 × 1067px (3:4) |

**To replace:**
```diff
// app/(shop)/about/page.tsx  line ~168  (inside ImageWithFallback)
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/about/founder.jpg"
```

---

### 4.6 Bridal Page (`app/(shop)/bridal/page.tsx`)

#### Section: Hero (line ~101)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Bridal hero | Bride in Possah bridal piece | `cdn.thepossah.com/bridal/bridal-hero.jpg` | 1440 × 820px |

**To replace:**
```diff
// app/(shop)/bridal/page.tsx  line ~101  (inside ImageWithFallback)
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/bridal/bridal-hero.jpg"
```

#### Section: Occasion tiles — OCCASIONS const (lines 22–28)

| # | Occasion | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Reception Glam | Wedding reception look | `cdn.thepossah.com/bridal/reception.jpg` | 600 × 800px (3:4) |
| 2 | Mehendi's Edit | Mehendi ceremony look | `cdn.thepossah.com/bridal/mehendi.jpg` | 600 × 800px (3:4) |
| 3 | Sangeet Edit | Sangeet night look | `cdn.thepossah.com/bridal/sangeet.jpg` | 600 × 800px (3:4) |
| 4 | Haldi Edit | Haldi ceremony look | `cdn.thepossah.com/bridal/haldi.jpg` | 600 × 800px (3:4) |
| 5 | Wedding Guest Edit | Guest styling | `cdn.thepossah.com/bridal/wedding-guest.jpg` | 600 × 800px (3:4) |
| 6 | Cocktail Night | Cocktail outfit | `cdn.thepossah.com/bridal/cocktail.jpg` | 600 × 800px (3:4) |

**To replace:** Update each `image:` field in the `OCCASIONS` const, e.g.:
```diff
const OCCASIONS: OccasionTile[] = [
- { label: 'Reception Glam',     image: PH, tag: 'Wedding'  },
+ { label: 'Reception Glam',     image: 'https://cdn.thepossah.com/bridal/reception.jpg', tag: 'Wedding'  },
  ...
]
```
Once all 6 are updated, remove `const PH = ...`.

---

### 4.7 Festive Page (`app/(shop)/festive/page.tsx`)

#### Section: Hero (line ~101)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Festive hero | Festive editorial — colour and energy | `cdn.thepossah.com/festive/festive-hero.jpg` | 1440 × 820px |

**To replace:**
```diff
// app/(shop)/festive/page.tsx  line ~101  (inside ImageWithFallback)
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/festive/festive-hero.jpg"
```

#### Section: Occasion tiles — OCCASIONS const (lines 23–28)

| # | Occasion | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Cocktail & Party | Cocktail-ready festive outfit | `cdn.thepossah.com/festive/cocktail.jpg` | 600 × 800px (3:4) |
| 2 | Vacation Glam | Resort / vacation outfit | `cdn.thepossah.com/festive/vacation.jpg` | 600 × 800px (3:4) |
| 3 | Festive Edit | Diwali / festive editorial | `cdn.thepossah.com/festive/festive-edit.jpg` | 600 × 800px (3:4) |
| 4 | Everyday Luxe | Everyday luxe outfit | `cdn.thepossah.com/festive/everyday.jpg` | 600 × 800px (3:4) |
| 5 | Custom Couture | MTM / bespoke creation | `cdn.thepossah.com/festive/custom-couture.jpg` | 600 × 800px (3:4) |

**To replace:** Update each `image:` field in the `OCCASIONS` const:
```diff
const OCCASIONS: OccasionTile[] = [
- { label: 'Cocktail & Party', image: PH, tag: 'Cocktail' },
+ { label: 'Cocktail & Party', image: 'https://cdn.thepossah.com/festive/cocktail.jpg', tag: 'Cocktail' },
  ...
]
```
Once all 5 are updated, remove `const PH = ...`.

---

### 4.8 Made-to-Measure Page (`app/(shop)/made-to-measure/page.tsx`)

#### Section: Hero (line ~46)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | MTM hero | Atelier scene — fitting, fabric, craft | `cdn.thepossah.com/mtm/mtm-hero.jpg` | 1440 × 820px |

**To replace:**
```diff
// app/(shop)/made-to-measure/page.tsx  line ~46  (inside Image component)
- src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
+ src="https://cdn.thepossah.com/mtm/mtm-hero.jpg"
```

#### Section: Gallery grid — 4 images (line ~182)

| # | Image | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | Gallery slot 1 | MTM process / fabric detail | `cdn.thepossah.com/mtm/mtm-1.jpg` | 600 × 800px (3:4) |
| 2 | Gallery slot 2 | MTM fitting / draping | `cdn.thepossah.com/mtm/mtm-2.jpg` | 600 × 800px (3:4) |
| 3 | Gallery slot 3 | Finished piece / model shot | `cdn.thepossah.com/mtm/mtm-3.jpg` | 600 × 800px (3:4) |
| 4 | Gallery slot 4 | Detail / embroidery close-up | `cdn.thepossah.com/mtm/mtm-4.jpg` | 600 × 800px (3:4) |

**To replace:** Update the array of 4 src strings in the `.map()` at line ~182:
```diff
{[
- 'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
- 'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
- 'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
- 'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
+ 'https://cdn.thepossah.com/mtm/mtm-1.jpg',
+ 'https://cdn.thepossah.com/mtm/mtm-2.jpg',
+ 'https://cdn.thepossah.com/mtm/mtm-3.jpg',
+ 'https://cdn.thepossah.com/mtm/mtm-4.jpg',
].map(
```

---

### 4.9 Lookbook Page (`app/(shop)/lookbook/page.tsx`)

> Static fallback entries. When lookbooks are added via Admin → Lookbooks, those DB `hero_image` values take over and these static entries are never shown.

#### Section: Static lookbook covers — STATIC_LOOKBOOKS const (lines 24–56)

| # | Lookbook | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | The Quiet Ceremony | Wedding editorial | `cdn.thepossah.com/lookbook/lookbook-ceremony.jpg` | 600 × 800px (3:4) |
| 2 | Saffron Season | Festive editorial | `cdn.thepossah.com/lookbook/lookbook-festive.jpg` | 600 × 800px (3:4) |
| 3 | The Everyday Drape | Everyday editorial | `cdn.thepossah.com/lookbook/lookbook-everyday.jpg` | 600 × 800px (3:4) |

**To replace:** Update each `hero_image` in `STATIC_LOOKBOOKS`, e.g.:
```diff
- hero_image: PH,
+ hero_image: 'https://cdn.thepossah.com/lookbook/lookbook-ceremony.jpg',
```
Once all 3 are updated, remove `const PH = ...` and update the JSX fallback:
```diff
- src={lb.hero_image || PH}
+ src={lb.hero_image || 'https://cdn.thepossah.com/lookbook/lookbook-ceremony.jpg'}
```

> Preferred path: add lookbook entries via Admin → Lookbooks. Static entries are only shown when no DB entries exist.

---

### 4.10 Journal Page (`app/(shop)/journal/page.tsx`)

> Static fallback entries. When articles are published via Admin → Journal, DB values take over.

#### Section: Static article thumbnails — STATIC_ARTICLES const (lines 23–54)

| # | Article | What it should show | Real CDN path | Dimensions |
|---|---|---|---|---|
| 1 | The Language of Chikankari | Chikankari textile close-up | `cdn.thepossah.com/journal/journal-chikankari.jpg` | 800 × 600px (4:3) |
| 2 | Dressing for the Mehendi | Mehendi ceremony outfit | `cdn.thepossah.com/journal/journal-mehendi.jpg` | 800 × 600px (4:3) |
| 3 | Why Linen, Every Summer | Linen fabric / summer draping | `cdn.thepossah.com/journal/journal-linen.jpg` | 800 × 600px (4:3) |

**To replace:** Update each `featured_image` in `STATIC_ARTICLES`, e.g.:
```diff
- featured_image: PH,
+ featured_image: 'https://cdn.thepossah.com/journal/journal-chikankari.jpg',
```
Also update the JSX fallback in two places (featured article + article grid):
```diff
- src={featured.featured_image || PH}
+ src={featured.featured_image || 'https://cdn.thepossah.com/journal/journal-chikankari.jpg'}
```

> Preferred path: publish articles via Admin → Journal. Static entries are only shown when no DB articles exist.

---

## 5. Product Images

Product images are **100% database-driven** — uploaded via Admin → Products → each product's image gallery. These are stored in Cloudflare R2 and served via the CDN URL. No code changes needed.

If a product image fails to load, `ImageWithFallback` in the product card will show the branded placeholder SVG.

### Recommended product image specs
| Context | Ratio | Min resolution | Format |
|---|---|---|---|
| Product listing card | 3:4 | 600 × 800px | WebP / JPG |
| Product detail page hero | 3:4 | 900 × 1200px | WebP / JPG |
| Thumbnail / hover image | 3:4 | 600 × 800px | WebP / JPG |

---

## 6. Images That Never Need Code Changes

These are managed entirely via the Admin panel or are permanent static assets:

| Image | Where it lives | How to update |
|---|---|---|
| Logo (`logo.png`) | `public/images/logo.png` | Replace the file — must keep same filename |
| Wordmark (`name.png`) | `public/images/name.png` | Replace the file — must keep same filename |
| OG default (`og-default.jpg`) | `public/images/og-default.jpg` | Replace the file |
| Product images | R2 via Admin panel | Admin → Products → Images |
| Homepage hero slides | R2 via Admin panel | Admin → Homepage → Hero Slider |
| Homepage collection banner | R2 via Admin panel | Admin → Homepage → Collection Banner |
| Homepage occasion tiles | R2 via Admin panel | Admin → Homepage → Occasion Tiles |
| Journal article images | R2 via Admin panel | Admin → Journal → Article images |
| Lookbook images | R2 via Admin panel | Admin → Lookbooks |

---

## 7. Upload Checklist — When Ready To Replace Placeholders

Print this and check off each image as it is photographed, uploaded, and wired:

### Brand / System
- [ ] Placeholder SVG — already uploaded ✓ (`ui/placeholder.svg`)

### Homepage (code)
- [ ] Hero slide 1 background (`homepage/hero-slide-1.jpg` or via admin)
- [ ] Collection banner (`homepage/collection-banner.jpg` or via admin)
- [ ] Occasion tiles ×8 (via admin preferred)
- [ ] Category Split — Ethnic panel (`categories/ethnic-split.jpg`)
- [ ] Category Split — Western panel (`categories/western-split.jpg`)
- [ ] Category Circles — Sarees (`categories/cat-sarees.jpg`)
- [ ] Category Circles — Lehengas (`categories/cat-lehengas.jpg`)
- [ ] Category Circles — Co-Ords (`categories/cat-co-ords.jpg`)
- [ ] Category Circles — Dresses (`categories/cat-dresses.jpg`)
- [ ] Category Circles — Kurta Sets (`categories/cat-kurta-sets.jpg`)
- [ ] Category Circles — Tops (`categories/cat-tops.jpg`)
- [ ] MtmCta promo image (`mtm/mtm-cta.jpg`)

### About
- [ ] About hero (`about/about-hero.jpg`)
- [ ] Founder portrait (`about/founder.jpg`)

### Bridal
- [ ] Bridal hero (`bridal/bridal-hero.jpg`)
- [ ] Occasion: Reception Glam (`bridal/reception.jpg`)
- [ ] Occasion: Mehendi's Edit (`bridal/mehendi.jpg`)
- [ ] Occasion: Sangeet Edit (`bridal/sangeet.jpg`)
- [ ] Occasion: Haldi Edit (`bridal/haldi.jpg`)
- [ ] Occasion: Wedding Guest Edit (`bridal/wedding-guest.jpg`)
- [ ] Occasion: Cocktail Night (`bridal/cocktail.jpg`)

### Festive
- [ ] Festive hero (`festive/festive-hero.jpg`)
- [ ] Occasion: Cocktail & Party (`festive/cocktail.jpg`)
- [ ] Occasion: Vacation Glam (`festive/vacation.jpg`)
- [ ] Occasion: Festive Edit (`festive/festive-edit.jpg`)
- [ ] Occasion: Everyday Luxe (`festive/everyday.jpg`)
- [ ] Occasion: Custom Couture (`festive/custom-couture.jpg`)

### Made-to-Measure
- [ ] MTM hero (`mtm/mtm-hero.jpg`)
- [ ] MTM gallery slot 1 (`mtm/mtm-1.jpg`)
- [ ] MTM gallery slot 2 (`mtm/mtm-2.jpg`)
- [ ] MTM gallery slot 3 (`mtm/mtm-3.jpg`)
- [ ] MTM gallery slot 4 (`mtm/mtm-4.jpg`)

### Lookbook (code fallbacks — prefer admin)
- [ ] The Quiet Ceremony (`lookbook/lookbook-ceremony.jpg`)
- [ ] Saffron Season (`lookbook/lookbook-festive.jpg`)
- [ ] The Everyday Drape (`lookbook/lookbook-everyday.jpg`)

### Journal (code fallbacks — prefer admin)
- [ ] The Language of Chikankari (`journal/journal-chikankari.jpg`)
- [ ] Dressing for the Mehendi (`journal/journal-mehendi.jpg`)
- [ ] Why Linen, Every Summer (`journal/journal-linen.jpg`)

---

## 8. R2 Upload Steps (Detailed)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage** → your bucket
2. Navigate to (or create) the correct subfolder — click **Create folder**, name it (e.g. `about`)
3. Click **Upload** → select your image file
4. After upload, the CDN URL is: `https://cdn.thepossah.com/<folder>/<filename>`
   - Example: file `about/founder.jpg` → URL `https://cdn.thepossah.com/about/founder.jpg`
5. Test the URL directly in a browser to confirm it's accessible
6. Open the corresponding code file (see sections above) and update `src=` to the new URL
7. Run `npm run dev`, open the page, verify the image loads correctly
8. Commit: `git add <file>` → `git commit -m "feat: add <pagename> <imagename> image"` → `git push`
9. Vercel will deploy automatically — verify on live site
