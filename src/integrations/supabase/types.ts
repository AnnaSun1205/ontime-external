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
  public: {
    Tables: {
      board_companies: {
        Row: {
          board_id: string
          company_name: string
          created_at: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          company_name: string
          created_at?: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          company_name?: string
          created_at?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_companies_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          season: string
          start_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          season: string
          start_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          season?: string
          start_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          board_id: string
          company_name: string
          created_at: string
          end_at: string | null
          event_type: string
          id: string
          source: string
          start_at: string
          title: string
          user_id: string
        }
        Insert: {
          board_id: string
          company_name: string
          created_at?: string
          end_at?: string | null
          event_type: string
          id?: string
          source?: string
          start_at: string
          title: string
          user_id: string
        }
        Update: {
          board_id?: string
          company_name?: string
          created_at?: string
          end_at?: string | null
          event_type?: string
          id?: string
          source?: string
          start_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      inactive_role_signals: {
        Row: {
          apply_url: string | null
          company_name: string
          created_at: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          location: string | null
          role_title: string
          source: string | null
          status: string | null
          term: string | null
          updated_at: string | null
        }
        Insert: {
          apply_url?: string | null
          company_name: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          location?: string | null
          role_title: string
          source?: string | null
          status?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Update: {
          apply_url?: string | null
          company_name?: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          location?: string | null
          role_title?: string
          source?: string | null
          status?: string | null
          term?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      opening_inbox: {
        Row: {
          created_at: string
          opening_id: string
          section: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opening_id: string
          section?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          opening_id?: string
          section?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_inbox_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_inbox_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals_main"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_seen: {
        Row: {
          opening_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          opening_id: string
          seen_at?: string
          user_id: string
        }
        Update: {
          opening_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_seen_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_seen_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals_main"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_signal_countries: {
        Row: {
          country: string
          opening_id: string
        }
        Insert: {
          country: string
          opening_id: string
        }
        Update: {
          country?: string
          opening_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_signal_countries_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opening_signal_countries_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "opening_signals_main"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_signals: {
        Row: {
          age_days: number | null
          apply_url: string
          company_name: string
          country: string | null
          created_at: string
          first_seen_at: string
          id: string
          is_active: boolean | null
          last_seen_at: string
          listing_hash: string | null
          location: string | null
          posted_at: string | null
          role_title: string
          signal_type: string
          source: string
          source_first_seen_at: string | null
          term: string
          updated_at: string
        }
        Insert: {
          age_days?: number | null
          apply_url: string
          company_name: string
          country?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string
          listing_hash?: string | null
          location?: string | null
          posted_at?: string | null
          role_title: string
          signal_type?: string
          source?: string
          source_first_seen_at?: string | null
          term?: string
          updated_at?: string
        }
        Update: {
          age_days?: number | null
          apply_url?: string
          company_name?: string
          country?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string
          listing_hash?: string | null
          location?: string | null
          posted_at?: string | null
          role_title?: string
          signal_type?: string
          source?: string
          source_first_seen_at?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      opening_signals_history: {
        Row: {
          apply_url: string | null
          company_name: string
          created_at: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          location: string | null
          role_title: string
          season_year: number
          source: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          apply_url?: string | null
          company_name: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          location?: string | null
          role_title: string
          season_year: number
          source?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          apply_url?: string | null
          company_name?: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          location?: string | null
          role_title?: string
          season_year?: number
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      openings: {
        Row: {
          apply_url: string
          company_name: string
          confidence: number
          created_at: string
          event_type: string
          id: string
          last_verified_at: string
          location: string | null
          open_date: string | null
          raw_text: string | null
          role_title: string
          source_url: string
          term: string
          updated_at: string
        }
        Insert: {
          apply_url: string
          company_name: string
          confidence?: number
          created_at?: string
          event_type?: string
          id?: string
          last_verified_at?: string
          location?: string | null
          open_date?: string | null
          raw_text?: string | null
          role_title: string
          source_url: string
          term?: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          company_name?: string
          confidence?: number
          created_at?: string
          event_type?: string
          id?: string
          last_verified_at?: string
          location?: string | null
          open_date?: string | null
          raw_text?: string | null
          role_title?: string
          source_url?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      refresh_execution_log: {
        Row: {
          created_at: string
          deactivated_count: number | null
          duration_ms: number | null
          execution_time: string
          function_name: string
          id: string
          inserted_count: number | null
          message: string | null
          next_run_at: string | null
          status: string
          updated_count: number | null
        }
        Insert: {
          created_at?: string
          deactivated_count?: number | null
          duration_ms?: number | null
          execution_time?: string
          function_name: string
          id?: string
          inserted_count?: number | null
          message?: string | null
          next_run_at?: string | null
          status: string
          updated_count?: number | null
        }
        Update: {
          created_at?: string
          deactivated_count?: number | null
          duration_ms?: number | null
          execution_time?: string
          function_name?: string
          id?: string
          inserted_count?: number | null
          message?: string | null
          next_run_at?: string | null
          status?: string
          updated_count?: number | null
        }
        Relationships: []
      }
      refresh_run_audit: {
        Row: {
          error: string | null
          finished_at: string | null
          function_name: string
          http_status: number | null
          id: number
          outcome: string
          reason: string | null
          rows_marked_inactive: number | null
          rows_upserted: number | null
          started_at: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          function_name: string
          http_status?: number | null
          id?: number
          outcome: string
          reason?: string | null
          rows_marked_inactive?: number | null
          rows_upserted?: number | null
          started_at?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          function_name?: string
          http_status?: number | null
          id?: number
          outcome?: string
          reason?: string | null
          rows_marked_inactive?: number | null
          rows_upserted?: number | null
          started_at?: string
        }
        Relationships: []
      }
      refresh_schedule: {
        Row: {
          function_name: string
          last_run_at: string | null
          last_status: string | null
          locked_by: string | null
          locked_until: string | null
          next_run_at: string
          updated_at: string
        }
        Insert: {
          function_name: string
          last_run_at?: string | null
          last_status?: string | null
          locked_by?: string | null
          locked_until?: string | null
          next_run_at: string
          updated_at?: string
        }
        Update: {
          function_name?: string
          last_run_at?: string | null
          last_status?: string | null
          locked_by?: string | null
          locked_until?: string | null
          next_run_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          auth_provider: string | null
          created_at: string
          email: string | null
          has_onboarded: boolean | null
          id: string
          last_login: string | null
          last_seen_listings_at: string | null
          last_seen_listings_at_ca: string | null
          last_seen_listings_at_us: string | null
          quiet_mode: boolean | null
          selected_companies: string[] | null
          selected_regions: string[] | null
          selected_roles: string[] | null
          selected_seasons: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_provider?: string | null
          created_at?: string
          email?: string | null
          has_onboarded?: boolean | null
          id?: string
          last_login?: string | null
          last_seen_listings_at?: string | null
          last_seen_listings_at_ca?: string | null
          last_seen_listings_at_us?: string | null
          quiet_mode?: boolean | null
          selected_companies?: string[] | null
          selected_regions?: string[] | null
          selected_roles?: string[] | null
          selected_seasons?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_provider?: string | null
          created_at?: string
          email?: string | null
          has_onboarded?: boolean | null
          id?: string
          last_login?: string | null
          last_seen_listings_at?: string | null
          last_seen_listings_at_ca?: string | null
          last_seen_listings_at_us?: string | null
          quiet_mode?: boolean | null
          selected_companies?: string[] | null
          selected_regions?: string[] | null
          selected_roles?: string[] | null
          selected_seasons?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          notifications_enabled: boolean | null
          reminder_days_before: number | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          week_start_day: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          reminder_days_before?: number | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          week_start_day?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          notifications_enabled?: boolean | null
          reminder_days_before?: number | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          week_start_day?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      opening_signals_main: {
        Row: {
          age_days: number | null
          apply_url: string | null
          company_name: string | null
          countries: string[] | null
          country: string | null
          created_at: string | null
          first_seen_at: string | null
          id: string | null
          is_active: boolean | null
          last_seen_at: string | null
          listing_hash: string | null
          location: string | null
          posted_at: string | null
          role_title: string | null
          signal_type: string | null
          source: string | null
          source_first_seen_at: string | null
          term: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_refresh_lock: {
        Args: {
          p_function_name: string
          p_lock_until: string
          p_request_id: string
        }
        Returns: boolean
      }
      call_refresh_opening_signals: { Args: never; Returns: undefined }
      call_refresh_opening_signals_function: { Args: never; Returns: undefined }
      compute_listing_hash: {
        Args: {
          p_apply_url: string
          p_company_name: string
          p_location: string
          p_role_title: string
          p_term: string
        }
        Returns: string
      }
      mark_openings_seen: {
        Args: { p_country: string; p_end: string; p_start: string }
        Returns: undefined
      }
      update_opening_signals_is_active: { Args: never; Returns: undefined }
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
