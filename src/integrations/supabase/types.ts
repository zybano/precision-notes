export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      consultation_packages: {
        Row: {
          created_at: string | null
          discount_percentage: number
          highlight: string | null
          id: string
          is_active: boolean
          price: number
          quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number
          highlight?: string | null
          id?: string
          is_active?: boolean
          price: number
          quantity: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number
          highlight?: string | null
          id?: string
          is_active?: boolean
          price?: number
          quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          created_at: string
          creator_id: string | null
          document_format: string | null
          generated_title: string | null
          id: string
          notes: string | null
          patient_name: string
          recording_duration: number | null
          status: string
          summary: string | null
          title: string
          transcript_data: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          document_format?: string | null
          generated_title?: string | null
          id?: string
          notes?: string | null
          patient_name: string
          recording_duration?: number | null
          status?: string
          summary?: string | null
          title: string
          transcript_data?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          document_format?: string | null
          generated_title?: string | null
          id?: string
          notes?: string | null
          patient_name?: string
          recording_duration?: number | null
          status?: string
          summary?: string | null
          title?: string
          transcript_data?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      regional_consultation_pricing: {
        Row: {
          country_code: string
          created_at: string | null
          currency: string
          currency_symbol: string
          id: string
          is_active: boolean
          package_id: string | null
          price: number
          region: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          currency: string
          currency_symbol: string
          id?: string
          is_active?: boolean
          package_id?: string | null
          price: number
          region: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          id?: string
          is_active?: boolean
          package_id?: string | null
          price?: number
          region?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_consultation_pricing_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "consultation_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_pricing: {
        Row: {
          country_code: string
          created_at: string | null
          currency: string
          currency_symbol: string
          id: string
          is_active: boolean
          plan_id: string | null
          price_annual: number
          price_monthly: number
          region: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          currency: string
          currency_symbol: string
          id?: string
          is_active?: boolean
          plan_id?: string | null
          price_annual: number
          price_monthly: number
          region: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          id?: string
          is_active?: boolean
          plan_id?: string | null
          price_annual?: number
          price_monthly?: number
          region?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regional_pricing_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          contact_sales: boolean
          created_at: string | null
          cta_label: string
          cta_link: string
          description: string | null
          features: Json
          highlight: string | null
          id: string
          is_active: boolean
          name: string
          popular: boolean
          price_annual: number
          price_monthly: number
          tier: string
          updated_at: string | null
        }
        Insert: {
          contact_sales?: boolean
          created_at?: string | null
          cta_label: string
          cta_link: string
          description?: string | null
          features?: Json
          highlight?: string | null
          id?: string
          is_active?: boolean
          name: string
          popular?: boolean
          price_annual: number
          price_monthly: number
          tier: string
          updated_at?: string | null
        }
        Update: {
          contact_sales?: boolean
          created_at?: string | null
          cta_label?: string
          cta_link?: string
          description?: string | null
          features?: Json
          highlight?: string | null
          id?: string
          is_active?: boolean
          name?: string
          popular?: boolean
          price_annual?: number
          price_monthly?: number
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_column_exists: {
        Args: { p_table_name: string; p_column_name: string }
        Returns: boolean
      }
      create_get_shared_documents_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_get_user_documents_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_shared_documents: {
        Args: { user_id: string }
        Returns: {
          created_at: string
          creator_id: string | null
          document_format: string | null
          generated_title: string | null
          id: string
          notes: string | null
          patient_name: string
          recording_duration: number | null
          status: string
          summary: string | null
          title: string
          transcript_data: string | null
          type: string
          updated_at: string
        }[]
      }
      get_user_documents: {
        Args: { user_id: string }
        Returns: {
          created_at: string
          creator_id: string | null
          document_format: string | null
          generated_title: string | null
          id: string
          notes: string | null
          patient_name: string
          recording_duration: number | null
          status: string
          summary: string | null
          title: string
          transcript_data: string | null
          type: string
          updated_at: string
        }[]
      }
      setup_database_schema: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
