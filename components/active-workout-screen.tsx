'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Circle, Clock, Trash2, X } from 'lucide-react'
import {
  addSetToExercise,
  cancelWorkoutSession,
  completeWorkoutSession,
  removeSet,
  updateExerciseSet,
} from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Toast } from '@/components/ui/toast'
import { formatDuration, formatWeightAndReps } from '@/lib/formatting/dates'
import type { ExerciseSet } from '@/lib/types/database'
import type { PreviousSetValue, WorkoutSessionWithDetails } from '@/lib/types/app'

interface ActiveWorkoutScreenProps {
  session: WorkoutSessionWithDetails
  previousValues: PreviousSetValue[]
}

type DraftSet = Pick<ExerciseSet, 'id' | 'set_number' | 'weight' | 'reps' | 'is_completed'>

export function ActiveWorkoutScreen({ session, previousValues }: ActiveWorkoutScreenProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [elapsed, setElapsed] = useState(formatDuration(session.started_at))
  const [notes, setNotes] = useState('')
  const [showFinish, setShowFinish] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [setsByExercise, setSetsByExercise] = useState(() =>
    Object.fromEntries(
      session.session_exercises.map((exercise) => [
        exercise.id,
        [...exercise.exercise_sets].sort((first, second) => first.set_number - second.set_number),
      ])
    ) as Record<string, DraftSet[]>
  )

  const previousMap = useMemo(() => {
    const map = new Map<string, PreviousSetValue>()
    previousValues.forEach((value) => {
      map.set(`${value.exerciseId}:${value.setNumber}`, value)
    })
    return map
  }, [previousValues])

  const completedSetCount = Object.values(setsByExercise)
    .flat()
    .filter((set) => set.is_completed).length

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed(formatDuration(session.started_at))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [session.started_at])

  function updateDraft(exerciseId: string, setId: string, values: Partial<DraftSet>) {
    setSetsByExercise((current) => ({
      ...current,
      [exerciseId]: current[exerciseId].map((set) =>
        set.id === setId ? { ...set, ...values } : set
      ),
    }))
  }

  function saveSet(exerciseId: string, set: DraftSet, completed?: boolean) {
    const nextCompleted = completed ?? set.is_completed
    updateDraft(exerciseId, set.id, { is_completed: nextCompleted })
    startTransition(async () => {
      const result = await updateExerciseSet(set.id, {
        weight: Number(set.weight) || 0,
        reps: Number(set.reps) || 0,
        is_completed: nextCompleted,
      })

      setToast({
        message: result.success ? 'Set saved' : result.error,
        type: result.success ? 'success' : 'error',
      })
      router.refresh()
    })
  }

  function addSet(sessionExerciseId: string) {
    startTransition(async () => {
      const result = await addSetToExercise(sessionExerciseId, session.id)
      if (result.success) {
        router.refresh()
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    })
  }

  function deleteSet(sessionExerciseId: string, setId: string) {
    startTransition(async () => {
      const result = await removeSet(setId, session.id)
      if (result.success) {
        setSetsByExercise((current) => ({
          ...current,
          [sessionExerciseId]: current[sessionExerciseId].filter((set) => set.id !== setId),
        }))
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    })
  }

  function finishWorkout(allowEmpty = false) {
    startTransition(async () => {
      const result = await completeWorkoutSession(session.id, notes, allowEmpty)
      if (result.success) {
        router.push(`/history/${session.id}`)
        router.refresh()
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    })
  }

  function cancelWorkout() {
    startTransition(async () => {
      const result = await cancelWorkoutSession(session.id)
      if (result.success) {
        router.push('/')
        router.refresh()
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    })
  }

  return (
    <>
      <div className="sticky top-0 z-30 -mx-4 border-b border-[#222222] bg-black/95 px-4 pb-4 pt-3 safe-top">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{session.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#a0a0a0]">
              <Clock className="h-4 w-4" />
              {elapsed}
            </p>
          </div>
          <button
            type="button"
            aria-label="Cancel workout"
            className="rounded-xl p-3 text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-white"
            onClick={() => setShowCancel(true)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-5 pb-28 pt-4">
        {session.session_exercises.map((exercise) => {
          const sets = setsByExercise[exercise.id] || []
          return (
            <Card key={exercise.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {exercise.exercises?.name || 'Exercise'}
                  </h2>
                  <p className="text-xs text-[#a0a0a0]">
                    Enter weight and reps, then tap the circle in Done to complete a set.
                  </p>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-[2.2rem_1fr_4.8rem_4rem_3rem] gap-2 text-xs font-medium text-[#808080]">
                <span>Set</span>
                <span>Previous</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Done</span>
              </div>

              <div className="space-y-2">
                {sets.map((set) => {
                  const previous = previousMap.get(`${exercise.exercise_id}:${set.set_number}`)
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-[2.2rem_1fr_4.8rem_4rem_3rem] items-center gap-2 rounded-xl border p-2 ${
                        set.is_completed
                          ? 'border-[#06b6d4]/50 bg-[#062f38]'
                          : 'border-[#333333] bg-[#0f0f0f]'
                      }`}
                    >
                      <span className="text-sm font-medium text-white">{set.set_number}</span>
                      <span className="truncate text-xs text-[#a0a0a0]">
                        {previous ? formatWeightAndReps(previous.weight, previous.reps) : '-'}
                      </span>
                      <input
                        aria-label={`Set ${set.set_number} weight`}
                        className="input-field px-2 py-2 text-base"
                        inputMode="decimal"
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight || ''}
                        onChange={(event) =>
                          updateDraft(exercise.id, set.id, {
                            weight: Number(event.target.value) || 0,
                          })
                        }
                        onBlur={() => saveSet(exercise.id, set)}
                      />
                      <input
                        aria-label={`Set ${set.set_number} repetitions`}
                        className="input-field px-2 py-2 text-base"
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="1"
                        value={set.reps || ''}
                        onChange={(event) =>
                          updateDraft(exercise.id, set.id, {
                            reps: Number.parseInt(event.target.value, 10) || 0,
                          })
                        }
                        onBlur={() => saveSet(exercise.id, set)}
                      />
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`${set.is_completed ? 'Uncomplete' : 'Complete'} set ${set.set_number}`}
                          className="rounded-lg p-2 text-[#06b6d4]"
                          onClick={() => saveSet(exercise.id, set, !set.is_completed)}
                        >
                          {set.is_completed ? (
                            <CheckCircle2 className="h-6 w-6" />
                          ) : (
                            <Circle className="h-6 w-6" />
                          )}
                        </button>
                        {sets.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove set ${set.set_number}`}
                            className="rounded-lg p-2 text-[#a0a0a0] hover:text-red-400"
                            onClick={() => deleteSet(exercise.id, set.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => addSet(exercise.id)}
                isLoading={isPending}
              >
                Add Another Set
              </Button>
            </Card>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#333333] bg-black/95 p-4 safe-bottom">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCancel(true)}>
            Cancel
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={() => setShowFinish(true)}>
            Finish
          </Button>
        </div>
      </div>

      <Dialog
        isOpen={showFinish}
        onClose={() => setShowFinish(false)}
        title="Finish Workout"
        actions={
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowFinish(false)}>
              Keep Training
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={() => finishWorkout(completedSetCount === 0)}
              isLoading={isPending}
            >
              {completedSetCount === 0 ? 'Finish Empty' : 'Finish'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {completedSetCount === 0 && (
            <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-200">
              No completed sets yet. Complete at least one set before finishing.
              If you intended to save an empty workout, confirm with Finish Empty.
            </p>
          )}
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Optional notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Workout"
        actions={
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCancel(false)}>
              Keep Workout
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={cancelWorkout} isLoading={isPending}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[#a0a0a0]">This deletes the active workout and all sets entered in it.</p>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
