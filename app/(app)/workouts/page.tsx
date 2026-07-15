import Link from 'next/link'
import { ChevronRight, Dumbbell, Edit2, Plus } from 'lucide-react'
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
        description="Choose a template and get moving."
        action={
          <Link href="/workouts/new">
            <Button variant="icon" aria-label="Create workout">
              <Plus className="h-5 w-5" />
            </Button>
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
              <Card key={template.id} className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[var(--text-primary)]">
                      {template.name}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                      {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
                      {template.description ? ` - ${template.description}` : ''}
                    </p>
                  </div>
                  <Link href={`/workouts/${template.id}`} className="btn-icon" aria-label={`Edit ${template.name}`}>
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </div>

                {exercises.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {exercises.slice(0, 4).map((templateExercise) => (
                      <span
                        key={templateExercise.id}
                        className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                      >
                        {templateExercise.exercises?.name || 'Exercise'}
                      </span>
                    ))}
                    {exercises.length > 4 && (
                      <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                        +{exercises.length - 4} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mb-4 rounded-xl border border-[var(--border-color)] bg-white/[0.03] p-3 text-sm text-[var(--text-secondary)]">
                    No exercises added yet.
                  </p>
                )}

                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <StartWorkoutButton templateId={template.id} className="w-full" />
                  <Link href={`/workouts/${template.id}`} className="btn-secondary px-3" aria-label={`Open ${template.name}`}>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No workouts yet"
          description="Create your first template with exercises and default sets."
          icon={<Dumbbell className="h-7 w-7" />}
          action={
            <Link href="/workouts/new">
              <Button variant="primary">Create Workout</Button>
            </Link>
          }
        />
      )}
    </>
  )
}
