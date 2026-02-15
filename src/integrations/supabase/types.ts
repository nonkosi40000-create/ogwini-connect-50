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
      academic_reports: {
        Row: {
          created_at: string
          file_url: string
          id: string
          learner_id: string
          term: string | null
          title: string
          uploaded_by: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          learner_id: string
          term?: string | null
          title: string
          uploaded_by?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          learner_id?: string
          term?: string | null
          title?: string
          uploaded_by?: string | null
          year?: number | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          target_audience: string[] | null
          target_grades: string[] | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          target_audience?: string[] | null
          target_grades?: string[] | null
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          target_audience?: string[] | null
          target_grades?: string[] | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          complaint_text: string
          created_at: string
          grade: string
          id: string
          is_anonymous: boolean | null
          learner_id: string
          responded_by: string | null
          response: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          complaint_text: string
          created_at?: string
          grade: string
          id?: string
          is_anonymous?: boolean | null
          learner_id: string
          responded_by?: string | null
          response?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          complaint_text?: string
          created_at?: string
          grade?: string
          id?: string
          is_anonymous?: boolean | null
          learner_id?: string
          responded_by?: string | null
          response?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_policies: {
        Row: {
          created_at: string
          created_by: string
          department_id: string
          description: string | null
          id: string
          policy_document_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id: string
          description?: string | null
          id?: string
          policy_document_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string
          description?: string | null
          id?: string
          policy_document_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_policies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_heads: {
        Row: {
          assigned_at: string
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          department_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_heads_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: true
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string
          created_at: string
          id: string
          recipients: string[]
          sender_id: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          recipients: string[]
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          recipients?: string[]
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          start_date: string
          target_grades: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type: string
          id?: string
          start_date: string
          target_grades?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          start_date?: string
          target_grades?: string[] | null
          title?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          created_at: string
          file_url: string
          id: string
          learner_id: string
          marked_by: string | null
          marked_file_url: string | null
          marks_obtained: number | null
          material_id: string | null
          notes: string | null
          status: string
          teacher_feedback: string | null
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          learner_id: string
          marked_by?: string | null
          marked_file_url?: string | null
          marks_obtained?: number | null
          material_id?: string | null
          notes?: string | null
          status?: string
          teacher_feedback?: string | null
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          learner_id?: string
          marked_by?: string | null
          marked_file_url?: string | null
          marks_obtained?: number | null
          material_id?: string | null
          notes?: string | null
          status?: string
          teacher_feedback?: string | null
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "learning_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          file_url: string
          grade: string | null
          id: string
          subject: string | null
          title: string
          type: string
          updated_at: string
          uploaded_by: string | null
          week: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url: string
          grade?: string | null
          id?: string
          subject?: string | null
          title: string
          type: string
          updated_at?: string
          uploaded_by?: string | null
          week?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          file_url?: string
          grade?: string | null
          id?: string
          subject?: string | null
          title?: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          week?: string | null
        }
        Relationships: []
      }
      library_materials: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          grade: string | null
          id: string
          subject: string | null
          title: string
          type: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          grade?: string | null
          id?: string
          subject?: string | null
          title: string
          type: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          grade?: string | null
          id?: string
          subject?: string | null
          title?: string
          type?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      marks: {
        Row: {
          assessment_name: string
          assessment_type: string
          created_at: string
          feedback: string | null
          id: string
          learner_id: string
          marks_obtained: number
          recorded_by: string | null
          subject: string
          term: string | null
          total_marks: number
          updated_at: string
          year: number | null
        }
        Insert: {
          assessment_name: string
          assessment_type: string
          created_at?: string
          feedback?: string | null
          id?: string
          learner_id: string
          marks_obtained: number
          recorded_by?: string | null
          subject: string
          term?: string | null
          total_marks: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          assessment_name?: string
          assessment_type?: string
          created_at?: string
          feedback?: string | null
          id?: string
          learner_id?: string
          marks_obtained?: number
          recorded_by?: string | null
          subject?: string
          term?: string | null
          total_marks?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      merchandise_orders: {
        Row: {
          contact_message: string | null
          created_at: string
          id: string
          items: Json
          learner_id: string
          payment_proof_url: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          contact_message?: string | null
          created_at?: string
          id?: string
          items: Json
          learner_id: string
          payment_proof_url?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          contact_message?: string | null
          created_at?: string
          id?: string
          items?: Json
          learner_id?: string
          payment_proof_url?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link_label: string | null
          link_url: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_label?: string | null
          link_url?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link_label?: string | null
          link_url?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      past_papers: {
        Row: {
          created_at: string
          description: string | null
          file_url: string
          grade: string
          id: string
          subject: string
          term: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url: string
          grade: string
          id?: string
          subject: string
          term?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string
          grade?: string
          id?: string
          subject?: string
          term?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          class: string | null
          created_at: string
          department_id: string | null
          elective_subjects: string[] | null
          email: string
          first_name: string
          grade: string | null
          id: string
          id_number: string | null
          last_name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          department_id?: string | null
          elective_subjects?: string[] | null
          email: string
          first_name: string
          grade?: string | null
          id?: string
          id_number?: string | null
          last_name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          class?: string | null
          created_at?: string
          department_id?: string | null
          elective_subjects?: string[] | null
          email?: string
          first_name?: string
          grade?: string | null
          id?: string
          id_number?: string | null
          last_name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          marks: number | null
          options: Json | null
          order_num: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          marks?: number | null
          options?: Json | null
          order_num?: number | null
          question_text: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          marks?: number | null
          options?: Json | null
          order_num?: number | null
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number | null
          submitted_at: string
          total_marks: number | null
          user_id: string
        }
        Insert: {
          answers: Json
          id?: string
          quiz_id: string
          score?: number | null
          submitted_at?: string
          total_marks?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number | null
          submitted_at?: string
          total_marks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          grade: string
          id: string
          status: string
          subject: string
          title: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade: string
          id?: string
          status?: string
          subject: string
          title: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          grade?: string
          id?: string
          status?: string
          subject?: string
          title?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          address: string | null
          admin_notes: string | null
          class: string | null
          created_at: string
          department_id: string | null
          elective_subjects: string[] | null
          email: string
          first_name: string
          grade: string | null
          id: string
          id_document_url: string | null
          id_number: string | null
          last_name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          payment_proof_url: string | null
          phone: string | null
          proof_of_address_url: string | null
          report_url: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          class?: string | null
          created_at?: string
          department_id?: string | null
          elective_subjects?: string[] | null
          email: string
          first_name: string
          grade?: string | null
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          last_name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_proof_url?: string | null
          phone?: string | null
          proof_of_address_url?: string | null
          report_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          class?: string | null
          created_at?: string
          department_id?: string | null
          elective_subjects?: string[] | null
          email?: string
          first_name?: string
          grade?: string | null
          id?: string
          id_document_url?: string | null
          id_number?: string | null
          last_name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          payment_proof_url?: string | null
          phone?: string | null
          proof_of_address_url?: string | null
          report_url?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      statement_requests: {
        Row: {
          created_at: string
          id: string
          learner_id: string
          notes: string | null
          statement_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          learner_id: string
          notes?: string | null
          statement_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          learner_id?: string
          notes?: string | null
          statement_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_balances: {
        Row: {
          amount_owed: number
          created_at: string
          id: string
          last_payment_date: string | null
          learner_id: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_owed?: number
          created_at?: string
          id?: string
          last_payment_date?: string | null
          learner_id: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_owed?: number
          created_at?: string
          id?: string
          last_payment_date?: string | null
          learner_id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          id: string
          learner_id: string
          month: string
          payment_proof_url: string | null
          status: string
          updated_at: string
          verified_by: string | null
          year: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          learner_id: string
          month: string
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          verified_by?: string | null
          year?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          learner_id?: string
          month?: string
          payment_proof_url?: string | null
          status?: string
          updated_at?: string
          verified_by?: string | null
          year?: number
        }
        Relationships: []
      }
      syllabi: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          file_url: string
          grade: string | null
          id: string
          subject_id: string
          title: string
          updated_at: string
          uploaded_by: string
          year: number | null
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          file_url: string
          grade?: string | null
          id?: string
          subject_id: string
          title: string
          updated_at?: string
          uploaded_by: string
          year?: number | null
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          file_url?: string
          grade?: string | null
          id?: string
          subject_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabi_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabi_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_anonymous: boolean | null
          learner_id: string
          rating: number
          subject: string
          teacher_id: string
          term: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_anonymous?: boolean | null
          learner_id: string
          rating: number
          subject: string
          teacher_id: string
          term?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_anonymous?: boolean | null
          learner_id?: string
          rating?: number
          subject?: string
          teacher_id?: string
          term?: string | null
          year?: number | null
        }
        Relationships: []
      }
      timetables: {
        Row: {
          class: string | null
          created_at: string
          file_url: string
          grade: string
          id: string
          timetable_type: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          class?: string | null
          created_at?: string
          file_url: string
          grade: string
          id?: string
          timetable_type?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          class?: string | null
          created_at?: string
          file_url?: string
          grade?: string
          id?: string
          timetable_type?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
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
      get_teacher_profiles: {
        Args: never
        Returns: {
          first_name: string
          last_name: string
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "learner"
        | "teacher"
        | "grade_head"
        | "principal"
        | "admin"
        | "hod"
        | "llc"
        | "finance"
        | "librarian"
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
    Enums: {
      app_role: [
        "learner",
        "teacher",
        "grade_head",
        "principal",
        "admin",
        "hod",
        "llc",
        "finance",
        "librarian",
      ],
    },
  },
} as const
