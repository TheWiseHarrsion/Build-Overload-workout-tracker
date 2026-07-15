'use client'

import { ReactNode } from 'react'
import { BottomNavigation } from './bottom-navigation'
import { OfflineIndicator } from './offline-indicator'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-black">
      <OfflineIndicator />
      <main className="flex-1 overflow-y-auto pb-24 pt-4 md:max-w-2xl md:mx-auto md:w-full">
        <div className="px-4">
          {children}
        </div>
      </main>
      <BottomNavigation />
    </div>
  )
}
