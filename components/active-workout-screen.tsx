'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Clock, Dumbbell, Plus, Trash2, X } from 'lucide-react'
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

  const allSets = Object.values(setsByExercise).flat()
  const completedSetCount = allSets.filter((set) => set.is_completed).length
  const totalSetCount = allSets.length
  const progress = totalSetCount ? Math.round((completedSetCount / totalSetCount) * 100) : 0

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
      <header className="top-glass sticky top-0 z-30 -mx-4 px-4">
        <div className="page-header-shell flex items-center justify-between gap-3">
          <button
            type="button"
            aria-label="Cancel workout"
            className="btn-icon shrink-0"
            onClick={() => setShowCancel(true)}
          >
            <X className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate text-lg font-black tracking-tight text-[var(--text-primary)]">{session.name}</h1>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-[var(--text-secondary)]">
              <Clock className="h-4 w-4" />
              {elapsed}
            </p>
          </div>
          <Button type="button" variant="primary" className="shrink-0 px-4" onClick={() => setShowFinish(true)}>
            Finish
          </Button>
        </div>
      </header>

      <div className="space-y-4 pb-28">
        <Card className="p-4" interactive={false}>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-bold text-[var(--text-primary)]">
              {completedSetCount} of {totalSetCount} sets completed
            </span>
            <span className="tabular font-black text-[var(--accent)]">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progress}%` }} />
          </div>
        </Card>

        {session.session_exercises.map((exercise) => {
          const sets = setsByExercise[exercise.id] || []
          const completedExerciseSets = sets.filter((set) => set.is_completed).length
          const firstPrevious = previousMap.get(`${exercise.exercise_id}:1`)

          return (
            <Card key={exercise.id} className="p-4" interactive={false}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-xs font-bold">{completedExerciseSets}/{sets.length} sets</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                    {exercise.exercises?.name || 'Exercise'}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                    {exercise.exercises?.muscle_group || 'No muscle group'}
                    {firstPrevious ? ` - Last time: ${formatWeightAndReps(firstPrevious.weight, firstPrevious.reps)}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[2.25rem_3.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 border-b border-[var(--border-color)] pb-2 text-center text-[11px] font-bold text-[var(--text-tertiary)]">
                <span>Set</span>
                <span>Prev</span>
                <span>kg</span>
                <span>Reps</span>
                <span>Done</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {sets.map((set) => {
                  const previous = previousMap.get(`${exercise.exercise_id}:${set.set_number}`)
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-[2.25rem_3.75rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2 py-3 ${
                        set.is_completed ? 'rounded-xl bg-emerald-500/[0.08]' : ''
                      }`}
                    >
                      <span className="tabular text-center text-sm font-black text-[var(--text-primary)]">
                        {set.set_number}
                      </span>
                      <span className="truncate text-center text-xs font-semibold text-[var(--text-tertiary)]">
                        {previous ? `${previous.weight}x${previous.reps}` : '-'}
                      </span>
                      <input
                        aria-label={`Set ${set.set_number} weight`}
                        className="input-field tabular min-h-11 px-2 py-2 text-center text-lg font-black"
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
                        className="input-field tabular min-h-11 px-2 py-2 text-center text-lg font-black"
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
                      <button
                        type="button"
                        aria-label={`${set.is_completed ? 'Uncomplete' : 'Complete'} set ${set.set_number}`}
                        className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl border ${
                          set.is_completed
                            ? 'border-emerald-400/40 bg-emerald-400 text-black'
                            : 'border-[var(--border-strong)] bg-white/[0.04] text-[var(--text-secondary)]'
                        }`}
                        onClick={() => saveSet(exercise.id, set, !set.is_completed)}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      {sets.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remove set ${set.set_number}`}
                          className="col-start-2 col-end-6 ml-auto mt-1 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-bold text-red-300"
                          onClick={() => deleteSet(exercise.id, set.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove set
                        </button>
                      )}
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
                <Plus className="h-4 w-4" />
                Add Set
              </Button>
            </Card>
          )
        })}
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
            <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-100">
              No completed sets yet. Confirm only if you intended to save an empty workout.
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
        <p className="text-sm leading-6 text-[var(--text-secondary)]">This deletes the active workout and all sets entered in it.</p>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
