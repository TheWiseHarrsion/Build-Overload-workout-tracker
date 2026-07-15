'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteWorkoutSession } from '@/lib/actions/sessions'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Toast } from '@/components/ui/toast'

interface DeleteSessionButtonProps {
  sessionId: string
  compact?: boolean
}

export function DeleteSessionButton({ sessionId, compact = false }: DeleteSessionButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function deleteSession() {
    startTransition(async () => {
      const result = await deleteWorkoutSession(sessionId)
      if (result.success) {
        router.push('/history')
        router.refresh()
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    })
  }

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-icon hover:text-red-300"
          aria-label="Delete session"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      ) : (
        <Button type="button" variant="destructive" className="w-full" onClick={() => setOpen(true)}>
          Delete Session
        </Button>
      )}

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Delete Session"
        actions={
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="flex-1" onClick={deleteSession} isLoading={isPending}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-[var(--text-secondary)]">This permanently deletes this completed workout.</p>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
