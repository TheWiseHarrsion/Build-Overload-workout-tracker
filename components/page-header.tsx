import React from 'react'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, backHref, action }: PageHeaderProps) {
  return (
    <header className="top-glass sticky top-0 z-30 -mx-4 mb-4 px-4">
      <div className="page-header-shell flex items-start justify-between gap-4">
        <div className="flex-1">
          {backHref && (
            <Link href={backHref} className="mb-3 flex min-h-10 w-fit items-center gap-1 rounded-xl pr-3 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent-muted)]">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Link>
          )}
          <h1 className="text-[2rem] font-black leading-tight tracking-tight text-[var(--text-primary)]">{title}</h1>
          {description && <p className="mt-2 text-sm font-medium leading-6 text-[var(--text-secondary)]">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0 pt-1">{action}</div>}
      </div>
      <div aria-hidden="true" className="page-header-spacer" />
    </header>
  )
}
