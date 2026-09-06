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
      categories: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          group_order: number
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          source_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name?: string
          group_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          group_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          source_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          created_at: string
          image_url: string | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          image_url?: string | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          image_url?: string | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          postal_code: string | null
          source: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          postal_code?: string | null
          source?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          postal_code?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          custom_text: string | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          unit_price_ils: number
          version: string | null
        }
        Insert: {
          custom_text?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          size?: string | null
          unit_price_ils?: number
          version?: string | null
        }
        Update: {
          custom_text?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          unit_price_ils?: number
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          credit_used_ils: number
          customer_id: string | null
          customer_name: string
          email: string | null
          id: string
          notes: string | null
          order_number: number
          paid_at: string | null
          payment_status: string
          phone: string
          referral_code: string | null
          sheet_synced_at: string | null
          shipped_at: string | null
          shipping_method: string
          status: string
          total_ils: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          credit_used_ils?: number
          customer_id?: string | null
          customer_name: string
          email?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_status?: string
          phone: string
          referral_code?: string | null
          sheet_synced_at?: string | null
          shipped_at?: string | null
          shipping_method?: string
          status?: string
          total_ils?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          credit_used_ils?: number
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          paid_at?: string | null
          payment_status?: string
          phone?: string
          referral_code?: string | null
          sheet_synced_at?: string | null
          shipped_at?: string | null
          shipping_method?: string
          status?: string
          total_ils?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: string
          category_id: string | null
          color: string | null
          created_at: string
          description: string | null
          extra_images: string[]
          home_rank: number
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          item_type: string
          name: string
          price_ils: number
          product_type: string
          shoe_tier: string | null
          sizes: string[]
          sort_order: number
          source_id: string | null
          sport: string
          supplier_model: string | null
          updated_at: string
        }
        Insert: {
          audience?: string
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          extra_images?: string[]
          home_rank?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          item_type?: string
          name: string
          price_ils?: number
          product_type?: string
          shoe_tier?: string | null
          sizes?: string[]
          sort_order?: number
          source_id?: string | null
          sport?: string
          supplier_model?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string
          category_id?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          extra_images?: string[]
          home_rank?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          item_type?: string
          name?: string
          price_ils?: number
          product_type?: string
          shoe_tier?: string | null
          sizes?: string[]
          sort_order?: number
          source_id?: string | null
          sport?: string
          supplier_model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credit_ils: number
          email: string | null
          full_name: string | null
          id: string
          payment_pref: string
          phone: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_ils?: number
          email?: string | null
          full_name?: string | null
          id: string
          payment_pref?: string
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_ils?: number
          email?: string | null
          full_name?: string | null
          id?: string
          payment_pref?: string
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          amount_ils: number
          buyer_label: string | null
          created_at: string
          id: string
          order_id: string | null
          referrer_id: string
        }
        Insert: {
          amount_ils?: number
          buyer_label?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referrer_id: string
        }
        Update: {
          amount_ils?: number
          buyer_label?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          kind: string
          order_number: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          kind: string
          order_number?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          order_number?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          image_url: string | null
          is_active: boolean
          message: string
          reply: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message: string
          reply?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          message?: string
          reply?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
