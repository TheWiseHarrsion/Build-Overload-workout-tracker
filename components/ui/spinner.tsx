import React from 'react'
import { Loader2 } from 'lucide-react'

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
    </div>
  )
}

export function Spinner({ className = 'w-4 h-4' }) {
  return <Loader2 className={`${className} animate-spin`} />
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.07] ${className}`}
      aria-hidden="true"
    />
  )
}
