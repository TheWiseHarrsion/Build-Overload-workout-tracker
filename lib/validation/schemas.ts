import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
})

export const updateWorkoutTemplateSchema = createWorkoutTemplateSchema

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Name must be 100 characters or less'),
  muscle_group: z.string().max(50, 'Muscle group must be 50 characters or less').optional(),
})

export const updateExerciseSchema = createExerciseSchema

export const addExerciseToTemplateSchema = z.object({
  exercise_id: z.string().uuid('Invalid exercise ID'),
  default_sets: z.number().int().min(1, 'Must have at least 1 set').max(20, 'Maximum 20 sets'),
})

export const updateTemplateExerciseSchema = z.object({
  position: z.number().int().min(0),
  default_sets: z.number().int().min(1).max(20),
})

export const createWorkoutSessionSchema = z.object({
  workout_template_id: z.string().uuid('Invalid template ID').optional().nullable(),
  name: z.string().min(1, 'Session name is required').max(100),
})

export const updateExerciseSetSchema = z.object({
  weight: z.number().min(0, 'Weight cannot be negative'),
  reps: z.number().int().min(0, 'Reps cannot be negative'),
  is_completed: z.boolean().optional(),
})

export const completeWorkoutSessionSchema = z.object({
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateSchema>
export type UpdateWorkoutTemplateInput = z.infer<typeof updateWorkoutTemplateSchema>
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>
export type AddExerciseToTemplateInput = z.infer<typeof addExerciseToTemplateSchema>
export type UpdateTemplateExerciseInput = z.infer<typeof updateTemplateExerciseSchema>
export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>
export type UpdateExerciseSetInput = z.infer<typeof updateExerciseSetSchema>
export type CompleteWorkoutSessionInput = z.infer<typeof completeWorkoutSessionSchema>
