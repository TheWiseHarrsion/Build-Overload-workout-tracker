export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          muscle_group: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          muscle_group?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          muscle_group?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_template_exercises: {
        Row: {
          id: string
          workout_template_id: string
          exercise_id: string
          position: number
          default_sets: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_template_id: string
          exercise_id: string
          position?: number
          default_sets?: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_template_id?: string
          exercise_id?: string
          position?: number
          default_sets?: number
          created_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          workout_template_id: string | null
          name: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_template_id?: string | null
          name: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_template_id?: string | null
          name?: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          id: string
          workout_session_id: string
          exercise_id: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_session_id: string
          exercise_id: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_session_id?: string
          exercise_id?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          id: string
          session_exercise_id: string
          set_number: number
          weight: number
          reps: number
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_exercise_id: string
          set_number: number
          weight?: number
          reps?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_exercise_id?: string
          set_number?: number
          weight?: number
          reps?: number
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Application types
export type Profile = Database['public']['Tables']['profiles']['Row']

export type Exercise = Database['public']['Tables']['exercises']['Row']

export type WorkoutTemplate = Database['public']['Tables']['workout_templates']['Row']

export type WorkoutTemplateExercise =
  Database['public']['Tables']['workout_template_exercises']['Row'] & {
    exercise?: Exercise
  }

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']

export type SessionExercise =
  Database['public']['Tables']['session_exercises']['Row'] & {
    exercise?: Exercise
  }

export type ExerciseSet = Database['public']['Tables']['exercise_sets']['Row']

export interface ProgressDataPoint {
  date: string
  timestamp: number
  maxWeight: number
  bestReps: number
  bestSetVolume: number
  totalVolume: number
  estimated1RM: number
}

export interface PersonalRecord {
  metric: 'weight' | 'reps' | 'volume' | 'estimated1RM'
  value: number
  date: string
  setId: string
}
