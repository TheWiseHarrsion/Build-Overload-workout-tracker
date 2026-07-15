export function formatDate(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const value = typeof date === 'string' ? new Date(date) : date
  return value.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(startDate: string | Date, endDate?: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date()
  const diffMins = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000))

  if (diffMins < 60) return `${diffMins}m`

  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

export function formatWeight(weight: number): string {
  if (!weight) return '-'
  return `${weight.toFixed(1)} kg`
}

export function formatReps(reps: number): string {
  if (!reps) return '-'
  return `${reps}`
}

export function formatVolume(volume: number): string {
  if (!volume) return '-'
  return `${volume.toFixed(0)} kg`
}

export function formatWeightAndReps(weight: number, reps: number): string {
  if (!weight || !reps) return '-'
  return `${weight.toFixed(1)} kg x ${reps}`
}

export function formatEstimated1RM(value: number): string {
  if (!value) return '-'
  return `${value.toFixed(1)} kg`
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value) || value === 0) return '0%'
  return `${value.toFixed(decimals)}%`
}

export function formatChartDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
