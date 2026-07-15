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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon ? (
        <div className="mb-4 text-[#06b6d4]">{icon}</div>
      ) : (
        <AlertCircle className="mb-4 w-12 h-12 text-[#808080]" />
      )}
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      {description && <p className="text-[#a0a0a0] mb-4 max-w-xs">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
