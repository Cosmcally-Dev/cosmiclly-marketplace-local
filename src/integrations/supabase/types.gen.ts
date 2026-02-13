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
      advisor_applications: {
        Row: {
          email: string
          extra_info: string | null
          full_name: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_link: string | null
          specialty: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          email: string
          extra_info?: string | null
          full_name: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          specialty: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          email?: string
          extra_info?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_link?: string | null
          specialty?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: []
      }
      advisor_details: {
        Row: {
          bio_long: string | null
          bio_short: string | null
          discounted_price: number | null
          free_minutes: number | null
          id: string
          is_top_rated: boolean | null
          price_per_minute: number
          specialties: string[] | null
          status: string | null
          title: string
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          bio_long?: string | null
          bio_short?: string | null
          discounted_price?: number | null
          free_minutes?: number | null
          id: string
          is_top_rated?: boolean | null
          price_per_minute: number
          specialties?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          bio_long?: string | null
          bio_short?: string | null
          discounted_price?: number | null
          free_minutes?: number | null
          id?: string
          is_top_rated?: boolean | null
          price_per_minute?: number
          specialties?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          sender_id: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          sender_id: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          date_of_birth: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          time_of_birth: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          date_of_birth?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string
          time_of_birth?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          date_of_birth?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          time_of_birth?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          advisor_id: string
          billable_minutes: number
          billing_status: Database["public"]["Enums"]["billing_status"] | null
          client_id: string
          connection_quality:
            | Database["public"]["Enums"]["connection_quality"]
            | null
          cost_total: number | null
          ended_at: string | null
          free_minutes_applied: number
          id: string
          last_billed_at: string | null
          rate_per_minute: number | null
          session_metadata: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          type: Database["public"]["Enums"]["session_type"]
        }
        Insert: {
          advisor_id: string
          billable_minutes?: number
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          client_id: string
          connection_quality?:
            | Database["public"]["Enums"]["connection_quality"]
            | null
          cost_total?: number | null
          ended_at?: string | null
          free_minutes_applied?: number
          id?: string
          last_billed_at?: string | null
          rate_per_minute?: number | null
          session_metadata?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          type?: Database["public"]["Enums"]["session_type"]
        }
        Update: {
          advisor_id?: string
          billable_minutes?: number
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          client_id?: string
          connection_quality?:
            | Database["public"]["Enums"]["connection_quality"]
            | null
          cost_total?: number | null
          ended_at?: string | null
          free_minutes_applied?: number
          id?: string
          last_billed_at?: string | null
          rate_per_minute?: number | null
          session_metadata?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          type?: Database["public"]["Enums"]["session_type"]
        }
        Relationships: [
          {
            foreignKeyName: "sessions_advisor_id_fkey"
            columns: ["advisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
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
      add_credits: {
        Args: { amount: number; user_id: string }
        Returns: boolean
      }
      deduct_credits: {
        Args: { amount: number; user_id: string }
        Returns: boolean
      }
      end_rtc_session: {
        Args: {
          p_billable_minutes: number
          p_connection_quality?: Database["public"]["Enums"]["connection_quality"]
          p_session_id: string
        }
        Returns: boolean
      }
      start_rtc_session: {
        Args: {
          p_advisor_id: string
          p_client_id: string
          p_free_minutes?: number
          p_rate_per_minute: number
          p_type: Database["public"]["Enums"]["session_type"]
        }
        Returns: string
      }
      update_billing_status: {
        Args: {
          p_billing_status: Database["public"]["Enums"]["billing_status"]
          p_session_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      billing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      connection_quality: "excellent" | "good" | "poor" | "lost"
      session_status: "pending" | "active" | "completed" | "cancelled"
      session_type: "chat" | "audio" | "video"
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
      billing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      connection_quality: ["excellent", "good", "poor", "lost"],
      session_status: ["pending", "active", "completed", "cancelled"],
      session_type: ["chat", "audio", "video"],
    },
  },
} as const
