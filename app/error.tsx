'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-[#a0a0a0] mb-6">An error occurred. Please try again.</p>
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
