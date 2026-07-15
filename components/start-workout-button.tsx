'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Play } from 'lucide-react'
import { startWorkoutSession } from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Toast } from '@/components/ui/toast'

interface StartWorkoutButtonProps {
  templateId: string
  className?: string
}

export function StartWorkoutButton({ templateId, className }: StartWorkoutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function start(discardActive = false) {
    startTransition(async () => {
      const result = await startWorkoutSession(templateId, discardActive)
      if (result.success) {
        router.push(`/session/${result.sessionId}`)
        router.refresh()
        return
      }

      if (result.sessionId) {
        setActiveSessionId(result.sessionId)
        return
      }

      setToast({ message: result.error, type: 'error' })
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className={`flex items-center justify-center gap-2 ${className || ''}`}
        onClick={() => start(false)}
        isLoading={isPending}
      >
        <Play className="h-4 w-4" />
        Start
      </Button>

      <Dialog
        isOpen={Boolean(activeSessionId)}
        onClose={() => setActiveSessionId(null)}
        title="Active Workout"
        actions={
          <div className="flex w-full gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => activeSessionId && router.push(`/session/${activeSessionId}`)}
            >
              Continue
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={() => start(true)}
              isLoading={isPending}
            >
              Discard
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          You already have an unfinished workout. Continue it or discard it before starting this template.
        </p>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
