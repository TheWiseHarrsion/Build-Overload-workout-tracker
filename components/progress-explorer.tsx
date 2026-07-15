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
  maxWeight: 'Maximum Weight',
  bestReps: 'Best Repetitions',
  bestSetVolume: 'Best Set Volume',
  totalVolume: 'Total Session Volume',
  estimated1RM: 'Estimated 1RM',
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
      <div>
        <label className="mb-2 block text-sm font-medium text-white" htmlFor="exercise">
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
        <p className="mb-2 text-sm font-medium text-white">Metric</p>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(metricLabels) as Metric[]).map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setMetric(key)}
              className={`min-h-11 rounded-xl px-3 py-2 text-xs font-medium ${
                metric === key ? 'bg-[#06b6d4] text-black' : 'bg-[#1a1a1a] text-[#a0a0a0]'
              }`}
            >
              {metricLabels[key]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-white">Range</p>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(rangeLabels) as Range[]).map((key) => (
            <button
              type="button"
              key={key}
              onClick={() => setRange(key)}
              className={`min-h-11 rounded-xl px-2 py-2 text-xs font-medium ${
                range === key ? 'bg-[#06b6d4] text-black' : 'bg-[#1a1a1a] text-[#a0a0a0]'
              }`}
            >
              {rangeLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <Card className="p-4">
          <div className="mb-3">
            <h2 className="font-semibold text-white">{metricLabels[metric]}</h2>
            <p className="text-sm text-[#a0a0a0]">
              {chartData.length} completed session{chartData.length === 1 ? '' : 's'} with this exercise.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" />
                <XAxis dataKey="date" stroke="#808080" tick={{ fontSize: 12 }} />
                <YAxis stroke="#808080" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                  formatter={(value) => formatMetric(metric, Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center text-sm text-[#a0a0a0]">
          Complete this exercise in at least one workout to see progress.
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Current Best</p>
            <p className="text-xl font-bold text-white">{formatMetric(metric, stats.current)}</p>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Previous Best</p>
            <p className="text-xl font-bold text-white">{formatMetric(metric, stats.previous)}</p>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Change</p>
            <p className={`text-xl font-bold ${stats.percentChange >= 0 ? 'text-[#10b981]' : 'text-red-400'}`}>
              {stats.percentChange > 0 ? '+' : ''}
              {formatPercentage(stats.percentChange)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Personal Record</p>
            <p className="text-xl font-bold text-white">
              {formatMetric(metric, stats.personalRecord)}
            </p>
          </Card>
          <Card className="col-span-2 p-4">
            <p className="mb-2 text-xs text-[#a0a0a0]">Sessions</p>
            <p className="text-xl font-bold text-white">{stats.sessions}</p>
          </Card>
        </div>
      )}
    </div>
  )
}
