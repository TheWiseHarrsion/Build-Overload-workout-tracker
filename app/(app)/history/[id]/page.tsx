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
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-white">
                {formatDuration(session.started_at, session.completed_at)}
              </p>
              <p className="mt-1 text-xs text-[#a0a0a0]">Duration</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{completedSetCount}</p>
              <p className="mt-1 text-xs text-[#a0a0a0]">Sets</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">{formatVolume(totalVolume)}</p>
              <p className="mt-1 text-xs text-[#a0a0a0]">Volume</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-xs text-[#a0a0a0]">Completed</p>
          <p className="font-medium text-white">{formatDateTime(session.completed_at)}</p>
        </Card>

        {session.notes && (
          <Card className="p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-white">{session.notes}</p>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Exercises</h2>
          {session.session_exercises.map((exercise) => {
            const completedSets = exercise.exercise_sets
              .filter((set) => set.is_completed)
              .sort((first, second) => first.set_number - second.set_number)
            const exerciseVolume = calculateTotalSessionVolume(completedSets)

            return (
              <Card key={exercise.id} className="p-4">
                <h3 className="mb-3 font-semibold text-white">
                  {exercise.exercises?.name || 'Exercise'}
                </h3>
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-[#a0a0a0]">Max Weight</p>
                    <p className="font-medium text-white">{formatWeight(calculateMaxWeight(completedSets))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a0a0a0]">Best Reps</p>
                    <p className="font-medium text-white">{formatReps(calculateBestReps(completedSets))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#a0a0a0]">Volume</p>
                    <p className="font-medium text-white">{formatVolume(exerciseVolume)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {completedSets.length > 0 ? (
                    completedSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between rounded-lg bg-[#0f0f0f] p-2 text-sm"
                      >
                        <span className="text-[#a0a0a0]">Set {set.set_number}</span>
                        <span className="font-medium text-white">
                          {formatWeightAndReps(set.weight, set.reps)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#a0a0a0]">No completed sets.</p>
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
