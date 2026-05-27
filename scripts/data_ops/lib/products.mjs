/**
 * Master product catalog — 42 products.
 * LOCAL_PRODUCTS: images come from disk (drive-1 / drive-2).
 * ETHNIC_PRODUCTS: images fetched from Unsplash CDN.
 *
 * Fields:
 *   folder      — exact folder name in Products/drive-X/
 *   drive       — 'drive-1' | 'drive-2'
 *   name        — display name
 *   slug        — URL slug (unique)
 *   category    — category slug matching DB
 *   subLine     — 'THE EDIT' | 'THE DRAPE' | 'THE ATELIER' | 'THE VAULT'
 *   price       — in INR (integer)
 *   colour      — for variant rows
 *   fabric      — fabric description
 *   description — product description (~2 sentences)
 *   care        — care instructions
 *   tags        — occasion tags
 *   skuCode     — e.g. 'DR-001' (variants get PSH-DR-001-S etc.)
 *   imgExt      — file extension to pick (default 'png')
 */

export const LOCAL_PRODUCTS = [
  // ─────────────────────────────────────────────
  //  DRESSES (DR-001 to DR-016)
  // ─────────────────────────────────────────────
  {
    folder: 'Botanical Grace Midi',
    drive: 'drive-1',
    name: 'Botanical Grace Midi',
    slug: 'botanical-grace-midi',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 8500,
    colour: 'Sage Green',
    fabric: 'Cotton Blend',
    description:
      'A floaty midi silhouette dressed in botanical-print cotton blend — effortless for brunch or an afternoon out. Relaxed fit, elasticated waist, and a hem that moves with you.',
    care: 'Gentle machine wash cold. Do not tumble dry. Iron on low heat.',
    tags: ['Brunch', 'Everyday'],
    skuCode: 'DR-001',
  },
  {
    folder: 'Dusty rose flare dress',
    drive: 'drive-1',
    name: 'Dusty Rose Flare Dress',
    slug: 'dusty-rose-flare-dress',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 7500,
    colour: 'Dusty Rose',
    fabric: 'Chiffon',
    description:
      'Soft dusty rose chiffon cut into a gentle flare — feminine without trying. Pairs as easily with sneakers as it does with heels.',
    care: 'Dry clean recommended. Hand wash cold if needed.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'DR-002',
  },
  {
    folder: 'Fuchsia Calm Dress',
    drive: 'drive-1',
    name: 'Fuchsia Calm Dress',
    slug: 'fuchsia-calm-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 8500,
    colour: 'Fuchsia',
    fabric: 'Georgette',
    description:
      'Bold fuchsia georgette draped in clean lines — the kind of dress that commands a room quietly. Fluid fall, minimal embellishment, maximum presence.',
    care: 'Dry clean only.',
    tags: ['Evening', 'Brunch'],
    skuCode: 'DR-003',
  },
  {
    folder: 'Peach art deco dress',
    drive: 'drive-1',
    name: 'Peach Art Deco Dress',
    slug: 'peach-art-deco-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 9500,
    colour: 'Peach',
    fabric: 'Satin',
    description:
      'Art deco-inspired geometric panels in warm peach satin — structured elegance for evening occasions and festive dinners. Invisible zip closure, fully lined.',
    care: 'Dry clean only.',
    tags: ['Evening', 'Sangeet'],
    skuCode: 'DR-004',
  },
  {
    folder: 'crimson edge sleeveless dress',
    drive: 'drive-1',
    name: 'Crimson Edge Dress',
    slug: 'crimson-edge-dress',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 7500,
    colour: 'Crimson',
    fabric: 'Crepe',
    description:
      'Sharp crimson crepe with a sleeveless cut and clean-edged hem — the dress for every woman who knows exactly what she wants. Understated power dressing.',
    care: 'Gentle machine wash cold. Do not wring.',
    tags: ['Evening', 'Workwear'],
    skuCode: 'DR-005',
  },
  {
    folder: 'Deep plum dress',
    drive: 'drive-2',
    name: 'Deep Plum Dress',
    slug: 'deep-plum-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 8500,
    colour: 'Deep Plum',
    fabric: 'Georgette',
    description:
      'Deep plum georgette that drapes in soft, flowing folds — rich colour, lighter-than-air feel. Evening occasions and festive gatherings await.',
    care: 'Dry clean only.',
    tags: ['Evening', 'Sangeet'],
    skuCode: 'DR-006',
  },
  {
    folder: 'lavender periwinkle',
    drive: 'drive-2',
    name: 'Lavender Periwinkle Dress',
    slug: 'lavender-periwinkle-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 8500,
    colour: 'Lavender',
    fabric: 'Chiffon',
    description:
      'A dreamy lavender-periwinkle chiffon dress that blurs the line between blue and violet. Lightweight, ethereal, and made for soft summer evenings.',
    care: 'Hand wash cold. Dry flat.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'DR-007',
  },
  {
    folder: 'off white knotted dress',
    drive: 'drive-2',
    name: 'Off White Knotted Dress',
    slug: 'off-white-knotted-dress',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 9500,
    colour: 'Off White',
    fabric: 'Cotton Linen Blend',
    description:
      'An off-white knotted front dress in breathable cotton-linen — relaxed elegance that travels well. The front knot detail adds easy dimension without fuss.',
    care: 'Machine wash cold. Lay flat to dry.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'DR-008',
  },
  {
    folder: 'olive green',
    drive: 'drive-2',
    name: 'Olive Green Dress',
    slug: 'olive-green-dress',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 8500,
    colour: 'Olive Green',
    fabric: 'Cotton',
    description:
      'Muted olive green cotton that works as hard as you do — from desk to dinner without skipping a beat. Relaxed A-line silhouette with practical pockets.',
    care: 'Machine wash cold. Tumble dry low.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'DR-009',
    imgExt: 'png',
  },
  {
    folder: 'periwinkle -2',
    drive: 'drive-2',
    name: 'Periwinkle Dress',
    slug: 'periwinkle-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 8500,
    colour: 'Periwinkle',
    fabric: 'Chiffon',
    description:
      'Cool periwinkle chiffon in a graceful cut — the kind of blue that flatters every skin tone. Light enough for summer, elegant enough for evenings.',
    care: 'Hand wash cold. Dry flat.',
    tags: ['Everyday', 'Haldi'],
    skuCode: 'DR-010',
  },
  {
    folder: 'pink bridesmaid',
    drive: 'drive-2',
    name: 'Pink Bridesmaid Dress',
    slug: 'pink-bridesmaid-dress',
    category: 'dresses',
    subLine: 'THE ATELIER',
    price: 12500,
    colour: 'Pink',
    fabric: 'Satin',
    description:
      'A soft-pink satin bridesmaid dress with a figure-flattering silhouette and subtle sheen. Designed to photograph beautifully and feel comfortable all day.',
    care: 'Dry clean only.',
    tags: ['Wedding', 'Sangeet'],
    skuCode: 'DR-011',
  },
  {
    folder: 'plum dress',
    drive: 'drive-2',
    name: 'Plum Dress',
    slug: 'plum-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 8500,
    colour: 'Plum',
    fabric: 'Georgette',
    description:
      'Rich plum georgette in a draped silhouette — confident evening dressing that needs nothing extra. The colour alone does the talking.',
    care: 'Dry clean only.',
    tags: ['Evening'],
    skuCode: 'DR-012',
  },
  {
    folder: 'purple gold flower',
    drive: 'drive-2',
    name: 'Purple Gold Flower Dress',
    slug: 'purple-gold-flower-dress',
    category: 'dresses',
    subLine: 'THE ATELIER',
    price: 11500,
    colour: 'Purple',
    fabric: 'Silk Blend',
    description:
      'A deep-purple silk blend with gold floral embroidery at the hem — crafted for festive occasions that deserve your full attention. Hand-finished details throughout.',
    care: 'Dry clean only.',
    tags: ['Sangeet', 'Mehendi'],
    skuCode: 'DR-013',
  },
  {
    folder: 'skin peach satin dress',
    drive: 'drive-2',
    name: 'Skin Peach Satin Dress',
    slug: 'skin-peach-satin-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 10500,
    colour: 'Skin Peach',
    fabric: 'Satin',
    description:
      'Skin-toned peach satin with a liquid drape — the evening dress that looks like it was poured on. Subtle, sophisticated, unforgettable.',
    care: 'Dry clean only.',
    tags: ['Evening'],
    skuCode: 'DR-014',
  },
  {
    folder: 'violet silk',
    drive: 'drive-2',
    name: 'Violet Silk Dress',
    slug: 'violet-silk-dress',
    category: 'dresses',
    subLine: 'THE DRAPE',
    price: 9500,
    colour: 'Violet',
    fabric: 'Pure Silk',
    description:
      'Pure silk in a deep violet hue — the kind of dress inherited, not just worn. Fluid, weightless, and unmistakably luxurious.',
    care: 'Dry clean only.',
    tags: ['Evening', 'Sangeet'],
    skuCode: 'DR-015',
  },
  {
    folder: 'white drawstring',
    drive: 'drive-2',
    name: 'White Drawstring Dress',
    slug: 'white-drawstring-dress',
    category: 'dresses',
    subLine: 'THE EDIT',
    price: 8500,
    colour: 'White',
    fabric: 'Cotton',
    description:
      'Clean white cotton with a drawstring waist — the everyday dress perfected. Goes from morning errands to afternoon meetings without a second thought.',
    care: 'Machine wash cold. Do not bleach.',
    tags: ['Everyday'],
    skuCode: 'DR-016',
  },

  // ─────────────────────────────────────────────
  //  SEPARATES (SP-001 to SP-013)
  // ─────────────────────────────────────────────
  {
    folder: 'Amber glow button top',
    drive: 'drive-1',
    name: 'Amber Glow Button Top',
    slug: 'amber-glow-button-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Amber',
    fabric: 'Viscose',
    description:
      'Warm amber viscose with a neat button-down front — the top that makes any outfit look considered. Tuck it in or wear it loose; either way works.',
    care: 'Hand wash cold. Dry flat.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-001',
  },
  {
    folder: 'Champagne Glow Top',
    drive: 'drive-1',
    name: 'Champagne Glow Top',
    slug: 'champagne-glow-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Champagne',
    fabric: 'Satin',
    description:
      'Champagne satin with a soft glow that catches the light. Pairs beautifully with high-waisted trousers or a tailored skirt for effortless evening polish.',
    care: 'Dry clean recommended.',
    tags: ['Evening', 'Brunch'],
    skuCode: 'SP-002',
  },
  {
    folder: 'Dusty Rose Drift Top',
    drive: 'drive-1',
    name: 'Dusty Rose Drift Top',
    slug: 'dusty-rose-drift-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Dusty Rose',
    fabric: 'Chiffon',
    description:
      'Dusty rose chiffon that drifts at the hem — romantic layering that feels effortless. Wears over anything and makes everything better.',
    care: 'Hand wash cold. Dry flat.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-003',
  },
  {
    folder: 'Rose gold draped top',
    drive: 'drive-1',
    name: 'Rose Gold Draped Top',
    slug: 'rose-gold-draped-top',
    category: 'separates',
    subLine: 'THE DRAPE',
    price: 6500,
    colour: 'Rose Gold',
    fabric: 'Satin',
    description:
      'Rose gold satin draped across the body in asymmetric folds — evening sophistication without a single stitch of effort from your side.',
    care: 'Dry clean only.',
    tags: ['Evening', 'Brunch'],
    skuCode: 'SP-004',
  },
  {
    folder: 'Rose gold mandarin style',
    drive: 'drive-1',
    name: 'Rose Gold Mandarin Top',
    slug: 'rose-gold-mandarin-top',
    category: 'separates',
    subLine: 'THE DRAPE',
    price: 6500,
    colour: 'Rose Gold',
    fabric: 'Silk Blend',
    description:
      'A mandarin collar in rose gold silk blend — East-meets-West dressing at its most refined. Structured enough for the office, elegant enough for after.',
    care: 'Dry clean only.',
    tags: ['Workwear', 'Everyday'],
    skuCode: 'SP-005',
  },
  {
    folder: 'golden hour top (peach)',
    drive: 'drive-1',
    name: 'Golden Hour Top',
    slug: 'golden-hour-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Peach',
    fabric: 'Viscose',
    description:
      'Warm peach viscose cut for the golden hour — soft, relaxed, and glowing. Works with everything in your wardrobe, argues with nothing.',
    care: 'Machine wash cold. Lay flat to dry.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-006',
  },
  {
    folder: 'Brown silk top',
    drive: 'drive-2',
    name: 'Brown Silk Top',
    slug: 'brown-silk-top',
    category: 'separates',
    subLine: 'THE DRAPE',
    price: 6500,
    colour: 'Brown',
    fabric: 'Pure Silk',
    description:
      'Rich chocolate brown pure silk — serious fabric, easy wearing. Tuck into wide-leg trousers for instant boardroom authority.',
    care: 'Dry clean only.',
    tags: ['Workwear', 'Evening'],
    skuCode: 'SP-007',
  },
  {
    folder: 'blue embroidery shirt',
    drive: 'drive-2',
    name: 'Blue Embroidery Shirt',
    slug: 'blue-embroidery-shirt',
    category: 'separates',
    subLine: 'THE ATELIER',
    price: 7500,
    colour: 'Blue',
    fabric: 'Cotton',
    description:
      'Crisp blue cotton with hand-embroidered floral details at the collar and cuffs — the shirt that turns a simple outfit into a statement. Made to be noticed.',
    care: 'Gentle machine wash cold. Iron inside out.',
    tags: ['Workwear', 'Evening'],
    skuCode: 'SP-008',
  },
  {
    folder: 'dolman purple',
    drive: 'drive-2',
    name: 'Dolman Purple Top',
    slug: 'dolman-purple-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Purple',
    fabric: 'Jersey',
    description:
      'Purple jersey with a dolman sleeve cut — the most comfortable top you will wear this season, and the most effortlessly stylish one too.',
    care: 'Machine wash cold. Tumble dry low.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-009',
  },
  {
    folder: 'earthy tones top',
    drive: 'drive-2',
    name: 'Earthy Tones Top',
    slug: 'earthy-tones-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Earthy Brown',
    fabric: 'Cotton Linen Blend',
    description:
      'Earthy terracotta-toned cotton linen that grounds any outfit — lived-in texture, considered silhouette. The top that pairs with everything and apologises for nothing.',
    care: 'Machine wash cold. Lay flat to dry.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'SP-010',
  },
  {
    folder: 'light blue top',
    drive: 'drive-2',
    name: 'Light Blue Top',
    slug: 'light-blue-top',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'Light Blue',
    fabric: 'Cotton',
    description:
      'Clean light blue cotton in a relaxed silhouette — the top equivalent of a clear sky. Easy, versatile, endlessly wearable.',
    care: 'Machine wash cold. Do not bleach.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-011',
  },
  {
    folder: 'white cardigan',
    drive: 'drive-2',
    name: 'White Cardigan',
    slug: 'white-cardigan',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'White',
    fabric: 'Cotton Knit',
    description:
      'Crisp white cotton knit cardigan — the layer you reach for without thinking. Styled open over dresses or closed as a top; both look intentional.',
    care: 'Hand wash cold. Dry flat. Do not wring.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'SP-012',
  },
  {
    folder: 'white translucent shirt',
    drive: 'drive-2',
    name: 'White Translucent Shirt',
    slug: 'white-translucent-shirt',
    category: 'separates',
    subLine: 'THE EDIT',
    price: 5500,
    colour: 'White',
    fabric: 'Voile',
    description:
      'Sheer white voile with an oversized, relaxed fit — effortlessly editorial. Layer over a bralette or camisole for a look that is undone in the best way.',
    care: 'Hand wash cold. Dry flat.',
    tags: ['Everyday', 'Brunch'],
    skuCode: 'SP-013',
  },

  // ─────────────────────────────────────────────
  //  CO-ORDS (CO-001 to CO-004)
  // ─────────────────────────────────────────────
  {
    folder: 'olive top and skirt',
    drive: 'drive-2',
    name: 'Olive Top & Skirt Co-Ord',
    slug: 'olive-top-skirt-coord',
    category: 'co-ords',
    subLine: 'THE EDIT',
    price: 12500,
    colour: 'Olive',
    fabric: 'Cotton Blend',
    description:
      'Olive cotton blend co-ord — cropped top and midi skirt designed as a set so the proportions are already perfect. Wear together for impact, separately for versatility.',
    care: 'Machine wash cold together to preserve colour match.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'CO-001',
  },
  {
    folder: 'white bomber + dress',
    drive: 'drive-2',
    name: 'White Bomber & Dress Set',
    slug: 'white-bomber-dress-set',
    category: 'co-ords',
    subLine: 'THE DRAPE',
    price: 14500,
    colour: 'White',
    fabric: 'Satin',
    description:
      'A sleek white satin slip dress with a matching bomber jacket — the set that takes you from dinner to dancing. Equal parts casual and luxe.',
    care: 'Dry clean recommended.',
    tags: ['Evening', 'Brunch'],
    skuCode: 'CO-002',
  },
  {
    folder: 'white drawstring + rose bomber',
    drive: 'drive-2',
    name: 'White Drawstring & Rose Bomber',
    slug: 'white-drawstring-rose-bomber',
    category: 'co-ords',
    subLine: 'THE DRAPE',
    price: 14500,
    colour: 'White',
    fabric: 'Cotton Blend',
    description:
      'White drawstring trousers paired with a rose-toned bomber jacket — relaxed and polished at the same time. The co-ord that makes getting dressed easy.',
    care: 'Machine wash cold. Do not tumble dry.',
    tags: ['Everyday'],
    skuCode: 'CO-003',
  },
  {
    folder: 'white top with denim jacket',
    drive: 'drive-2',
    name: 'White Top & Denim Skirt Set',
    slug: 'white-top-denim-skirt-set',
    category: 'co-ords',
    subLine: 'THE EDIT',
    price: 13500,
    colour: 'White',
    fabric: 'Denim / Cotton',
    description:
      'A clean white top paired with a straight-cut denim skirt — the set that looks thrown together in the best possible way. Classic casual perfected.',
    care: 'Machine wash cold. Tumble dry low.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'CO-004',
  },

  // ─────────────────────────────────────────────
  //  KURTA SETS (KS-001)
  // ─────────────────────────────────────────────
  {
    folder: 'cyanish Blue kurti',
    drive: 'drive-2',
    name: 'Cyanish Blue Kurti Set',
    slug: 'cyanish-blue-kurti-set',
    category: 'kurta-sets',
    subLine: 'THE EDIT',
    price: 8500,
    colour: 'Cyan Blue',
    fabric: 'Cotton',
    description:
      'A cyanish-blue kurti set in crisp cotton — fresh, modern Indian-wear that is as comfortable as it is presentable. Straight-cut kurta with matching bottoms.',
    care: 'Machine wash cold. Dry in shade.',
    tags: ['Everyday', 'Workwear'],
    skuCode: 'KS-001',
  },
]

/**
 * Ethnic products (Sarees + Lehengas) — images fetched from Unsplash CDN.
 * Each product has exactly ONE hero Unsplash image ID.
 * The upload script fetches, converts to WebP, and uploads to storage.
 */
export const ETHNIC_PRODUCTS = [
  // ─────────────────────────────────────────────
  //  SAREES (SR-001 to SR-004)
  // ─────────────────────────────────────────────
  {
    name: 'The Noor Saree',
    slug: 'the-noor-saree',
    category: 'sarees',
    subLine: 'THE DRAPE',
    price: 28000,
    colour: 'Dusty Rose',
    fabric: 'Georgette',
    description:
      'The Noor Saree — dusty rose georgette with delicate thread embroidery at the pallu. Draped in the Nivi style for a silhouette that is both traditional and effortless.',
    care: 'Dry clean only. Store in muslin pouch.',
    tags: ['Wedding', 'Sangeet', 'Mehendi'],
    skuCode: 'SR-001',
    unsplashId: 'photo-1727430228383-aa1fb59db8bf',
  },
  {
    name: 'The Jade Drape',
    slug: 'the-jade-drape',
    category: 'sarees',
    subLine: 'THE DRAPE',
    price: 24000,
    colour: 'Emerald Green',
    fabric: 'Pure Silk',
    description:
      'Emerald green pure silk saree with gold zari borders — the Jade Drape is Possah\'s homage to heritage weaves and modern sensibility. Lustrous, weighty, and magnificent.',
    care: 'Dry clean only. Store in muslin pouch.',
    tags: ['Wedding', 'Festive', 'Sangeet'],
    skuCode: 'SR-002',
    unsplashId: 'photo-1679006831648-7c9ea12e5807',
  },
  {
    name: 'The Ember Saree',
    slug: 'the-ember-saree',
    category: 'sarees',
    subLine: 'THE ATELIER',
    price: 35000,
    colour: 'Crimson & Gold',
    fabric: 'Banarasi Silk',
    description:
      'Crimson Banarasi silk with gold woven motifs — the Ember Saree is a bridal masterpiece made for the woman who chooses red not as a tradition but as a statement.',
    care: 'Dry clean only. Store separately.',
    tags: ['Wedding', 'Bridal', 'Sangeet'],
    skuCode: 'SR-003',
    unsplashId: 'photo-1769500804057-ca1391bf4617',
  },
  {
    name: 'The Dusk Saree',
    slug: 'the-dusk-saree',
    category: 'sarees',
    subLine: 'THE VAULT',
    price: 22000,
    colour: 'Midnight Blue',
    fabric: 'Organza',
    description:
      'Midnight blue organza with scattered gold sequins — the Dusk Saree belongs to the hour between sundown and starlight. Ethereal, dreamy, impossible to forget.',
    care: 'Dry clean only. Handle with care.',
    tags: ['Evening', 'Festive', 'Sangeet'],
    skuCode: 'SR-004',
    unsplashId: 'photo-1641699862936-be9f49b1c38d',
  },

  // ─────────────────────────────────────────────
  //  LEHENGAS (LH-001 to LH-004)
  // ─────────────────────────────────────────────
  {
    name: 'The Scarlet Lehenga',
    slug: 'the-scarlet-lehenga',
    category: 'lehengas',
    subLine: 'THE ATELIER',
    price: 65000,
    colour: 'Red & Gold',
    fabric: 'Raw Silk',
    description:
      'The Scarlet Lehenga — red raw silk with intricate gold zardozi embroidery. A bridal lehenga built for the woman who wants her entrance remembered long after the night ends.',
    care: 'Dry clean only. Store flat in box.',
    tags: ['Bridal', 'Wedding', 'Sangeet'],
    skuCode: 'LH-001',
    unsplashId: 'photo-1762201698238-bf412e297016',
  },
  {
    name: 'The Saffron Lehenga',
    slug: 'the-saffron-lehenga',
    category: 'lehengas',
    subLine: 'THE EDIT',
    price: 45000,
    colour: 'Saffron Yellow',
    fabric: 'Silk',
    description:
      'Saffron yellow silk lehenga with maroon border embroidery — joyful, festive, and deeply rooted in celebration. Made for haldi ceremonies and mehndi mornings.',
    care: 'Dry clean only.',
    tags: ['Haldi', 'Mehendi', 'Festive'],
    skuCode: 'LH-002',
    unsplashId: 'photo-1767955694884-d4bf352c23c2',
  },
  {
    name: 'The Pearl Lehenga',
    slug: 'the-pearl-lehenga',
    category: 'lehengas',
    subLine: 'THE ATELIER',
    price: 55000,
    colour: 'Ivory & Gold',
    fabric: 'Net over Satin',
    description:
      'Ivory net over satin with gold thread and pearl embellishments — the Pearl Lehenga is quiet luxury at its most precise. For the bride who chooses elegance over ceremony.',
    care: 'Dry clean only. Store in provided garment bag.',
    tags: ['Bridal', 'Wedding'],
    skuCode: 'LH-003',
    unsplashId: 'photo-1601432093209-8af1fd74b054',
  },
  {
    name: 'The Sage Lehenga',
    slug: 'the-sage-lehenga',
    category: 'lehengas',
    subLine: 'THE EDIT',
    price: 48000,
    colour: 'Forest Green',
    fabric: 'Velvet',
    description:
      'Forest green velvet lehenga with subtle gold piping — a non-bridal choice that outshines the bridal party. Opulent texture, measured silhouette.',
    care: 'Dry clean only.',
    tags: ['Wedding', 'Sangeet', 'Festive'],
    skuCode: 'LH-004',
    unsplashId: 'photo-1619715613791-89d35b51ff81',
  },
]

export const ALL_PRODUCTS = [...LOCAL_PRODUCTS, ...ETHNIC_PRODUCTS]

/** All valid occasion tags */
export const OCCASION_TAGS = [
  'Everyday', 'Brunch', 'Workwear', 'Evening',
  'Sangeet', 'Mehendi', 'Haldi', 'Wedding', 'Bridal', 'Festive',
]

/** Sizes for all variants */
export const SIZES = ['S', 'M', 'L', 'XL']

/** Stock per variant */
export const STOCK_PER_VARIANT = 10
