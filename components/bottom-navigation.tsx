'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, History, House, TrendingUp } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: House },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/history', label: 'History', icon: History },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-color)] bg-[rgba(17,17,20,0.72)]"
      style={{
        backdropFilter: 'blur(24px) saturate(1.35)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.35)',
      }}
    >
      <div
        className="bottom-nav-row mx-auto w-full max-w-2xl px-3 pt-2"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.25rem',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item flex min-h-14 flex-1 basis-0 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition ${
                isActive
                  ? 'bg-[var(--accent-muted)] text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]'
              }`}
              style={{
                flex: '1 1 0',
                minWidth: 0,
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="mb-1 h-5 w-5" />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
