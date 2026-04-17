Initialising login role...
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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_products: {
        Row: {
          booking_id: string
          id: string
          product_id: string | null
          product_name: string
          product_price: number
          quantity: number | null
        }
        Insert: {
          booking_id: string
          id?: string
          product_id?: string | null
          product_name: string
          product_price: number
          quantity?: number | null
        }
        Update: {
          booking_id?: string
          id?: string
          product_id?: string | null
          product_name?: string
          product_price?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_products_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          booking_id: string
          duration_minutes: number
          id: string
          service_id: string | null
          service_name: string
          service_price: number
        }
        Insert: {
          booking_id: string
          duration_minutes: number
          id?: string
          service_id?: string | null
          service_name: string
          service_price: number
        }
        Update: {
          booking_id?: string
          duration_minutes?: number
          id?: string
          service_id?: string | null
          service_name?: string
          service_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string
          commission_amount: number | null
          created_at: string | null
          date: string
          deposit_amount: number | null
          deposit_paid: boolean | null
          dynamic_extra_kopecks: number
          dynamic_pricing_label: string | null
          end_time: string
          id: string
          master_id: string
          master_notes: string | null
          next_visit_suggestion: string | null
          notes: string | null
          referral_code_used: string | null
          source: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"] | null
          status_changed_at: string | null
          total_price: number | null
          total_products_price: number | null
          total_services_price: number | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone: string
          commission_amount?: number | null
          created_at?: string | null
          date: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          dynamic_extra_kopecks?: number
          dynamic_pricing_label?: string | null
          end_time: string
          id?: string
          master_id: string
          master_notes?: string | null
          next_visit_suggestion?: string | null
          notes?: string | null
          referral_code_used?: string | null
          source?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          status_changed_at?: string | null
          total_price?: number | null
          total_products_price?: number | null
          total_services_price?: number | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string
          commission_amount?: number | null
          created_at?: string | null
          date?: string
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          dynamic_extra_kopecks?: number
          dynamic_pricing_label?: string | null
          end_time?: string
          id?: string
          master_id?: string
          master_notes?: string | null
          next_visit_suggestion?: string | null
          notes?: string | null
          referral_code_used?: string | null
          source?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          status_changed_at?: string | null
          total_price?: number | null
          total_products_price?: number | null
          total_services_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_master_relations: {
        Row: {
          average_check: number | null
          client_id: string
          client_tag: string | null
          created_at: string | null
          favorite_service_id: string | null
          has_referral_discount_active: boolean | null
          id: string
          is_vip: boolean | null
          last_visit_at: string | null
          loyalty_points: number | null
          master_id: string
          total_spent: number | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          average_check?: number | null
          client_id: string
          client_tag?: string | null
          created_at?: string | null
          favorite_service_id?: string | null
          has_referral_discount_active?: boolean | null
          id?: string
          is_vip?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          master_id: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          average_check?: number | null
          client_id?: string
          client_tag?: string | null
          created_at?: string | null
          favorite_service_id?: string | null
          has_referral_discount_active?: boolean | null
          id?: string
          is_vip?: boolean | null
          last_visit_at?: string | null
          loyalty_points?: number | null
          master_id?: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_master_relations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_master_relations_favorite_service_id_fkey"
            columns: ["favorite_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_master_relations_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          ambassador_level: number | null
          created_at: string | null
          id: string
          referral_code: string | null
          total_bookings: number | null
          total_masters_invited: number | null
        }
        Insert: {
          ambassador_level?: number | null
          created_at?: string | null
          id: string
          referral_code?: string | null
          total_bookings?: number | null
          total_masters_invited?: number | null
        }
        Update: {
          ambassador_level?: number | null
          created_at?: string | null
          id?: string
          referral_code?: string | null
          total_bookings?: number | null
          total_masters_invited?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_promocodes: {
        Row: {
          client_id: string
          created_at: string | null
          discount_percentage: number
          id: string
          is_used: boolean
          master_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_used?: boolean
          master_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_used?: boolean
          master_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_promocodes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_promocodes_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_deals: {
        Row: {
          booking_id: string | null
          claimed_by: string | null
          created_at: string | null
          discount_pct: number
          expires_at: string
          id: string
          master_id: string
          original_price: number
          service_id: string | null
          service_name: string
          slot_date: string
          slot_time: string
          status: string
        }
        Insert: {
          booking_id?: string | null
          claimed_by?: string | null
          created_at?: string | null
          discount_pct: number
          expires_at: string
          id?: string
          master_id: string
          original_price: number
          service_id?: string | null
          service_name: string
          slot_date: string
          slot_time: string
          status?: string
        }
        Update: {
          booking_id?: string | null
          claimed_by?: string | null
          created_at?: string | null
          discount_pct?: number
          expires_at?: string
          id?: string
          master_id?: string
          original_price?: number
          service_id?: string | null
          service_name?: string
          slot_date?: string
          slot_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_deals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_deals_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_deals_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_deals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          applicable_services: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          master_id: string
          name: string
          reward_service_id: string | null
          reward_type: string
          reward_value: number | null
          target_visits: number
        }
        Insert: {
          applicable_services?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          master_id: string
          name: string
          reward_service_id?: string | null
          reward_type: string
          reward_value?: number | null
          target_visits: number
        }
        Update: {
          applicable_services?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          master_id?: string
          name?: string
          reward_service_id?: string | null
          reward_type?: string
          reward_value?: number | null
          target_visits?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_programs_reward_service_id_fkey"
            columns: ["reward_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      master_client_notes: {
        Row: {
          client_phone: string
          id: string
          master_id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          client_phone: string
          id?: string
          master_id: string
          note_text?: string
          updated_at?: string
        }
        Update: {
          client_phone?: string
          id?: string
          master_id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_client_notes_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_partners: {
        Row: {
          created_at: string | null
          id: string
          master_id: string
          partner_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_id: string
          partner_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          master_id?: string
          partner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "master_partners_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_profiles: {
        Row: {
          accent_color: string | null
          address: string | null
          avatar_emoji: string
          bio: string | null
          business_name: string | null
          cabinet: string | null
          categories: string[] | null
          city: string | null
          commission_rate: number | null
          created_at: string | null
          dynamic_pricing_extra_earned: number
          floor: string | null
          has_seen_tour: boolean
          id: string
          instagram_url: string | null
          is_published: boolean | null
          latitude: number | null
          longitude: number | null
          mood_theme: string | null
          pricing_rules: Json | null
          rating: number | null
          rating_count: number | null
          referral_code: string
          referred_by: string | null
          seen_tours: Json
          slug: string
          studio_id: string | null
          subscription_expires_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id: string | null
          telegram_connect_token: string | null
          telegram_url: string | null
          timezone: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          avatar_emoji?: string
          bio?: string | null
          business_name?: string | null
          cabinet?: string | null
          categories?: string[] | null
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          dynamic_pricing_extra_earned?: number
          floor?: string | null
          has_seen_tour?: boolean
          id: string
          instagram_url?: string | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mood_theme?: string | null
          pricing_rules?: Json | null
          rating?: number | null
          rating_count?: number | null
          referral_code: string
          referred_by?: string | null
          seen_tours?: Json
          slug: string
          studio_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id?: string | null
          telegram_connect_token?: string | null
          telegram_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          avatar_emoji?: string
          bio?: string | null
          business_name?: string | null
          cabinet?: string | null
          categories?: string[] | null
          city?: string | null
          commission_rate?: number | null
          created_at?: string | null
          dynamic_pricing_extra_earned?: number
          floor?: string | null
          has_seen_tour?: boolean
          id?: string
          instagram_url?: string | null
          is_published?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mood_theme?: string | null
          pricing_rules?: Json | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string
          referred_by?: string | null
          seen_tours?: Json
          slug?: string
          studio_id?: string | null
          subscription_expires_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          telegram_chat_id?: string | null
          telegram_connect_token?: string | null
          telegram_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "master_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_profiles_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      master_time_off: {
        Row: {
          created_at: string | null
          end_date: string
          end_time: string | null
          id: string
          master_id: string
          start_date: string
          start_time: string | null
          type: Database["public"]["Enums"]["time_off_type"]
        }
        Insert: {
          created_at?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          master_id: string
          start_date: string
          start_time?: string | null
          type: Database["public"]["Enums"]["time_off_type"]
        }
        Update: {
          created_at?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          master_id?: string
          start_date?: string
          start_time?: string | null
          type?: Database["public"]["Enums"]["time_off_type"]
        }
        Relationships: [
          {
            foreignKeyName: "master_time_off_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"] | null
          created_at: string | null
          delay_days: number | null
          id: string
          is_active: boolean | null
          master_id: string
          message_template: string
          trigger_type: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          delay_days?: number | null
          id?: string
          is_active?: boolean | null
          master_id: string
          message_template: string
          trigger_type: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          delay_days?: number | null
          id?: string
          is_active?: boolean | null
          master_id?: string
          message_template?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"] | null
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          related_booking_id: string | null
          related_master_id: string | null
          sent_at: string | null
          title: string
          type: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          related_booking_id?: string | null
          related_master_id?: string | null
          sent_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          related_booking_id?: string | null
          related_master_id?: string | null
          sent_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_master_id_fkey"
            columns: ["related_master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          master_id: string
          status: string | null
          type: string
          wayfopay_order_ref: string | null
          wayfopay_response: Json | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          master_id: string
          status?: string | null
          type: string
          wayfopay_order_ref?: string | null
          wayfopay_response?: Json | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          master_id?: string
          status?: string | null
          type?: string
          wayfopay_order_ref?: string | null
          wayfopay_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_service_links: {
        Row: {
          id: string
          is_auto_suggest: boolean | null
          product_id: string
          service_id: string
        }
        Insert: {
          id?: string
          is_auto_suggest?: boolean | null
          product_id: string
          service_id: string
        }
        Update: {
          id?: string
          is_auto_suggest?: boolean | null
          product_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_service_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_service_links_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          emoji: string
          id: string
          image_url: string | null
          is_active: boolean | null
          master_id: string
          name: string
          price: number
          sort_order: number | null
          stock_quantity: number | null
          stock_unlimited: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          master_id: string
          name: string
          price: number
          sort_order?: number | null
          stock_quantity?: number | null
          stock_unlimited?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          master_id?: string
          name?: string
          price?: number
          sort_order?: number | null
          stock_quantity?: number | null
          stock_unlimited?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          telegram_chat_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      rebooking_reminders: {
        Row: {
          booking_id: string
          id: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          id?: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rebooking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_bonuses: {
        Row: {
          bonus_type: string
          bonus_value: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          master_id: string
          referral_id: string
        }
        Insert: {
          bonus_type: string
          bonus_value?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          master_id: string
          referral_id: string
        }
        Update: {
          bonus_type?: string
          bonus_value?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          master_id?: string
          referral_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_bonuses_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bonuses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          code: string
          created_at: string | null
          id: string
          owner_id: string
          owner_role: string
          target_master_id: string | null
          target_type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          owner_id: string
          owner_role: string
          target_master_id?: string | null
          target_type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          owner_id?: string
          owner_role?: string
          target_master_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_links_target_master_id_fkey"
            columns: ["target_master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string | null
          id: string
          invite_code: string
          invite_link: string
          invited_master_id: string | null
          inviter_client_id: string
          message: string | null
          registered_at: string | null
          status: Database["public"]["Enums"]["referral_status"] | null
          waiting_clients_count: number | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          invite_code: string
          invite_link: string
          invited_master_id?: string | null
          inviter_client_id: string
          message?: string | null
          registered_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          waiting_clients_count?: number | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          invite_code?: string
          invite_link?: string
          invited_master_id?: string | null
          inviter_client_id?: string
          message?: string | null
          registered_at?: string | null
          status?: Database["public"]["Enums"]["referral_status"] | null
          waiting_clients_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invited_master_id_fkey"
            columns: ["invited_master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_inviter_client_id_fkey"
            columns: ["inviter_client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          client_id: string
          client_name: string
          comment: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          master_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          client_id: string
          client_name?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          master_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          client_id?: string
          client_name?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          master_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_exceptions: {
        Row: {
          date: string
          end_time: string | null
          id: string
          is_day_off: boolean | null
          master_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          date: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          master_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          date?: string
          end_time?: string | null
          id?: string
          is_day_off?: boolean | null
          master_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_exceptions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          break_end: string | null
          break_start: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_working: boolean | null
          master_id: string
          start_time: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_working?: boolean | null
          master_id: string
          start_time: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_working?: boolean | null
          master_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string | null
          id: string
          master_id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          master_id: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          master_id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          buffer_minutes: number | null
          category: string
          category_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number
          emoji: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_popular: boolean | null
          master_id: string
          name: string
          price: number
          price_max: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          buffer_minutes?: number | null
          category?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          master_id: string
          name: string
          price: number
          price_max?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          buffer_minutes?: number | null
          category?: string
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          emoji?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          master_id?: string
          name?: string
          price?: number
          price_max?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_ip_logs: {
        Row: {
          created_at: string
          id: number
          ip_address: string
        }
        Insert: {
          created_at?: string
          id?: never
          ip_address: string
        }
        Update: {
          created_at?: string
          id?: never
          ip_address?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          id: string
          ip: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          phone?: string
        }
        Relationships: []
      }
      sms_otps: {
        Row: {
          created_at: string
          otp: string
          phone: string
        }
        Insert: {
          created_at?: string
          otp: string
          phone: string
        }
        Update: {
          created_at?: string
          otp?: string
          phone?: string
        }
        Relationships: []
      }
      sms_verify_attempts: {
        Row: {
          created_at: string
          id: number
          phone: string
        }
        Insert: {
          created_at?: string
          id?: never
          phone: string
        }
        Update: {
          created_at?: string
          id?: never
          phone?: string
        }
        Relationships: []
      }
      studio_members: {
        Row: {
          id: string
          joined_at: string | null
          master_id: string
          role: string
          studio_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          master_id: string
          role?: string
          studio_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          master_id?: string
          role?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_members_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string | null
          id: string
          invite_token: string
          invite_token_expires_at: string
          invite_token_hash: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invite_token: string
          invite_token_expires_at?: string
          invite_token_hash?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invite_token?: string
          invite_token_expires_at?: string
          invite_token_hash?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_auto_renew: boolean | null
          master_id: string
          payment_id: string | null
          starts_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_auto_renew?: boolean | null
          master_id: string
          payment_id?: string | null
          starts_at: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_auto_renew?: boolean | null
          master_id?: string
          payment_id?: string | null
          starts_at?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "master_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_otps: {
        Row: {
          created_at: string
          otp: string
          phone: string
        }
        Insert: {
          created_at?: string
          otp: string
          phone: string
        }
        Update: {
          created_at?: string
          otp?: string
          phone?: string
        }
        Relationships: []
      }
      waitlists: {
        Row: {
          created_at: string
          feature_slug: string
          id: string
          master_id: string
        }
        Insert: {
          created_at?: string
          feature_slug: string
          id?: string
          master_id: string
        }
        Update: {
          created_at?: string
          feature_slug?: string
          id?: string
          master_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_master_id_fkey"
            columns: ["master_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_log_sms_attempt: {
        Args: { max_attempts: number; p_phone: string; window_minutes?: number }
        Returns: boolean
      }
      check_and_log_sms_send: {
        Args: {
          ip_max_sends?: number
          ip_window_hours?: number
          p_ip: string
          p_phone: string
          phone_max_sends?: number
          phone_window_min?: number
        }
        Returns: string
      }
      generate_short_code: { Args: never; Returns: string }
      get_eligible_flash_deal_clients: {
        Args: { p_master_id: string; p_slot_timestamp: string }
        Returns: {
          client_id: string
        }[]
      }
      get_master_clients: {
        Args: { p_master_id: string }
        Returns: {
          average_check: number
          client_id: string
          client_name: string
          client_phone: string
          is_vip: boolean
          last_visit_at: string
          relation_id: string
          total_spent: number
          total_visits: number
        }[]
      }
      get_user_id_by_email: { Args: { p_email: string }; Returns: string }
      increment_client_master_invite_count: {
        Args: { p_client_id: string }
        Returns: undefined
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      day_of_week: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
      notification_channel: "push" | "telegram" | "sms"
      referral_status: "pending" | "registered" | "activated"
      subscription_tier: "starter" | "pro" | "studio"
      time_off_type: "vacation" | "day_off" | "short_day"
      user_role: "master" | "client" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      day_of_week: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      notification_channel: ["push", "telegram", "sms"],
      referral_status: ["pending", "registered", "activated"],
      subscription_tier: ["starter", "pro", "studio"],
      time_off_type: ["vacation", "day_off", "short_day"],
      user_role: ["master", "client", "admin"],
    },
  },
} as const
