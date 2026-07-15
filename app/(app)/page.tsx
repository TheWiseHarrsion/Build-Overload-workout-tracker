import Link from 'next/link'
import { Calendar, Play, TrendingUp, Zap } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatDuration, formatVolume } from '@/lib/formatting/dates'
import { calculateTotalSessionVolume } from '@/lib/calculations/progress'
import type { WorkoutSessionWithDetails } from '@/lib/types/app'

export default async function HomePage() {
  const supabase = await createServerClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: activeData }, { data: recentData }, { count: weekCount }] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select(
        '*,session_exercises(id,workout_session_id,exercise_id,position,created_at,exercises(id,name,muscle_group),exercise_sets(*))'
      )
      .eq('user_id', user.id)
      .is('completed_at', null)
      .limit(1),
    supabase
      .from('workout_sessions')
      .select(
        '*,session_exercises(id,workout_session_id,exercise_id,position,created_at,exercises(id,name,muscle_group),exercise_sets(*))'
      )
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(3),
    supabase
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .gte('completed_at', weekAgo.toISOString()),
  ])

  const activeSession = ((activeData || []) as unknown as WorkoutSessionWithDetails[])[0]
  const recentSessions = (recentData || []) as unknown as WorkoutSessionWithDetails[]

  return (
    <>
      <PageHeader title="Overload" description="Train. Track. Progress." />

      {activeSession && (
        <Link href={`/session/${activeSession.id}`} className="mb-6 block">
          <Card className="border-[#06b6d4] p-4">
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-lg font-semibold text-white">{activeSession.name}</h2>
              <span className="rounded bg-[#06b6d4] px-2 py-1 text-xs font-semibold text-black">
                Active
              </span>
            </div>
            <p className="text-sm text-[#a0a0a0]">
              {formatDuration(activeSession.started_at)} elapsed · {activeSession.session_exercises.length} exercises
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-[#808080]">
              <span>Tap to continue</span>
              <Play className="h-4 w-4 text-[#06b6d4]" />
            </div>
          </Card>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link href="/workouts" className="block">
          <Card className="h-full p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#06b6d4]/10 p-2">
                <Zap className="h-5 w-5 text-[#06b6d4]" />
              </div>
              <div>
                <p className="text-xs text-[#a0a0a0]">Start Workout</p>
                <p className="text-sm font-semibold text-white">Choose Template</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/workouts/new" className="block">
          <Card className="h-full p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#10b981]/10 p-2">
                <Calendar className="h-5 w-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-xs text-[#a0a0a0]">Create</p>
                <p className="text-sm font-semibold text-white">New Template</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-white">This Week</h2>
        <Card className="p-4">
          <p className="text-3xl font-bold text-white">{weekCount || 0}</p>
          <p className="text-sm text-[#a0a0a0]">completed workouts in the last 7 days</p>
        </Card>
      </div>

      {recentSessions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Workouts</h2>
            <Link href="/progress" className="flex items-center gap-1 text-sm text-[#06b6d4]">
              <TrendingUp className="h-4 w-4" />
              Progress
            </Link>
          </div>
          {recentSessions.map((session) => {
            const totalVolume = session.session_exercises.reduce(
              (total, exercise) => total + calculateTotalSessionVolume(exercise.exercise_sets),
              0
            )

            return (
              <Link key={session.id} href={`/history/${session.id}`} className="block">
                <Card className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-white">{session.name}</h3>
                    <span className="text-xs text-[#a0a0a0]">
                      {formatDate(session.completed_at || session.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#a0a0a0]">
                    {session.session_exercises.length} exercises ·{' '}
                    {formatDuration(session.started_at, session.completed_at || undefined)} ·{' '}
                    {formatVolume(totalVolume)}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No workouts yet"
          description="Create a template, start a workout, and your history will appear here."
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
