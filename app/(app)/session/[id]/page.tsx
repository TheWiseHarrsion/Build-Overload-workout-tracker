import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ActiveWorkoutScreen } from '@/components/active-workout-screen'
import type { PreviousSetValue, WorkoutSessionWithDetails } from '@/lib/types/app'

interface SessionPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: session } = await supabase
    .from('workout_sessions')
    .select(
      '*,session_exercises(id,workout_session_id,exercise_id,position,created_at,exercises(id,name,muscle_group),exercise_sets(*))'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const typedSession = session as unknown as WorkoutSessionWithDetails
  if (!typedSession || typedSession.completed_at) notFound()
  const exerciseIds = typedSession.session_exercises.map((exercise) => exercise.exercise_id)
  const previousValues: PreviousSetValue[] = []

  if (exerciseIds.length > 0) {
    const { data: previousSessions } = await supabase
      .from('workout_sessions')
      .select(
        'completed_at,session_exercises(exercise_id,exercise_sets(set_number,weight,reps,is_completed))'
      )
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(25)

    for (const previousSession of (previousSessions || []) as unknown as Array<{
      session_exercises: Array<{
        exercise_id: string
        exercise_sets: Array<{
          set_number: number
          weight: number
          reps: number
          is_completed: boolean
        }>
      }>
    }>) {
      for (const sessionExercise of previousSession.session_exercises) {
        if (!exerciseIds.includes(sessionExercise.exercise_id)) continue
        for (const set of sessionExercise.exercise_sets) {
          const exists = previousValues.some(
            (value) =>
              value.exerciseId === sessionExercise.exercise_id &&
              value.setNumber === set.set_number
          )
          if (!exists && set.is_completed) {
            previousValues.push({
              exerciseId: sessionExercise.exercise_id,
              setNumber: set.set_number,
              weight: set.weight,
              reps: set.reps,
            })
          }
        }
      }
    }
  }

  const draftVersion = typedSession.session_exercises
    .flatMap((exercise) => exercise.exercise_sets.map((set) => `${set.id}:${set.updated_at}`))
    .join('|')

  return (
    <ActiveWorkoutScreen
      key={draftVersion}
      session={typedSession}
      previousValues={previousValues}
    />
  )
}
