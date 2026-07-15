import { TrendingUp } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressExplorer } from '@/components/progress-explorer'
import type { Exercise } from '@/lib/types/database'
import type { WorkoutSessionWithDetails } from '@/lib/types/app'

export default async function ProgressPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: exerciseData }, { data: sessionData }] = await Promise.all([
    supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('workout_sessions')
      .select(
        '*,session_exercises(id,workout_session_id,exercise_id,position,created_at,exercises(id,name,muscle_group),exercise_sets(*))'
      )
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: true }),
  ])

  const exercises = (exerciseData || []) as Exercise[]
  const sessions = (sessionData || []) as unknown as WorkoutSessionWithDetails[]

  return (
    <>
      <PageHeader title="Progress" />
      {exercises.length > 0 ? (
        <ProgressExplorer exercises={exercises} sessions={sessions} />
      ) : (
        <EmptyState
          title="No exercises found"
          description="Create a workout and complete sets to start tracking progress."
          icon={<TrendingUp className="h-12 w-12" />}
        />
      )}
    </>
  )
}
