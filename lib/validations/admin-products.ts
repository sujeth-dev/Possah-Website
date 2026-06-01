import { z } from 'zod'

export const OccasionTagEnum = z.enum([
  'Everyday', 'Brunch', 'Workwear', 'Evening',
  'Cocktail', 'Sangeet', 'Mehendi', 'Haldi', 'Wedding',
])

export const SubLineEnum = z.enum(['THE DRAPE', 'THE EDIT', 'THE ATELIER', 'THE VAULT'])

export const VariantSchema = z.object({
  id:          z.string().optional(),
  colour_name: z.string().min(1, 'Colour name required'),
  colour_hex:  z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex colour'),
  size:        z.string().min(1, 'Size required'),
  stock_qty:   z.number().int().min(0),
})

export const ImageSchema = z.object({
  id:       z.string().optional(),
  url:      z.string().url('Invalid image URL'),
  alt:      z.string().max(200).optional().nullable(),
  position: z.number().int().min(0),
})

export const ProductCreateSchema = z.object({
  name:               z.string().min(1, 'Name required').max(200),
  slug:               z.string().min(1, 'Slug required').regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers, hyphens only'),
  description:        z.string().max(2000).optional().nullable(),
  sub_line:           SubLineEnum.optional().nullable(),
  category_id:        z.string().uuid().optional().nullable(),
  price:              z.number().positive('Price must be positive'),
  compare_price:      z.number().positive().optional().nullable(),
  fabric:             z.string().max(200).optional().nullable(),
  craft_description:  z.string().max(1000).optional().nullable(),
  care_instructions:  z.string().max(500).optional().nullable(),
  drape_guide:        z.string().max(500).optional().nullable(),
  craft_story_title:  z.string().max(200).optional().nullable(),
  craft_story_body:   z.string().max(3000).optional().nullable(),
  craft_story_image:  z.string().url().optional().nullable(),
  audio_url:          z.string().url().optional().nullable(),
  meta_title:         z.string().max(70).optional().nullable(),
  meta_description:   z.string().max(160).optional().nullable(),
  is_new_arrival:     z.boolean().default(false),
  is_top_selling:     z.boolean().default(false),
  is_featured:        z.boolean().default(false),
  is_festive:         z.boolean().default(false),
  is_bridal:          z.boolean().default(false),
  is_active:          z.boolean().default(true),
  tags:               z.array(OccasionTagEnum).default([]),
  variants:           z.array(VariantSchema).min(1, 'At least one variant required'),
  images:             z.array(ImageSchema).default([]),
})

export type ProductCreateInput = z.infer<typeof ProductCreateSchema>
export type ProductUpdateInput = Partial<ProductCreateInput>
export type VariantInput = z.infer<typeof VariantSchema>
export type ImageInput = z.infer<typeof ImageSchema>
