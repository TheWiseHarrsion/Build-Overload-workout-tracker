'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4">
      <div className="card max-w-sm p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <AlertCircle className="h-7 w-7" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-black text-[var(--text-primary)]">Page Not Found</h1>
        <p className="mb-6 text-sm leading-6 text-[var(--text-secondary)]">The page you are looking for does not exist.</p>
        <Link href="/">
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
