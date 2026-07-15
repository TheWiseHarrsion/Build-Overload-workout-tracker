import React from 'react'
import { AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center px-5 py-10 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)]">{icon}</div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)]">
          <AlertCircle className="h-7 w-7" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
      {description && <p className="mb-5 max-w-xs text-sm leading-6 text-[var(--text-secondary)]">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
