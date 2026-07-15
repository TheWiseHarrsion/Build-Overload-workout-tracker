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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1">
        {backHref && (
          <Link href={backHref} className="flex items-center gap-1 text-[#06b6d4] mb-2 hover:underline text-sm">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        )}
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {description && <p className="text-[#a0a0a0] text-sm mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
