import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-100',
    error: 'border-red-400/25 bg-red-500/15 text-red-100',
    info: 'border-sky-400/25 bg-sky-500/15 text-sky-100',
  }

  const icon = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  }

  return (
    <div className={`safe-bottom fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.38)] backdrop-blur sm:left-auto sm:right-4 sm:bottom-4 ${bgColor[type]}`}>
      {icon[type]}
      <span className="flex-1 text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-white/10" aria-label="Dismiss message">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
