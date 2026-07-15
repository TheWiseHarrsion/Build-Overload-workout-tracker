import Link from 'next/link'
import { Calendar, ChevronRight, Dumbbell, Flame, Play, TrendingUp, Zap } from 'lucide-react'
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
  const weeklySessions = recentSessions.filter(
    (session) => new Date(session.completed_at || session.created_at) >= weekAgo
  )
  const weeklyCompletedSets = weeklySessions.reduce(
    (total, session) =>
      total +
      session.session_exercises.reduce(
        (exerciseTotal, exercise) =>
          exerciseTotal + exercise.exercise_sets.filter((set) => set.is_completed).length,
        0
      ),
    0
  )
  const weeklyVolume = weeklySessions.reduce(
    (total, session) =>
      total +
      session.session_exercises.reduce(
        (exerciseTotal, exercise) =>
          exerciseTotal + calculateTotalSessionVolume(exercise.exercise_sets),
        0
      ),
    0
  )
  const completedActiveSets =
    activeSession?.session_exercises.reduce(
      (total, exercise) => total + exercise.exercise_sets.filter((set) => set.is_completed).length,
      0
    ) || 0
  const totalActiveSets =
    activeSession?.session_exercises.reduce((total, exercise) => total + exercise.exercise_sets.length, 0) || 0
  const latestSession = recentSessions[0]

  return (
    <>
      <PageHeader title="Overload" description="Train with intent." />

      {activeSession && (
        <Link href={`/session/${activeSession.id}`} className="mb-6 block">
          <Card className="border-[rgba(56,189,248,0.42)] p-5">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="mb-2 text-sm font-bold text-[var(--accent)]">Active now</p>
                <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  {activeSession.name}
                </h2>
                <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
                  {formatDuration(activeSession.started_at)} elapsed
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-black">
                <Play className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{
                  width: `${totalActiveSets ? Math.round((completedActiveSets / totalActiveSets) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--text-primary)]">
                {completedActiveSets} of {totalActiveSets} sets completed
              </span>
              <span className="font-bold text-[var(--accent)]">Continue</span>
            </div>
          </Card>
        </Link>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/workouts" className="block">
          <Card className="h-full p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-muted)]">
                  <Zap className="h-5 w-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Next step</p>
                  <p className="font-bold text-[var(--text-primary)]">Start Workout</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
          </Card>
        </Link>

        <Link href="/workouts/new" className="block">
          <Card className="h-full p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]">
                  <Calendar className="h-5 w-5 text-[var(--text-primary)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Template</p>
                  <p className="font-bold text-[var(--text-primary)]">Create New</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">This Week</h2>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4" interactive={false}>
            <p className="tabular text-2xl font-black text-[var(--text-primary)]">{weekCount || 0}</p>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Workouts</p>
          </Card>
          <Card className="p-4" interactive={false}>
            <p className="tabular text-2xl font-black text-[var(--text-primary)]">{weeklyCompletedSets}</p>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Sets</p>
          </Card>
          <Card className="p-4" interactive={false}>
            <p className="tabular text-xl font-black text-[var(--text-primary)]">{formatVolume(weeklyVolume)}</p>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Volume</p>
          </Card>
        </div>
      </div>

      {latestSession ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Recent Workout</h2>
            <Link href="/progress" className="flex min-h-10 items-center gap-1 rounded-xl px-2 text-sm font-bold text-[var(--accent)]">
              <TrendingUp className="h-4 w-4" />
              Progress
            </Link>
          </div>
          <Link href={`/history/${latestSession.id}`} className="block">
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{latestSession.name}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {formatDate(latestSession.completed_at || latestSession.created_at)}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  {latestSession.session_exercises.length} exercises
                </span>
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  {formatDuration(latestSession.started_at, latestSession.completed_at || undefined)}
                </span>
                <span className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  {formatVolume(
                    latestSession.session_exercises.reduce(
                      (total, exercise) => total + calculateTotalSessionVolume(exercise.exercise_sets),
                      0
                    )
                  )}
                </span>
              </div>
            </Card>
          </Link>
          <Card className="p-5" interactive={false}>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Recent progress</p>
                <p className="text-sm text-[var(--text-secondary)]">Complete another session to build a stronger trend.</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          title="No workouts yet"
          description="Create a template, start a workout, and your history will appear here."
          icon={<Dumbbell className="h-7 w-7" />}
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
