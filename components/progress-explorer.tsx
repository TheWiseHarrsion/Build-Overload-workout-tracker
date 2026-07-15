'use client'

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import {
  calculateBestReps,
  calculateBestEstimated1RM,
  calculateBestSetVolume,
  calculateMaxWeight,
  calculatePercentageChange,
  calculateTotalSessionVolume,
} from '@/lib/calculations/progress'
import {
  formatChartDate,
  formatEstimated1RM,
  formatPercentage,
  formatReps,
  formatVolume,
  formatWeight,
} from '@/lib/formatting/dates'
import type { Exercise } from '@/lib/types/database'
import type { ProgressDataPoint, WorkoutSessionWithDetails } from '@/lib/types/app'

type Metric = 'maxWeight' | 'bestReps' | 'bestSetVolume' | 'totalVolume' | 'estimated1RM'
type Range = '1m' | '3m' | '6m' | '1y' | 'all'

interface ProgressExplorerProps {
  exercises: Exercise[]
  sessions: WorkoutSessionWithDetails[]
}

const metricLabels: Record<Metric, string> = {
  maxWeight: 'Max Weight',
  bestReps: 'Best Reps',
  bestSetVolume: 'Set Volume',
  totalVolume: 'Total Volume',
  estimated1RM: 'Est. 1RM',
}

const rangeLabels: Record<Range, string> = {
  '1m': '1M',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  all: 'All',
}

const rangeDays: Record<Range, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  all: Number.POSITIVE_INFINITY,
}

function formatMetric(metric: Metric, value: number) {
  if (metric === 'bestReps') return formatReps(value)
  if (metric === 'totalVolume' || metric === 'bestSetVolume') return formatVolume(value)
  if (metric === 'estimated1RM') return formatEstimated1RM(value)
  return formatWeight(value)
}

export function ProgressExplorer({ exercises, sessions }: ProgressExplorerProps) {
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id || '')
  const [metric, setMetric] = useState<Metric>('maxWeight')
  const [range, setRange] = useState<Range>('6m')
  const [now] = useState(() => Date.now())
  const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId)

  const chartData = useMemo(() => {
    const cutoff =
      range === 'all' ? 0 : now - rangeDays[range] * 24 * 60 * 60 * 1000

    return sessions
      .filter((session) => session.completed_at && new Date(session.completed_at).getTime() >= cutoff)
      .map((session) => {
        const sessionExercise = session.session_exercises.find(
          (exercise) => exercise.exercise_id === exerciseId
        )
        if (!sessionExercise || !session.completed_at) return null

        const completedSets = sessionExercise.exercise_sets.filter((set) => set.is_completed)
        if (completedSets.length === 0) return null

        return {
          date: formatChartDate(session.completed_at),
          timestamp: new Date(session.completed_at).getTime(),
          maxWeight: calculateMaxWeight(completedSets),
          bestReps: calculateBestReps(completedSets),
          bestSetVolume: calculateBestSetVolume(completedSets),
          totalVolume: calculateTotalSessionVolume(completedSets),
          estimated1RM: calculateBestEstimated1RM(completedSets),
        } satisfies ProgressDataPoint
      })
      .filter((point): point is ProgressDataPoint => Boolean(point))
  }, [exerciseId, now, range, sessions])

  const stats = useMemo(() => {
    if (chartData.length === 0) return null
    const latest = chartData[chartData.length - 1]
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null
    const currentValue = latest[metric]
    const previousValue = previous?.[metric] || 0

    return {
      current: currentValue,
      previous: previousValue,
      percentChange: calculatePercentageChange(currentValue, previousValue || null),
      personalRecord: Math.max(...chartData.map((point) => point[metric])),
      sessions: chartData.length,
    }
  }, [chartData, metric])

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4" interactive={false}>
        <div>
          <label className="mb-2 block text-sm font-bold text-[var(--text-primary)]" htmlFor="exercise">
            Exercise
          </label>
          <select
            id="exercise"
            className="input-field"
            value={exerciseId}
            onChange={(event) => setExerciseId(event.target.value)}
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-[var(--text-primary)]">Metric</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(metricLabels) as Metric[]).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setMetric(key)}
                className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold ${
                  metric === key ? 'bg-[var(--accent)] text-black' : 'bg-white/[0.05] text-[var(--text-secondary)]'
                }`}
              >
                {metricLabels[key]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-[var(--text-primary)]">Range</p>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(rangeLabels) as Range[]).map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => setRange(key)}
                className={`min-h-11 rounded-xl px-2 py-2 text-sm font-bold ${
                  range === key ? 'bg-[var(--accent)] text-black' : 'bg-white/[0.05] text-[var(--text-secondary)]'
                }`}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {chartData.length > 0 ? (
        <Card className="p-4" interactive={false}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">{selectedExercise?.name || 'Exercise'}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{metricLabels[metric]}</p>
            </div>
            {stats && (
              <div className="text-right">
                <p className="tabular text-xl font-black text-[var(--text-primary)]">{formatMetric(metric, stats.current)}</p>
                <p className={`tabular text-sm font-bold ${stats.percentChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                  {stats.percentChange > 0 ? '+' : ''}
                  {formatPercentage(stats.percentChange)}
                </p>
              </div>
            )}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" stroke="#71717A" tick={{ fontSize: 12, fill: '#A1A1AA' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717A" tick={{ fontSize: 12, fill: '#A1A1AA' }} tickLine={false} axisLine={false} width={42} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151519',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    color: '#fafafa',
                  }}
                  labelStyle={{ color: '#A1A1AA' }}
                  formatter={(value) => formatMetric(metric, Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{ fill: '#38BDF8', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center" interactive={false}>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Complete this exercise in at least one workout to see progress.
          </p>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4" interactive={false}>
            <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Current Best</p>
            <p className="tabular text-xl font-black text-[var(--text-primary)]">{formatMetric(metric, stats.current)}</p>
          </Card>
          <Card className="p-4" interactive={false}>
            <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Previous Best</p>
            <p className="tabular text-xl font-black text-[var(--text-primary)]">{formatMetric(metric, stats.previous)}</p>
          </Card>
          <Card className="p-4" interactive={false}>
            <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Personal Record</p>
            <p className="tabular text-xl font-black text-[var(--text-primary)]">
              {formatMetric(metric, stats.personalRecord)}
            </p>
          </Card>
          <Card className="p-4" interactive={false}>
            <p className="mb-2 text-xs font-bold text-[var(--text-secondary)]">Sessions</p>
            <p className="tabular text-xl font-black text-[var(--text-primary)]">{stats.sessions}</p>
          </Card>
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="p-4" interactive={false}>
          <h2 className="mb-3 text-base font-bold text-[var(--text-primary)]">Progression History</h2>
          <div className="space-y-2">
            {chartData.slice().reverse().map((point) => (
              <div key={`${point.timestamp}-${point[metric]}`} className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{point.date}</span>
                <span className="tabular text-sm font-black text-[var(--text-primary)]">{formatMetric(metric, point[metric])}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
