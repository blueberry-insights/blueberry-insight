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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          candidate_ref: string | null
          created_at: string | null
          created_by: string | null
          cv_mime_type: string | null
          cv_original_name: string | null
          cv_path: string | null
          cv_size_bytes: number | null
          cv_uploaded_at: string | null
          cv_url: string | null
          email: string
          full_name: string
          id: string
          note: string | null
          offer_id: string | null
          org_id: string
          skills: string[] | null
          source: string | null
          status: string | null
          tags: string[]
          updated_at: string | null
        }
        Insert: {
          candidate_ref?: string | null
          created_at?: string | null
          created_by?: string | null
          cv_mime_type?: string | null
          cv_original_name?: string | null
          cv_path?: string | null
          cv_size_bytes?: number | null
          cv_uploaded_at?: string | null
          cv_url?: string | null
          email: string
          full_name: string
          id?: string
          note?: string | null
          offer_id?: string | null
          org_id: string
          skills?: string[] | null
          source?: string | null
          status?: string | null
          tags?: string[]
          updated_at?: string | null
        }
        Update: {
          candidate_ref?: string | null
          created_at?: string | null
          created_by?: string | null
          cv_mime_type?: string | null
          cv_original_name?: string | null
          cv_path?: string | null
          cv_size_bytes?: number | null
          cv_uploaded_at?: string | null
          cv_url?: string | null
          email?: string
          full_name?: string
          id?: string
          note?: string | null
          offer_id?: string | null
          org_id?: string
          skills?: string[] | null
          source?: string | null
          status?: string | null
          tags?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          city: string | null
          contract_type: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          is_remote: boolean | null
          org_id: string
          profile_type: string | null
          remote_policy: string | null
          responsible_user_id: string | null
          salary_max: number | null
          salary_min: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          org_id: string
          profile_type?: string | null
          remote_policy?: string | null
          responsible_user_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          contract_type?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_remote?: boolean | null
          org_id?: string
          profile_type?: string | null
          remote_policy?: string | null
          responsible_user_id?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          org_id: string
          role: string
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          created_at: string
          id: string
          org_id: string
          question_id: string
          submission_id: string
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          question_id: string
          submission_id: string
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          question_id?: string
          submission_id?: string
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "test_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_flow_items: {
        Row: {
          created_at: string
          description: string | null
          flow_id: string
          id: string
          is_required: boolean
          kind: string
          order_index: number
          org_id: string
          test_id: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          flow_id: string
          id?: string
          is_required?: boolean
          kind: string
          order_index?: number
          org_id: string
          test_id?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          flow_id?: string
          id?: string
          is_required?: boolean
          kind?: string
          order_index?: number
          org_id?: string
          test_id?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_flow_items_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "test_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_flow_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_flow_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_flows: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          offer_id: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name?: string
          offer_id: string
          org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          offer_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_flows_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_flows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          kind: string
          label: string
          max_value: number | null
          min_value: number | null
          options: Json | null
          order_index: number
          org_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          kind: string
          label: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          order_index?: number
          org_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          kind?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          order_index?: number
          org_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_reviews: {
        Row: {
          axis_comments: Json | null
          created_at: string
          id: string
          overall_comment: string | null
          reviewer_id: string
          submission_id: string
        }
        Insert: {
          axis_comments?: Json | null
          created_at?: string
          id?: string
          overall_comment?: string | null
          reviewer_id: string
          submission_id: string
        }
        Update: {
          axis_comments?: Json | null
          created_at?: string
          id?: string
          overall_comment?: string | null
          reviewer_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          candidate_id: string
          id: string
          max_score: number | null
          numeric_score: number | null
          offer_id: string | null
          org_id: string
          submitted_at: string
          submitted_by: string | null
          test_id: string
        }
        Insert: {
          candidate_id: string
          id?: string
          max_score?: number | null
          numeric_score?: number | null
          offer_id?: string | null
          org_id: string
          submitted_at?: string
          submitted_by?: string | null
          test_id: string
        }
        Update: {
          candidate_id?: string
          id?: string
          max_score?: number | null
          numeric_score?: number | null
          offer_id?: string | null
          org_id?: string
          submitted_at?: string
          submitted_by?: string | null
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
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
