'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Dumbbell, Plus, Sparkles, Trash2 } from 'lucide-react'
import {
  addExerciseToTemplate,
  createExercise,
  deleteWorkoutTemplate,
  removeExerciseFromTemplate,
  reorderTemplateExercises,
  updateTemplateExerciseDefaultSets,
  updateWorkoutTemplate,
} from '@/lib/actions/workouts'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { StartWorkoutButton } from '@/components/start-workout-button'
import type { Exercise } from '@/lib/types/database'
import type { TemplateExerciseWithExercise, WorkoutTemplateWithExercises } from '@/lib/types/app'

interface WorkoutTemplateEditorProps {
  template: WorkoutTemplateWithExercises
  exercises: Exercise[]
}

const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full body', 'Other']

export function WorkoutTemplateEditor({ template, exercises }: WorkoutTemplateEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [library, setLibrary] = useState(exercises)
  const [items, setItems] = useState(
    [...template.workout_template_exercises].sort((first, second) => first.position - second.position)
  )
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [defaultSets, setDefaultSets] = useState('3')
  const [newExerciseName, setNewExerciseName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const availableExercises = useMemo(() => {
    const usedIds = new Set(items.map((item) => item.exercise_id))
    return library.filter((exercise) => !usedIds.has(exercise.id))
  }, [items, library])

  function showResult(result: { success: boolean; error?: string }, successMessage: string) {
    if (result.success) {
      setToast({ message: successMessage, type: 'success' })
      router.refresh()
    } else {
      setToast({ message: result.error || 'Something went wrong.', type: 'error' })
    }
  }

  function saveDetails() {
    startTransition(async () => {
      const result = await updateWorkoutTemplate(template.id, name, description)
      showResult(result, 'Template updated')
    })
  }

  function addExistingExercise() {
    if (!selectedExerciseId) return
    const selected = library.find((exercise) => exercise.id === selectedExerciseId)
    startTransition(async () => {
      const result = await addExerciseToTemplate(template.id, selectedExerciseId, Number(defaultSets))
      if (result.success && result.templateExercise && selected) {
        const nextItem: TemplateExerciseWithExercise = {
          ...result.templateExercise,
          exercises: selected,
        }
        setItems((current) => [...current, nextItem])
        setSelectedExerciseId('')
        setDefaultSets('3')
        showResult(result, 'Exercise added')
      } else {
        showResult(result, 'Exercise added')
      }
    })
  }

  function createAndAddExercise() {
    if (!newExerciseName.trim()) return
    startTransition(async () => {
      const exerciseResult = await createExercise(newExerciseName.trim(), muscleGroup)
      if (!exerciseResult.success || !exerciseResult.exercise) {
        showResult(exerciseResult, 'Exercise created')
        return
      }

      setLibrary((current) => [...current, exerciseResult.exercise])
      const addResult = await addExerciseToTemplate(
        template.id,
        exerciseResult.exercise.id,
        Number(defaultSets)
      )
      if (addResult.success && addResult.templateExercise) {
        setItems((current) => [
          ...current,
          { ...addResult.templateExercise, exercises: exerciseResult.exercise },
        ])
        setNewExerciseName('')
        setMuscleGroup('')
        setDefaultSets('3')
        setShowCreateExercise(false)
      }
      showResult(addResult, 'Exercise created and added')
    })
  }

  function remove(itemId: string) {
    startTransition(async () => {
      const result = await removeExerciseFromTemplate(itemId, template.id)
      if (result.success) setItems((current) => current.filter((item) => item.id !== itemId))
      showResult(result, 'Exercise removed')
    })
  }

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) return

    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    setItems(next)

    startTransition(async () => {
      const result = await reorderTemplateExercises(template.id, next.map((item) => item.id))
      showResult(result, 'Order updated')
    })
  }

  function updateSets(itemId: string, sets: string) {
    const value = Number(sets)
    if (!Number.isInteger(value) || value < 1) return
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, default_sets: value } : item))
    )
    startTransition(async () => {
      const result = await updateTemplateExerciseDefaultSets(itemId, value, template.id)
      showResult(result, 'Sets updated')
    })
  }

  function deleteTemplate() {
    startTransition(async () => {
      const result = await deleteWorkoutTemplate(template.id)
      if (result.success) {
        router.push('/workouts')
        router.refresh()
      } else {
        showResult(result, 'Template deleted')
      }
    })
  }

  return (
    <>
      <PageHeader title="Edit Workout" backHref="/workouts" />

      <div className="space-y-5">
        <Card className="space-y-5 p-5" interactive={false}>
          <Input label="Workout Name" value={name} onChange={(event) => setName(event.target.value)} />
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input-field resize-none"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" className="w-full" onClick={saveDetails} isLoading={isPending}>
            Save Details
          </Button>
        </Card>

        <Card className="space-y-4 p-5" interactive={false}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Exercises</h2>
            </div>
            <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-bold text-[var(--text-secondary)]">
              {items.length}
            </span>
          </div>
          {items.length === 0 ? (
            <p className="rounded-xl border border-[var(--border-color)] bg-white/[0.03] p-4 text-sm text-[var(--text-secondary)]">
              Add at least one exercise before starting.
            </p>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="tabular mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-black text-[var(--text-secondary)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-lg font-black tracking-tight text-[var(--text-primary)]">{item.exercises?.name || 'Exercise'}</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">{item.exercises?.muscle_group || 'No muscle group'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-icon hover:text-red-300"
                    onClick={() => remove(item.id)}
                    aria-label="Remove exercise"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
                  <Input
                    label="Default Sets"
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    value={item.default_sets}
                    onChange={(event) => updateSets(item.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-icon mt-7 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move exercise up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon mt-7 disabled:opacity-40"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move exercise down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-5 p-5" interactive={false}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Add Exercise</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose from your exercise library.</p>
            </div>
            <button
              type="button"
              className="btn-secondary px-3"
              onClick={() => setShowCreateExercise(true)}
            >
              <Sparkles className="h-4 w-4" />
              Create
            </button>
          </div>
          <select
            className="input-field"
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
          >
            <option value="">Choose exercise</option>
            {availableExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
          <Input
            label="Default Sets"
            type="number"
            min="1"
            max="20"
            inputMode="numeric"
            value={defaultSets}
            onChange={(event) => setDefaultSets(event.target.value)}
          />
          <Button type="button" variant="secondary" className="w-full" onClick={addExistingExercise} disabled={!selectedExerciseId} isLoading={isPending}>
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </Card>

        <StartWorkoutButton templateId={template.id} className="w-full" />
        <Button type="button" variant="destructive" className="w-full" onClick={() => setShowDelete(true)}>
          Delete Workout
        </Button>
      </div>

      <Dialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Delete Workout"
        actions={
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={deleteTemplate} isLoading={isPending}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-secondary)]">This deletes the template only. Completed workout history remains.</p>
      </Dialog>

      <Dialog
        isOpen={showCreateExercise}
        onClose={() => setShowCreateExercise(false)}
        title="Create Exercise"
        actions={
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreateExercise(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="flex-1"
              onClick={createAndAddExercise}
              disabled={!newExerciseName.trim()}
              isLoading={isPending}
            >
              Add
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Exercise Name"
            placeholder="Incline Dumbbell Press"
            value={newExerciseName}
            onChange={(event) => setNewExerciseName(event.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Muscle Group</label>
            <select className="input-field" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)}>
              <option value="">Optional</option>
              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Default Sets"
            type="number"
            min="1"
            max="20"
            inputMode="numeric"
            value={defaultSets}
            onChange={(event) => setDefaultSets(event.target.value)}
          />
        </div>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
