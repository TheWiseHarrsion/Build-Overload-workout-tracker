'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
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

      <div className="space-y-4">
        <Card className="space-y-4 p-4">
          <Input label="Workout Name" value={name} onChange={(event) => setName(event.target.value)} />
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="description">
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

        <Card className="space-y-3 p-4">
          <h2 className="text-lg font-semibold text-white">Exercises</h2>
          {items.length === 0 ? (
            <p className="text-sm text-[#a0a0a0]">Add at least one exercise before starting.</p>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-[#333333] bg-[#0f0f0f] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{item.exercises?.name || 'Exercise'}</p>
                    <p className="text-xs text-[#a0a0a0]">{item.exercises?.muscle_group || 'No muscle group'}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[#a0a0a0] hover:bg-[#1a1a1a] hover:text-red-400"
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
                    className="mt-7 rounded-xl bg-[#1a1a1a] p-3 text-white disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move exercise up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="mt-7 rounded-xl bg-[#1a1a1a] p-3 text-white disabled:opacity-40"
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

        <Card className="space-y-4 p-4">
          <h2 className="text-lg font-semibold text-white">Add Existing Exercise</h2>
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
            <Plus className="mr-2 inline h-4 w-4" />
            Add Exercise
          </Button>
        </Card>

        <Card className="space-y-4 p-4">
          <h2 className="text-lg font-semibold text-white">Create Exercise</h2>
          <Input label="Exercise Name" value={newExerciseName} onChange={(event) => setNewExerciseName(event.target.value)} />
          <select className="input-field" value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)}>
            <option value="">Muscle group (optional)</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary" className="w-full" onClick={createAndAddExercise} disabled={!newExerciseName.trim()} isLoading={isPending}>
            Create and Add
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
        <p className="text-sm text-[#a0a0a0]">This deletes the template only. Completed workout history remains.</p>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
