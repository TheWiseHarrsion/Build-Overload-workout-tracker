'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BottomNavigation } from './bottom-navigation'
import { OfflineIndicator } from './offline-indicator'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const showBottomNavigation = !pathname.startsWith('/session/')

  return (
    <div className="flex h-dvh flex-col bg-[var(--background)]">
      <OfflineIndicator />
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-[var(--background)]" />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto w-full max-w-2xl px-4 pt-3 ${showBottomNavigation ? 'pb-28' : 'pb-0'}`}>
          {children}
        </div>
      </main>
      {showBottomNavigation && <BottomNavigation />}
    </div>
  )
}
