'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { updateExerciseSetSchema, completeWorkoutSessionSchema } from '@/lib/validation/schemas'
import type { ActionResult } from '@/lib/types/app'

async function getUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  return { supabase, userId: user.id }
}

async function assertSessionOwner(sessionId: string) {
  const { supabase, userId } = await getUserId()
  const { data: sessionData, error } = await supabase
    .from('workout_sessions')
    .select('id,user_id')
    .eq('id', sessionId)
    .single()
  const session = sessionData as unknown as { id: string; user_id: string } | null

  if (error || !session || session.user_id !== userId) {
    throw new Error('Not authorized')
  }

  return { supabase, userId }
}

export async function startWorkoutSession(
  templateId: string,
  discardActive = false
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const { supabase, userId } = await getUserId()

    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .select('id,user_id,name')
      .eq('id', templateId)
      .single()
    const template = templateData as unknown as { id: string; user_id: string; name: string } | null

    if (templateError || !template || template.user_id !== userId) {
      return { success: false, error: 'Workout template not found.' }
    }

    const { data: activeSessionsData } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .is('completed_at', null)
      .limit(1)

    const activeSessions = activeSessionsData as unknown as Array<{ id: string }> | null
    const activeSessionId = activeSessions?.[0]?.id
    if (activeSessionId && !discardActive) {
      return {
        success: false,
        error: 'You already have an active workout.',
        sessionId: activeSessionId,
      }
    }

    if (activeSessionId && discardActive) {
      const { error: deleteError } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', activeSessionId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError
    }

    const { data: templateExercisesData, error: templateExercisesError } = await supabase
      .from('workout_template_exercises')
      .select('exercise_id,default_sets,position')
      .eq('workout_template_id', templateId)
      .order('position', { ascending: true })
    const templateExercises = templateExercisesData as unknown as Array<{
      exercise_id: string
      default_sets: number
      position: number
    }> | null

    if (templateExercisesError) throw templateExercisesError
    if (!templateExercises || templateExercises.length === 0) {
      return { success: false, error: 'Add at least one exercise before starting.' }
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        workout_template_id: template.id,
        name: template.name,
      })
      .select('id')
      .single()
    const session = sessionData as unknown as { id: string } | null

    if (sessionError || !session) throw sessionError

    try {
      for (const templateExercise of templateExercises) {
        const { data: sessionExerciseData, error: sessionExerciseError } = await supabase
          .from('session_exercises')
          .insert({
            workout_session_id: session.id,
            exercise_id: templateExercise.exercise_id,
            position: templateExercise.position,
          })
          .select('id')
          .single()
        const sessionExercise = sessionExerciseData as unknown as { id: string } | null

        if (sessionExerciseError || !sessionExercise) throw sessionExerciseError

        const sets = Array.from({ length: templateExercise.default_sets }, (_, index) => ({
          session_exercise_id: sessionExercise.id,
          set_number: index + 1,
        }))

        const { error: setsError } = await supabase.from('exercise_sets').insert(sets)
        if (setsError) throw setsError
      }
    } catch (error) {
      await supabase.from('workout_sessions').delete().eq('id', session.id).eq('user_id', userId)
      throw error
    }

    revalidatePath('/')
    revalidatePath('/workouts')
    return { success: true, sessionId: session.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start workout.',
    }
  }
}

export async function updateExerciseSet(
  setId: string,
  values: { weight: number; reps: number; is_completed?: boolean }
): Promise<ActionResult> {
  try {
    const parsed = updateExerciseSetSchema.parse(values)
    const { supabase, userId } = await getUserId()

    const { data: setData, error: setError } = await supabase
      .from('exercise_sets')
      .select(
        'id,session_exercise_id,session_exercises!inner(workout_session_id,workout_sessions!inner(user_id))'
      )
      .eq('id', setId)
      .single()
    const set = setData as unknown as {
      id: string
      session_exercises: {
        workout_session_id: string
        workout_sessions: { user_id: string }
      }
    } | null

    if (setError || !set) throw new Error('Set not found')

    const nested = set.session_exercises as unknown as {
      workout_session_id: string
      workout_sessions: { user_id: string }
    }

    if (nested.workout_sessions.user_id !== userId) throw new Error('Not authorized')

    const { error } = await supabase
      .from('exercise_sets')
      .update(parsed)
      .eq('id', setId)

    if (error) throw error

    revalidatePath(`/session/${nested.workout_session_id}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update set.',
    }
  }
}

export async function addSetToExercise(
  sessionExerciseId: string,
  sessionId: string
): Promise<ActionResult> {
  try {
    const { supabase } = await assertSessionOwner(sessionId)

    const { data: sessionExerciseData, error: sessionExerciseError } = await supabase
      .from('session_exercises')
      .select('id,workout_session_id')
      .eq('id', sessionExerciseId)
      .eq('workout_session_id', sessionId)
      .single()
    const sessionExercise = sessionExerciseData as unknown as {
      id: string
      workout_session_id: string
    } | null

    if (sessionExerciseError || !sessionExercise) throw new Error('Exercise not found')

    const { data: setsData } = await supabase
      .from('exercise_sets')
      .select('set_number')
      .eq('session_exercise_id', sessionExerciseId)
      .order('set_number', { ascending: false })
      .limit(1)

    const sets = setsData as unknown as Array<{ set_number: number }> | null
    const setNumber = (sets?.[0]?.set_number || 0) + 1
    const { error } = await supabase.from('exercise_sets').insert({
      session_exercise_id: sessionExerciseId,
      set_number: setNumber,
    })

    if (error) throw error

    revalidatePath(`/session/${sessionId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add set.',
    }
  }
}

export async function removeSet(setId: string, sessionId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertSessionOwner(sessionId)
    const { error } = await supabase.from('exercise_sets').delete().eq('id', setId)

    if (error) throw error

    revalidatePath(`/session/${sessionId}`)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove set.',
    }
  }
}

export async function completeWorkoutSession(
  sessionId: string,
  notes?: string,
  allowEmpty = false
): Promise<ActionResult<{ records: string[] }>> {
  try {
    completeWorkoutSessionSchema.parse({ notes })
    const { supabase } = await assertSessionOwner(sessionId)

    const { data: sessionExercisesData } = await supabase
      .from('session_exercises')
      .select('id,exercise_id,exercises(name),exercise_sets(weight,reps,is_completed)')
      .eq('workout_session_id', sessionId)
    const sessionExercises = sessionExercisesData as unknown as Array<{
      exercise_sets: Array<{ is_completed: boolean }>
    }> | null

    const completedSetCount =
      sessionExercises?.reduce((total, exercise) => {
        const sets = exercise.exercise_sets as unknown as Array<{ is_completed: boolean }>
        return total + sets.filter((set) => set.is_completed).length
      }, 0) || 0

    if (completedSetCount === 0 && !allowEmpty) {
      return { success: false, error: 'Complete at least one set before finishing.' }
    }

    const { error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        notes: notes?.trim() || null,
      })
      .eq('id', sessionId)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/history')
    revalidatePath('/progress')
    return { success: true, records: [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete workout.',
    }
  }
}

export async function cancelWorkoutSession(sessionId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await assertSessionOwner(sessionId)
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/')
    revalidatePath('/workouts')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel workout.',
    }
  }
}

export async function deleteWorkoutSession(sessionId: string): Promise<ActionResult> {
  return cancelWorkoutSession(sessionId)
}
