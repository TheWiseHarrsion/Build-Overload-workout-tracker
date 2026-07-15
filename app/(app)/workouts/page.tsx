import Link from 'next/link'
import { Edit2 } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { StartWorkoutButton } from '@/components/start-workout-button'
import type { WorkoutTemplateWithExercises } from '@/lib/types/app'

export default async function WorkoutsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('workout_templates')
    .select(
      '*,workout_template_exercises(id,exercise_id,position,default_sets,created_at,exercises(id,name,muscle_group))'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const templates = (data || []) as unknown as WorkoutTemplateWithExercises[]

  return (
    <>
      <PageHeader
        title="Workouts"
        action={
          <Link href="/workouts/new">
            <Button variant="primary">New</Button>
          </Link>
        }
      />

      {templates.length > 0 ? (
        <div className="space-y-4">
          {templates.map((template) => {
            const exercises = [...template.workout_template_exercises].sort(
              (first, second) => first.position - second.position
            )

            return (
              <Card key={template.id} className="p-4">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  {template.description && (
                    <p className="mt-1 text-sm text-[#a0a0a0]">{template.description}</p>
                  )}
                </div>

                {exercises.length > 0 ? (
                  <div className="mb-4 text-sm text-[#a0a0a0]">
                    <p className="mb-2 font-medium text-white">
                      {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
                    </p>
                    <ul className="space-y-1 text-xs">
                      {exercises.slice(0, 5).map((templateExercise) => (
                        <li key={templateExercise.id} className="truncate">
                          - {templateExercise.exercises?.name || 'Exercise'} ({templateExercise.default_sets} sets)
                        </li>
                      ))}
                      {exercises.length > 5 && <li>+ {exercises.length - 5} more</li>}
                    </ul>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-[#a0a0a0]">No exercises added yet.</p>
                )}

                <div className="flex gap-2">
                  <StartWorkoutButton templateId={template.id} className="w-full flex-1" />
                  <Link href={`/workouts/${template.id}`}>
                    <button className="btn-secondary p-3" aria-label={`Edit ${template.name}`}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No workouts yet"
          description="Create your first workout template to get started."
          action={
            <Link href="/workouts/new">
              <Button variant="primary">Create Template</Button>
            </Link>
          }
        />
      )}
    </>
  )
}
