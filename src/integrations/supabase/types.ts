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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string
          actor: string
          created_at: string
          id: string
          note: string | null
          target: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          id?: string
          note?: string | null
          target: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          id?: string
          note?: string | null
          target?: string
        }
        Relationships: []
      }
      app_likes: {
        Row: {
          created_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      app_owner: {
        Row: {
          id: string
          user_id: string
        }
        Insert: {
          id?: string
          user_id: string
        }
        Update: {
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          content: Json
          id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_live: boolean
          is_premium: boolean
          logo_url: string | null
          name: string
          sort_order: number
          stream_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          is_premium?: boolean
          logo_url?: string | null
          name: string
          sort_order?: number
          stream_url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          is_premium?: boolean
          logo_url?: string | null
          name?: string
          sort_order?: number
          stream_url?: string
        }
        Relationships: []
      }
      match_comments: {
        Row: {
          author: string
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          author: string
          body: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          author?: string
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      match_day: {
        Row: {
          away: string
          away_corners: number
          away_score: number
          away_shots: number
          away_yellow: number
          competition: string
          home: string
          home_corners: number
          home_score: number
          home_shots: number
          home_yellow: number
          id: string
          minute: string
          possession: number
          visible: boolean
        }
        Insert: {
          away?: string
          away_corners?: number
          away_score?: number
          away_shots?: number
          away_yellow?: number
          competition?: string
          home?: string
          home_corners?: number
          home_score?: number
          home_shots?: number
          home_yellow?: number
          id?: string
          minute?: string
          possession?: number
          visible?: boolean
        }
        Update: {
          away?: string
          away_corners?: number
          away_score?: number
          away_shots?: number
          away_yellow?: number
          competition?: string
          home?: string
          home_corners?: number
          home_score?: number
          home_shots?: number
          home_yellow?: number
          id?: string
          minute?: string
          possession?: number
          visible?: boolean
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean
          created_at: string
          days: number
          description: string | null
          id: string
          image_url: string | null
          label: string
          price: number
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          days: number
          description?: string | null
          id: string
          image_url?: string | null
          label: string
          price: number
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          days?: number
          description?: string | null
          id?: string
          image_url?: string | null
          label?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      payment_networks: {
        Row: {
          active: boolean
          id: string
          name: string
          receiving_name: string
          receiving_number: string
          sort_order: number
          ussd: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
          receiving_name: string
          receiving_number: string
          sort_order?: number
          ussd?: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
          receiving_name?: string
          receiving_number?: string
          sort_order?: number
          ussd?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          adjustment_note: string | null
          amount: number
          created_at: string
          granted_days: number
          id: string
          network: string
          package: string
          reference: string
          reviewed_at: string | null
          sender_phone: string
          status: string
          user_id: string
        }
        Insert: {
          adjustment_note?: string | null
          amount: number
          created_at?: string
          granted_days?: number
          id?: string
          network: string
          package: string
          reference: string
          reviewed_at?: string | null
          sender_phone: string
          status?: string
          user_id?: string
        }
        Update: {
          adjustment_note?: string | null
          amount?: number
          created_at?: string
          granted_days?: number
          id?: string
          network?: string
          package?: string
          reference?: string
          reviewed_at?: string | null
          sender_phone?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact: string | null
          created_at: string
          display_name: string | null
          id: string
          is_suspended: boolean
          subscription_ends_at: string | null
          trial_ends_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_suspended?: boolean
          subscription_ends_at?: string | null
          trial_ends_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_suspended?: boolean
          subscription_ends_at?: string | null
          trial_ends_at?: string
        }
        Relationships: []
      }
      site_appearance: {
        Row: {
          button_label: string
          description: string
          group_url: string
          id: string
          image_url: string | null
          logo_url: string | null
          slides: Json
          tagline: string
          theme: string
          title: string
        }
        Insert: {
          button_label?: string
          description?: string
          group_url?: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          slides?: Json
          tagline?: string
          theme?: string
          title?: string
        }
        Update: {
          button_label?: string
          description?: string
          group_url?: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          slides?: Json
          tagline?: string
          theme?: string
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      correct_payment: {
        Args: {
          _amount: number
          _note: string
          _package: string
          _payment_id: string
          _refund: boolean
        }
        Returns: undefined
      }
      grant_customer_minutes: {
        Args: { _minutes: number; _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_app_owner: { Args: never; Returns: boolean }
      manage_admin: {
        Args: { _promote: boolean; _user_id: string }
        Returns: undefined
      }
      outside_likes: {
        Args: { _like?: boolean; _visitor?: string }
        Returns: number
      }
      review_payment: {
        Args: { _approve: boolean; _payment_id: string }
        Returns: undefined
      }
      suspend_customer: {
        Args: { _suspended: boolean; _user_id: string }
        Returns: undefined
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
