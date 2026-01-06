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
      api_rate_limits: {
        Row: {
          call_count: number
          created_at: string | null
          function_name: string
          id: string
          reset_at: string
          user_id: string
        }
        Insert: {
          call_count?: number
          created_at?: string | null
          function_name: string
          id?: string
          reset_at: string
          user_id: string
        }
        Update: {
          call_count?: number
          created_at?: string | null
          function_name?: string
          id?: string
          reset_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm: number | null
          body_fat_percentage: number | null
          chest: number | null
          created_at: string
          hips: number | null
          id: string
          measured_at: string
          muscle_mass: number | null
          thigh: number | null
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arm?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          thigh?: number | null
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arm?: number | null
          body_fat_percentage?: number | null
          chest?: number | null
          created_at?: string
          hips?: number | null
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          thigh?: number | null
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          created_at: string
          description: string
          end_date: string
          goal_type: string
          goal_value: number
          id: string
          is_active: boolean | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          end_date: string
          goal_type: string
          goal_value: number
          id?: string
          is_active?: boolean | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string
          goal_type?: string
          goal_value?: number
          id?: string
          is_active?: boolean | null
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      exercise_sessions: {
        Row: {
          completed_at: string
          exercise_id: string
          id: string
          reps_completed: string | null
          sets_completed: number
          weight_used: number | null
          workout_session_id: string
        }
        Insert: {
          completed_at?: string
          exercise_id: string
          id?: string
          reps_completed?: string | null
          sets_completed: number
          weight_used?: number | null
          workout_session_id: string
        }
        Update: {
          completed_at?: string
          exercise_id?: string
          id?: string
          reps_completed?: string | null
          sets_completed?: number
          weight_used?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sessions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_sessions_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          order_in_workout: number
          reps: string
          rest_time: number | null
          sets: number
          weight: number | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_in_workout: number
          reps: string
          rest_time?: number | null
          sets: number
          weight?: number | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_in_workout?: number
          reps?: string
          rest_time?: number | null
          sets?: number
          weight?: number | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          ai_analysis: string | null
          created_at: string
          food_items: Json | null
          id: string
          meal_name: string | null
          meal_time: string
          photo_url: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          food_items?: Json | null
          id?: string
          meal_name?: string | null
          meal_time?: string
          photo_url: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          food_items?: Json | null
          id?: string
          meal_name?: string | null
          meal_time?: string
          photo_url?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          ingredients: string[] | null
          instructions: string | null
          meal_type: string
          name: string
          nutrition_plan_id: string
          protein: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          meal_type: string
          name: string
          nutrition_plan_id: string
          protein?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          ingredients?: string[] | null
          instructions?: string | null
          meal_type?: string
          name?: string
          nutrition_plan_id?: string
          protein?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_revisions: {
        Row: {
          created_at: string
          id: string
          nutrition_plan_id: string
          previous_data: Json
          revised_by: string
          revision_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nutrition_plan_id: string
          previous_data: Json
          revised_by: string
          revision_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nutrition_plan_id?: string
          previous_data?: Json
          revised_by?: string
          revision_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_revisions_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          rejection_reason: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          rejection_reason?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          rejection_reason?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_personal_signups: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_students: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          personal_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          personal_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          personal_id?: string
          student_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          dietary_preferences: string[] | null
          dietary_restrictions: string[] | null
          experience_level: string | null
          gender: string | null
          goal: string | null
          gym_id: string | null
          height: number | null
          id: string
          name: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          gym_id?: string | null
          height?: number | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          dietary_restrictions?: string[] | null
          experience_level?: string | null
          gender?: string | null
          goal?: string | null
          gym_id?: string | null
          height?: number | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          photo_type: string
          photo_url: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          photo_type: string
          photo_url: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          photo_type?: string
          photo_url?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommended_recipes: {
        Row: {
          calories: number | null
          carbs: number | null
          category: string
          created_at: string
          description: string | null
          difficulty: string | null
          fat: number | null
          id: string
          image_url: string | null
          ingredients: string[]
          instructions: string
          is_active: boolean | null
          prep_time_minutes: number | null
          protein: number | null
          title: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients: string[]
          instructions: string
          is_active?: boolean | null
          prep_time_minutes?: number | null
          protein?: number | null
          title: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string | null
          fat?: number | null
          id?: string
          image_url?: string | null
          ingredients?: string[]
          instructions?: string
          is_active?: boolean | null
          prep_time_minutes?: number | null
          protein?: number | null
          title?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_type: string
          created_at: string
          description: string | null
          earned_at: string
          icon: string
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          description?: string | null
          earned_at?: string
          icon: string
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          description?: string | null
          earned_at?: string
          icon?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          id: string
          joined_at: string
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          achieved_at: string | null
          created_at: string
          current_value: number | null
          deadline: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          target_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          gym_id: string | null
          id: string
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          gym_id?: string | null
          id?: string
          rejection_reason?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          gym_id?: string | null
          id?: string
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_terms_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_plan_revisions: {
        Row: {
          created_at: string
          id: string
          previous_data: Json
          revised_by: string
          revision_notes: string | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          previous_data: Json
          revised_by: string
          revision_notes?: string | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          previous_data?: Json
          revised_by?: string
          revision_notes?: string | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plan_revisions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          created_by_user_id: string | null
          id: string
          is_active: boolean | null
          last_refresh_date: string | null
          max_workouts_before_refresh: number | null
          name: string
          needs_refresh: boolean | null
          rejection_reason: string | null
          type: string
          updated_at: string
          user_id: string
          workouts_completed_count: number | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_refresh_date?: string | null
          max_workouts_before_refresh?: number | null
          name: string
          needs_refresh?: boolean | null
          rejection_reason?: string | null
          type: string
          updated_at?: string
          user_id: string
          workouts_completed_count?: number | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          created_by_user_id?: string | null
          id?: string
          is_active?: boolean | null
          last_refresh_date?: string | null
          max_workouts_before_refresh?: number | null
          name?: string
          needs_refresh?: boolean | null
          rejection_reason?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          workouts_completed_count?: number | null
        }
        Relationships: []
      }
      workout_schedule: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          scheduled_date: string
          scheduled_time: string | null
          user_id: string
          workout_plan_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date: string
          scheduled_time?: string | null
          user_id: string
          workout_plan_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          user_id?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedule_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          ai_post_workout_message: string | null
          ai_pre_workout_message: string | null
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          mood: string | null
          mood_intensity: number | null
          notes: string | null
          started_at: string
          user_id: string
          workout_plan_id: string
        }
        Insert: {
          ai_post_workout_message?: string | null
          ai_pre_workout_message?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mood?: string | null
          mood_intensity?: number | null
          notes?: string | null
          started_at?: string
          user_id: string
          workout_plan_id: string
        }
        Update: {
          ai_post_workout_message?: string | null
          ai_pre_workout_message?: string | null
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          mood?: string | null
          mood_intensity?: number | null
          notes?: string | null
          started_at?: string
          user_id?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_share_invites: {
        Row: {
          accepted: boolean | null
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          share_id: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          share_id: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_share_invites_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "workout_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_shares: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_private: boolean | null
          share_token: string
          shared_by: string
          title: string | null
          updated_at: string
          view_count: number | null
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          share_token: string
          shared_by: string
          title?: string | null
          updated_at?: string
          view_count?: number | null
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          share_token?: string
          shared_by?: string
          title?: string | null
          updated_at?: string
          view_count?: number | null
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_shares_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_pending_personal_signup: {
        Args: { _user_id: string }
        Returns: undefined
      }
      generate_share_token: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_rate_limit: {
        Args: { p_function_name: string; p_limit: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "personal" | "user" | "admin"
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
      app_role: ["personal", "user", "admin"],
    },
  },
} as const
