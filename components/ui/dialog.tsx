import React from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, children, actions }: DialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="safe-top fixed inset-0 z-50 flex items-end justify-center bg-black/75 px-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="safe-bottom w-full max-h-[90vh] overflow-y-auto rounded-t-[22px] border border-[var(--border-color)] bg-[var(--background-elevated)] shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:max-w-md sm:rounded-[22px]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--background-elevated)] p-5">
          <h2 id="dialog-title" className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {actions && <div className="flex gap-3 border-t border-[var(--border-color)] p-5">{actions}</div>}
      </div>
    </div>
  )
}
