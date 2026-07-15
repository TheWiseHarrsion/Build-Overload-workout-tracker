import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { WorkoutTemplateEditor } from '@/components/workout-template-editor'
import type { Exercise } from '@/lib/types/database'
import type { WorkoutTemplateWithExercises } from '@/lib/types/app'

interface WorkoutTemplatePageProps {
  params: Promise<{ id: string }>
}

export default async function WorkoutTemplatePage({ params }: WorkoutTemplatePageProps) {
  const { id } = await params
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: template }, { data: exercises }] = await Promise.all([
    supabase
      .from('workout_templates')
      .select(
        '*,workout_template_exercises(id,workout_template_id,exercise_id,position,default_sets,created_at,exercises(id,name,muscle_group))'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('exercises').select('*').eq('user_id', user.id).order('name'),
  ])

  if (!template) notFound()

  return (
    <WorkoutTemplateEditor
      template={template as unknown as WorkoutTemplateWithExercises}
      exercises={(exercises || []) as Exercise[]}
    />
  )
}
