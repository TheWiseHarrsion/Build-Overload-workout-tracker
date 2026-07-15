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
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4">
      <div className="card max-w-sm p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">
            <AlertCircle className="h-7 w-7" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-black text-[var(--text-primary)]">Something went wrong</h1>
        <p className="mb-6 text-sm leading-6 text-[var(--text-secondary)]">An error occurred. Please try again.</p>
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  )
}
