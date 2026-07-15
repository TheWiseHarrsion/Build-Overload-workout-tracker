import Link from 'next/link'
import { Calendar, ChevronRight } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDuration, formatVolume } from '@/lib/formatting/dates'
import { calculateTotalSessionVolume } from '@/lib/calculations/progress'
import type { WorkoutSessionWithDetails } from '@/lib/types/app'

function historyGroup(date: string | null) {
  if (!date) return 'Older'
  const value = new Date(date)
  const now = new Date()
  const weekAgo = new Date()
  weekAgo.setDate(now.getDate() - 7)

  if (value >= weekAgo) return 'This Week'
  if (value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear()) {
    return 'Earlier This Month'
  }
  return 'Older'
}

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
  const groups = sessions.reduce<Record<string, WorkoutSessionWithDetails[]>>((accumulator, session) => {
    const group = historyGroup(session.completed_at)
    accumulator[group] = [...(accumulator[group] || []), session]
    return accumulator
  }, {})

  return (
    <>
      <PageHeader title="History" description="Completed training sessions." />

      {sessions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, groupSessions]) => (
            <section key={group} className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--text-secondary)]">{group}</h2>
              {groupSessions.map((session) => {
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
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black text-[var(--text-primary)]">{session.name}</h3>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            {formatDate(session.completed_at || session.created_at)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          {formatDuration(session.started_at, session.completed_at || undefined)}
                        </span>
                        <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          {completedSets} sets
                        </span>
                        <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                          {formatVolume(totalVolume)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No workout history"
          description="Complete a workout to see it appear here."
          icon={<Calendar className="h-7 w-7" />}
        />
      )}
    </>
  )
}
