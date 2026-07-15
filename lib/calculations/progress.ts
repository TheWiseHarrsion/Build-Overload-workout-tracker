import { ExerciseSet } from '@/lib/types/database'

export interface ProgressDataPoint {
  date: string
  timestamp?: number
  weight?: number
  reps?: number
  volume?: number
  estimated1RM?: number
  maxWeight?: number
  bestReps?: number
  totalVolume?: number
}

export interface PersonalRecord {
  metric: string
  value: number
  date: string
}

export function calculateSetVolume(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * reps
}

export function calculateMaxWeight(sets: ExerciseSet[]): number {
  const completed = sets.filter(s => s.is_completed)
  if (completed.length === 0) return 0
  return Math.max(...completed.map(s => s.weight))
}

export function calculateBestReps(sets: ExerciseSet[]): number {
  const completed = sets.filter(s => s.is_completed)
  if (completed.length === 0) return 0
  return Math.max(...completed.map(s => s.reps))
}

export function calculateTotalSessionVolume(sets: ExerciseSet[]): number {
  return sets
    .filter(s => s.is_completed)
    .reduce((sum, s) => sum + calculateSetVolume(s.weight, s.reps), 0)
}

export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

export function calculateBestEstimated1RM(sets: ExerciseSet[]): number {
  const completed = sets.filter(s => s.is_completed)
  if (completed.length === 0) return 0
  
  const oneRMs = completed.map(s => calculateEstimated1RM(s.weight, s.reps))
  return Math.max(...oneRMs)
}

export function calculateBestSetVolume(sets: ExerciseSet[]): number {
  const completed = sets.filter((set) => set.is_completed)
  if (completed.length === 0) return 0
  return Math.max(...completed.map((set) => calculateSetVolume(set.weight, set.reps)))
}

export function calculatePercentageChange(current: number, previous: number | null): number {
  if (!previous || previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}

export function isPersonalRecord(
  currentValue: number,
  previousMax: number | null
): boolean {
  if (!previousMax) return true
  return currentValue > previousMax
}

export interface SessionExerciseStats {
  maxWeight: number
  bestReps: number
  bestSetVolume: number
  totalVolume: number
  bestEstimated1RM: number
}

export function calculateSessionExerciseStats(sets: ExerciseSet[]): SessionExerciseStats {
  return {
    maxWeight: calculateMaxWeight(sets),
    bestReps: calculateBestReps(sets),
    bestSetVolume: calculateBestSetVolume(sets),
    totalVolume: calculateTotalSessionVolume(sets),
    bestEstimated1RM: calculateBestEstimated1RM(sets),
  }
}
