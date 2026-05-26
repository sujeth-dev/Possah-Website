export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          role?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          session_id: string | null
          updated_at: string
          user_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          hero_image_url: string | null
          id: string
          name: string
          nav_section: string | null
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          name: string
          nav_section?: string | null
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image_url?: string | null
          id?: string
          name?: string
          nav_section?: string | null
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          expiry_date: string | null
          id: string
          is_active: boolean
          min_order_value: number
          type: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_order_value?: number
          type: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          min_order_value?: number
          type?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          value?: number
        }
        Relationships: []
      }
      gift_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          includes: Json
          is_active: boolean
          name: string
          price: number
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          includes?: Json
          is_active?: boolean
          name: string
          price: number
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          includes?: Json
          is_active?: boolean
          name?: string
          price?: number
          slug?: string
        }
        Relationships: []
      }
      homepage_config: {
        Row: {
          collection_banner: Json
          hero_slides: Json
          id: string
          new_arrival_ids: Json
          occasion_tiles: Json
          updated_at: string
        }
        Insert: {
          collection_banner?: Json
          hero_slides?: Json
          id?: string
          new_arrival_ids?: Json
          occasion_tiles?: Json
          updated_at?: string
        }
        Update: {
          collection_banner?: Json
          hero_slides?: Json
          id?: string
          new_arrival_ids?: Json
          occasion_tiles?: Json
          updated_at?: string
        }
        Relationships: []
      }
      journal_articles: {
        Row: {
          author: string
          body: string | null
          category: string
          created_at: string
          featured_image: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body?: string | null
          category: string
          created_at?: string
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string | null
          category?: string
          created_at?: string
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lookbook_looks: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          look_number: number
          lookbook_id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          look_number: number
          lookbook_id: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          look_number?: number
          lookbook_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookbook_looks_lookbook_id_fkey"
            columns: ["lookbook_id"]
            isOneToOne: false
            referencedRelation: "lookbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookbook_looks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lookbooks: {
        Row: {
          chapter_number: number
          collection_name: string
          concept_text: string | null
          created_at: string
          hero_image: string | null
          id: string
          is_active: boolean
          season: string
          theme_word: string
          year: number
        }
        Insert: {
          chapter_number: number
          collection_name: string
          concept_text?: string | null
          created_at?: string
          hero_image?: string | null
          id?: string
          is_active?: boolean
          season: string
          theme_word: string
          year: number
        }
        Update: {
          chapter_number?: number
          collection_name?: string
          concept_text?: string | null
          created_at?: string
          hero_image?: string | null
          id?: string
          is_active?: boolean
          season?: string
          theme_word?: string
          year?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          courier: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount: number
          fulfillment_status: string
          gateway_order_id: string | null
          gateway_payment_id: string | null
          gift_message: string | null
          id: string
          internal_notes: string | null
          is_gift: boolean
          line_items: Json
          order_number: string
          payment_gateway: string | null
          payment_status: string
          shipping_address: Json
          shipping_fee: number
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount_amount?: number
          fulfillment_status?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gift_message?: string | null
          id?: string
          internal_notes?: string | null
          is_gift?: boolean
          line_items?: Json
          order_number: string
          payment_gateway?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_fee?: number
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          courier?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount_amount?: number
          fulfillment_status?: string
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          gift_message?: string | null
          id?: string
          internal_notes?: string | null
          is_gift?: boolean
          line_items?: Json
          order_number?: string
          payment_gateway?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_fee?: number
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_look_links: {
        Row: {
          id: string
          linked_id: string
          position: number
          product_id: string
        }
        Insert: {
          id?: string
          linked_id: string
          position?: number
          product_id: string
        }
        Update: {
          id?: string
          linked_id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_look_links_linked_id_fkey"
            columns: ["linked_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_look_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          id: string
          product_id: string
          tag: string
        }
        Insert: {
          id?: string
          product_id: string
          tag: string
        }
        Update: {
          id?: string
          product_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          colour_hex: string
          colour_name: string
          id: string
          product_id: string
          size: string
          stock_qty: number
          updated_at: string
        }
        Insert: {
          colour_hex?: string
          colour_name: string
          id?: string
          product_id: string
          size: string
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          colour_hex?: string
          colour_name?: string
          id?: string
          product_id?: string
          size?: string
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audio_url: string | null
          care_instructions: string | null
          category_id: string | null
          compare_price: number | null
          craft_description: string | null
          craft_story_body: string | null
          craft_story_image: string | null
          craft_story_title: string | null
          created_at: string
          description: string | null
          drape_guide: string | null
          fabric: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_ready_to_ship: boolean
          is_top_selling: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          search_vector: unknown
          slug: string
          stock_qty: number
          sub_line: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          care_instructions?: string | null
          category_id?: string | null
          compare_price?: number | null
          craft_description?: string | null
          craft_story_body?: string | null
          craft_story_image?: string | null
          craft_story_title?: string | null
          created_at?: string
          description?: string | null
          drape_guide?: string | null
          fabric?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_ready_to_ship?: boolean
          is_top_selling?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price: number
          search_vector?: unknown
          slug: string
          stock_qty?: number
          sub_line?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          care_instructions?: string | null
          category_id?: string | null
          compare_price?: number | null
          craft_description?: string | null
          craft_story_body?: string | null
          craft_story_image?: string | null
          craft_story_title?: string | null
          created_at?: string
          description?: string | null
          drape_guide?: string | null
          fabric?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_ready_to_ship?: boolean
          is_top_selling?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          search_vector?: unknown
          slug?: string
          stock_qty?: number
          sub_line?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          reviewer_city: string | null
          reviewer_name: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          reviewer_city?: string | null
          reviewer_name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          reviewer_city?: string | null
          reviewer_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          announcement_text: string
          express_delivery_fee: number
          free_shipping_threshold: number
          id: string
          seo_description: string
          seo_og_image: string | null
          seo_title: string
          store_email: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          announcement_text?: string
          express_delivery_fee?: number
          free_shipping_threshold?: number
          id?: string
          seo_description?: string
          seo_og_image?: string | null
          seo_title?: string
          store_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          announcement_text?: string
          express_delivery_fee?: number
          free_shipping_threshold?: number
          id?: string
          seo_description?: string
          seo_og_image?: string | null
          seo_title?: string
          store_email?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_measurements: {
        Row: {
          bust_cm: number | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          updated_at: string
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          bust_cm?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          updated_at?: string
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          bust_cm?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          google_id: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          google_id?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          google_id?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      decrement_variant_stock: {
        Args: { p_qty: number; p_variant_id: string }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
