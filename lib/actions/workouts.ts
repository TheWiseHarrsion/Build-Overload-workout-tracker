'use server'

import { createServerClient } from '@/lib/supabase/server'
import {
  createWorkoutTemplateSchema,
  updateWorkoutTemplateSchema,
  createExerciseSchema,
  addExerciseToTemplateSchema,
  updateTemplateExerciseSchema,
} from '@/lib/validation/schemas'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types/app'
import type { Exercise, WorkoutTemplate, WorkoutTemplateExercise } from '@/lib/types/database'

export async function createWorkoutTemplate(
  name: string,
  description?: string
): Promise<ActionResult<{ template: WorkoutTemplate }>> {
  try {
    createWorkoutTemplateSchema.parse({ name, description })
    
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('workout_templates')
      .insert([
        {
          user_id: user.id,
          name,
          description: description || null,
        },
      ])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/workouts')
    return { success: true, template: data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create template' }
  }
}

export async function updateWorkoutTemplate(
  id: string,
  name: string,
  description?: string
): Promise<ActionResult<{ template: WorkoutTemplate }>> {
  try {
    updateWorkoutTemplateSchema.parse({ name, description })
    
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    const { data, error } = await supabase
      .from('workout_templates')
      .update({
        name,
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/workouts')
    revalidatePath(`/workouts/${id}`)
    return { success: true, template: data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update template' }
  }
}

export async function deleteWorkoutTemplate(id: string): Promise<ActionResult> {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/workouts')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete template' }
  }
}

export async function createExercise(
  name: string,
  muscle_group?: string
): Promise<ActionResult<{ exercise: Exercise }>> {
  try {
    createExerciseSchema.parse({ name, muscle_group })
    
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    const { data, error } = await supabase
      .from('exercises')
      .insert([
        {
          user_id: user.id,
          name,
          muscle_group: muscle_group || null,
        },
      ])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/workouts')
    return { success: true, exercise: data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create exercise' }
  }
}

export async function addExerciseToTemplate(
  templateId: string,
  exerciseId: string,
  defaultSets: number = 3,
  position?: number
): Promise<ActionResult<{ templateExercise: WorkoutTemplateExercise }>> {
  try {
    addExerciseToTemplateSchema.parse({ exercise_id: exerciseId, default_sets: defaultSets })
    
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify template ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    // Verify exercise ownership
    const { data: exercise } = await supabase
      .from('exercises')
      .select('user_id')
      .eq('id', exerciseId)
      .single()
    
    if (!exercise || exercise.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    // Get current max position if not provided
    let pos = position
    if (pos === undefined) {
      const { data: exercises } = await supabase
        .from('workout_template_exercises')
        .select('position')
        .eq('workout_template_id', templateId)
        .order('position', { ascending: false })
        .limit(1)
      
      pos = exercises && exercises.length > 0 ? exercises[0].position + 1 : 0
    }
    
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .insert([
        {
          workout_template_id: templateId,
          exercise_id: exerciseId,
          position: pos,
          default_sets: defaultSets,
        },
      ])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/workouts/${templateId}`)
    return { success: true, templateExercise: data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add exercise' }
  }
}

export async function removeExerciseFromTemplate(
  templateExerciseId: string,
  templateId: string
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify template ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    const { error } = await supabase
      .from('workout_template_exercises')
      .delete()
      .eq('id', templateExerciseId)
    
    if (error) throw error
    
    revalidatePath(`/workouts/${templateId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove exercise' }
  }
}

export async function reorderTemplateExercises(
  templateId: string,
  exerciseIds: string[]
): Promise<ActionResult> {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify template ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    // Update all positions
    for (let i = 0; i < exerciseIds.length; i++) {
      await supabase
        .from('workout_template_exercises')
        .update({ position: i })
        .eq('id', exerciseIds[i])
    }
    
    revalidatePath(`/workouts/${templateId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to reorder exercises' }
  }
}

export async function updateTemplateExerciseDefaultSets(
  templateExerciseId: string,
  defaultSets: number,
  templateId: string
): Promise<ActionResult<{ templateExercise: WorkoutTemplateExercise }>> {
  try {
    updateTemplateExerciseSchema.parse({ position: 0, default_sets: defaultSets })
    
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    
    // Verify template ownership
    const { data: template } = await supabase
      .from('workout_templates')
      .select('user_id')
      .eq('id', templateId)
      .single()
    
    if (!template || template.user_id !== user.id) {
      throw new Error('Not authorized')
    }
    
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .update({ default_sets: defaultSets })
      .eq('id', templateExerciseId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath(`/workouts/${templateId}`)
    return { success: true, templateExercise: data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update' }
  }
}
