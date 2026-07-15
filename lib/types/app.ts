import type { Exercise, ExerciseSet, WorkoutSession } from '@/lib/types/database'

export interface TemplateExerciseWithExercise {
  id: string
  workout_template_id: string
  exercise_id: string
  position: number
  default_sets: number
  created_at: string
  exercises: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null
}

export interface WorkoutTemplateWithExercises {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  workout_template_exercises: TemplateExerciseWithExercise[]
}

export interface SessionExerciseWithDetails {
  id: string
  workout_session_id: string
  exercise_id: string
  position: number
  created_at: string
  exercises: Pick<Exercise, 'id' | 'name' | 'muscle_group'> | null
  exercise_sets: ExerciseSet[]
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
  session_exercises: SessionExerciseWithDetails[]
}

export interface PreviousSetValue {
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
}

export interface ProgressDataPoint {
  date: string
  timestamp: number
  maxWeight: number
  bestReps: number
  bestSetVolume: number
  totalVolume: number
  estimated1RM: number
}

export type ActionResult<T = object> =
  | ({ success: true } & T)
  | { success: false; error: string; sessionId?: string }
