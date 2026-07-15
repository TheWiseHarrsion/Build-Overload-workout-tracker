import { describe, expect, it } from 'vitest'
import {
  calculateBestReps,
  calculateBestEstimated1RM,
  calculateMaxWeight,
  calculatePercentageChange,
  calculateSetVolume,
  calculateTotalSessionVolume,
} from './progress'
import type { ExerciseSet } from '@/lib/types/database'

function set(weight: number, reps: number, isCompleted = true): ExerciseSet {
  return {
    id: crypto.randomUUID(),
    session_exercise_id: crypto.randomUUID(),
    set_number: 1,
    weight,
    reps,
    is_completed: isCompleted,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  }
}

describe('progress calculations', () => {
  it('calculates set volume with decimal weights', () => {
    expect(calculateSetVolume(72.5, 8)).toBe(580)
  })

  it('calculates total session volume for completed sets only', () => {
    expect(
      calculateTotalSessionVolume([
        set(80, 8),
        set(80, 7),
        set(75, 10),
        set(200, 1, false),
      ])
    ).toBe(1950)
  })

  it('calculates maximum weight and best repetitions', () => {
    const sets = [set(80, 8), set(80, 7), set(75, 10)]
    expect(calculateMaxWeight(sets)).toBe(80)
    expect(calculateBestReps(sets)).toBe(10)
  })

  it('calculates the best estimated one-rep max with Epley formula', () => {
    expect(calculateBestEstimated1RM([set(80, 8)])).toBeCloseTo(101.333, 3)
  })

  it('handles zero and empty inputs safely', () => {
    expect(calculateSetVolume(0, 10)).toBe(0)
    expect(calculateSetVolume(80, 0)).toBe(0)
    expect(calculateMaxWeight([])).toBe(0)
    expect(calculateBestReps([])).toBe(0)
    expect(calculateBestEstimated1RM([set(0, 8), set(80, 0)])).toBe(0)
  })

  it('calculates percentage change and avoids division by zero', () => {
    expect(calculatePercentageChange(110, 100)).toBe(10)
    expect(calculatePercentageChange(90, 100)).toBe(-10)
    expect(calculatePercentageChange(100, 0)).toBe(0)
    expect(calculatePercentageChange(100, null)).toBe(0)
  })
})
