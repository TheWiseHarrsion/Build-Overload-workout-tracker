import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDuration, formatVolume } from '@/lib/formatting/dates'
import { calculateTotalSessionVolume } from '@/lib/calculations/progress'
import type { WorkoutSessionWithDetails } from '@/lib/types/app'

export default async function HistoryPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('workout_sessions')
    .select(
      '*,session_exercises(id,workout_session_id,exercise_id,position,created_at,exercises(id,name,muscle_group),exercise_sets(*))'
    )
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })

  const sessions = (data || []) as unknown as WorkoutSessionWithDetails[]

  return (
    <>
      <PageHeader title="History" />

      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const completedSets = session.session_exercises.reduce(
              (total, exercise) => total + exercise.exercise_sets.filter((set) => set.is_completed).length,
              0
            )
            const totalVolume = session.session_exercises.reduce(
              (total, exercise) => total + calculateTotalSessionVolume(exercise.exercise_sets),
              0
            )

            return (
              <Link key={session.id} href={`/history/${session.id}`} className="block">
                <Card className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white">{session.name}</h2>
                    <span className="text-xs text-[#a0a0a0]">
                      {formatDate(session.completed_at || session.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#a0a0a0]">
                    {formatDuration(session.started_at, session.completed_at || undefined)} ·{' '}
                    {session.session_exercises.length} exercises · {completedSets} sets ·{' '}
                    {formatVolume(totalVolume)}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No workouts recorded"
          description="Complete a workout to see it appear here."
          icon={<Calendar className="h-12 w-12" />}
        />
      )}
    </>
  )
}
