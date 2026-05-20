// Auto-generated types from Supabase schema.
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
// Until generated, this placeholder allows the project to compile.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          fabric: string | null
          craft_description: string | null
          care_instructions: string | null
          price: number
          compare_price: number | null
          category_id: string | null
          sub_line: 'THE DRAPE' | 'THE EDIT' | 'THE ATELIER' | 'THE VAULT' | null
          stock_qty: number
          is_featured: boolean
          is_new_arrival: boolean
          is_top_selling: boolean
          is_ready_to_ship: boolean
          is_active: boolean
          meta_title: string | null
          meta_description: string | null
          audio_url: string | null
          craft_story_title: string | null
          craft_story_body: string | null
          craft_story_image: string | null
          drape_guide: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt: string | null
          position: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_images']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          colour_name: string
          colour_hex: string
          size: string
          stock_qty: number
        }
        Insert: Database['public']['Tables']['product_variants']['Row']
        Update: Partial<Database['public']['Tables']['product_variants']['Row']>
      }
      product_tags: {
        Row: {
          id: string
          product_id: string
          tag: 'Everyday' | 'Brunch' | 'Workwear' | 'Evening' | 'Sangeet' | 'Mehendi' | 'Haldi' | 'Wedding'
        }
        Insert: Database['public']['Tables']['product_tags']['Row']
        Update: Partial<Database['public']['Tables']['product_tags']['Row']>
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          hero_image_url: string | null
          nav_section: string | null
          position: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          shipping_address: Json
          line_items: Json
          subtotal: number
          shipping_fee: number
          discount_amount: number
          coupon_code: string | null
          tax: number
          total: number
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
          fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_gateway: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          tracking_number: string | null
          courier: string | null
          internal_notes: string | null
          is_gift: boolean
          gift_message: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: 'percent' | 'flat' | 'free_shipping'
          value: number
          min_order_value: number
          expiry_date: string | null
          usage_limit: number | null
          usage_count: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['coupons']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['coupons']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          reviewer_name: string
          reviewer_city: string | null
          rating: number
          body: string
          is_approved: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      homepage_config: {
        Row: {
          id: string
          hero_slides: Json
          collection_banner: Json
          new_arrival_ids: Json
          occasion_tiles: Json
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['homepage_config']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['homepage_config']['Insert']>
      }
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: 'super_admin' | 'admin' | 'editor'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          google_id: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      user_measurements: {
        Row: {
          id: string
          user_id: string
          bust_cm: number | null
          waist_cm: number | null
          hips_cm: number | null
          height_cm: number | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_measurements']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_measurements']['Insert']>
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          label: string | null
          full_name: string
          phone: string
          address_line1: string
          address_line2: string | null
          city: string
          state: string
          pincode: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_addresses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_addresses']['Insert']>
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['wishlists']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>
      }
      gift_sets: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price: number
          image_url: string | null
          includes: Json
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gift_sets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['gift_sets']['Insert']>
      }
      journal_articles: {
        Row: {
          id: string
          slug: string
          title: string
          category: string
          author: string
          body: string | null
          featured_image: string | null
          is_featured: boolean
          published_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['journal_articles']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['journal_articles']['Insert']>
      }
      lookbooks: {
        Row: {
          id: string
          collection_name: string
          season: string
          year: number
          theme_word: string
          chapter_number: number
          hero_image: string | null
          concept_text: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lookbooks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lookbooks']['Insert']>
      }
      lookbook_looks: {
        Row: {
          id: string
          lookbook_id: string
          look_number: number
          image_url: string | null
          product_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['lookbook_looks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['lookbook_looks']['Insert']>
      }
      store_settings: {
        Row: {
          id:                      string
          announcement_text:       string
          store_email:             string
          whatsapp_number:         string
          free_shipping_threshold: number
          express_delivery_fee:    number
          seo_title:               string
          seo_description:         string
          seo_og_image:            string | null
          updated_at:              string
        }
        Insert: Partial<Database['public']['Tables']['store_settings']['Row']>
        Update: Partial<Database['public']['Tables']['store_settings']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
