export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          ai_concerns: string | null;
          ai_experience: string | null;
          ai_recommendation: string | null;
          ai_score: number | null;
          ai_strengths: string | null;
          ai_summary: string | null;
          candidate_id: string;
          cover_note: string | null;
          created_at: string;
          education: string | null;
          email: string | null;
          experience: string | null;
          full_name: string | null;
          id: string;
          job_id: string;
          manager_notes: string | null;
          match_recommendation: string | null;
          match_score: number | null;
          matching_skills: string | null;
          missing_skills: string | null;
          phone: string | null;
          resume_path: string | null;
          resume_text: string | null;
          skills: string | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
        };
        Insert: {
          ai_concerns?: string | null;
          ai_experience?: string | null;
          ai_recommendation?: string | null;
          ai_score?: number | null;
          ai_strengths?: string | null;
          ai_summary?: string | null;
          candidate_id: string;
          cover_note?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          experience?: string | null;
          full_name?: string | null;
          id?: string;
          job_id: string;
          manager_notes?: string | null;
          match_recommendation?: string | null;
          match_score?: number | null;
          matching_skills?: string | null;
          missing_skills?: string | null;
          phone?: string | null;
          resume_path?: string | null;
          resume_text?: string | null;
          skills?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Update: {
          ai_concerns?: string | null;
          ai_experience?: string | null;
          ai_recommendation?: string | null;
          ai_score?: number | null;
          ai_strengths?: string | null;
          ai_summary?: string | null;
          candidate_id?: string;
          cover_note?: string | null;
          created_at?: string;
          education?: string | null;
          email?: string | null;
          experience?: string | null;
          full_name?: string | null;
          id?: string;
          job_id?: string;
          manager_notes?: string | null;
          match_recommendation?: string | null;
          match_score?: number | null;
          matching_skills?: string | null;
          missing_skills?: string | null;
          phone?: string | null;
          resume_path?: string | null;
          resume_text?: string | null;
          skills?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      interview_questions: {
        Row: {
          application_id: string;
          created_at: string;
          created_by: string;
          id: string;
          questions: Json;
        };
        Insert: {
          application_id: string;
          created_at?: string;
          created_by: string;
          id?: string;
          questions: Json;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          created_by?: string;
          id?: string;
          questions?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "interview_questions_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          company: string | null;
          created_at: string;
          created_by: string;
          department: string | null;
          description: string;
          employment_type: string | null;
          experience_required: string | null;
          id: string;
          location: string | null;
          requirements: string | null;
          skills: string[];
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          created_by: string;
          department?: string | null;
          description: string;
          employment_type?: string | null;
          experience_required?: string | null;
          id?: string;
          location?: string | null;
          requirements?: string | null;
          skills?: string[];
          status?: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          created_by?: string;
          department?: string | null;
          description?: string;
          employment_type?: string | null;
          experience_required?: string | null;
          id?: string;
          location?: string | null;
          requirements?: string | null;
          skills?: string[];
          status?: Database["public"]["Enums"]["job_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "candidate" | "recruiter" | "hiring_manager";
      application_status:
        | "applied"
        | "screening"
        | "shortlisted"
        | "interview_scheduled"
        | "rejected"
        | "approved";
      job_status: "open" | "closed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["candidate", "recruiter", "hiring_manager"],
      application_status: [
        "applied",
        "screening",
        "shortlisted",
        "interview_scheduled",
        "rejected",
        "approved",
      ],
      job_status: ["open", "closed"],
    },
  },
} as const;
