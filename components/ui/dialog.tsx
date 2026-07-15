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
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto safe-bottom">
        <div className="flex items-center justify-between p-4 border-b border-[#333333] sticky top-0 bg-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
        {actions && <div className="p-4 border-t border-[#333333] flex gap-3">{actions}</div>}
      </div>
    </div>
  )
}
