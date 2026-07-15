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
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }

  const icon = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <AlertCircle className="w-5 h-5" />,
  }

  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto ${bgColor[type]} text-white rounded-lg p-4 flex items-center gap-3 shadow-lg z-40`}>
      {icon[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
