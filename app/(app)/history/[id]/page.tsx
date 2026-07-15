import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Card } from '@/components/ui/card'
import { DeleteSessionButton } from '@/components/delete-session-button'
import {
  formatDateTime,
  formatDuration,
  formatReps,
  formatVolume,
  formatWeight,
  formatWeightAndReps,
} from '@/lib/formatting/dates'
import {
  calculateBestReps,
  calculateMaxWeight,
  calculateTotalSessionVolume,
} from '@/lib/calculations/progress'
import type { WorkoutSessionWithDetails } from '@/lib/types/app'

interface SessionDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id } = await params
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
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const session = data as unknown as WorkoutSessionWithDetails | null
  if (!session || !session.completed_at) notFound()

  const completedSetCount = session.session_exercises.reduce(
    (total, exercise) => total + exercise.exercise_sets.filter((set) => set.is_completed).length,
    0
  )
  const totalVolume = session.session_exercises.reduce(
    (total, exercise) => total + calculateTotalSessionVolume(exercise.exercise_sets),
    0
  )

  return (
    <>
      <PageHeader
        title={session.name}
        backHref="/history"
        action={<DeleteSessionButton sessionId={session.id} compact />}
      />

      <div className="space-y-4">
        <Card className="p-4" interactive={false}>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="tabular text-xl font-black text-[var(--text-primary)]">
                {formatDuration(session.started_at, session.completed_at)}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Duration</p>
            </div>
            <div>
              <p className="tabular text-xl font-black text-[var(--text-primary)]">{completedSetCount}</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Sets</p>
            </div>
            <div>
              <p className="tabular text-xl font-black text-[var(--text-primary)]">{formatVolume(totalVolume)}</p>
              <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Volume</p>
            </div>
          </div>
        </Card>

        <Card className="p-4" interactive={false}>
          <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Completed</p>
          <p className="font-semibold text-[var(--text-primary)]">{formatDateTime(session.completed_at)}</p>
        </Card>

        {session.notes && (
          <Card className="p-4" interactive={false}>
            <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Notes</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-primary)]">{session.notes}</p>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">Exercises</h2>
          {session.session_exercises.map((exercise) => {
            const completedSets = exercise.exercise_sets
              .filter((set) => set.is_completed)
              .sort((first, second) => first.set_number - second.set_number)
            const exerciseVolume = calculateTotalSessionVolume(completedSets)

            return (
              <Card key={exercise.id} className="p-4" interactive={false}>
                <h3 className="mb-3 text-lg font-black text-[var(--text-primary)]">
                  {exercise.exercises?.name || 'Exercise'}
                </h3>
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Max Weight</p>
                    <p className="tabular font-bold text-[var(--text-primary)]">{formatWeight(calculateMaxWeight(completedSets))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Best Reps</p>
                    <p className="tabular font-bold text-[var(--text-primary)]">{formatReps(calculateBestReps(completedSets))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Volume</p>
                    <p className="tabular font-bold text-[var(--text-primary)]">{formatVolume(exerciseVolume)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {completedSets.length > 0 ? (
                    completedSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between rounded-lg bg-white/[0.04] p-3 text-sm"
                      >
                        <span className="tabular text-[var(--text-secondary)]">Set {set.set_number}</span>
                        <span className="tabular font-bold text-[var(--text-primary)]">
                          {formatWeightAndReps(set.weight, set.reps)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">No completed sets.</p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        <DeleteSessionButton sessionId={session.id} />
      </div>
    </>
  )
}
