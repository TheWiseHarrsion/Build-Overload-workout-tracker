'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkoutTemplate } from '@/lib/actions/workouts'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'

export default function NewWorkoutPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await createWorkoutTemplate(name, description)
      if (!result.success) {
        setToast({ message: result.error || 'Failed to create template.', type: 'error' })
        return
      }

      if (result.template) {
        router.push(`/workouts/${result.template.id}`)
        router.refresh()
      }
    })
  }

  return (
    <>
      <PageHeader title="Create Workout" backHref="/workouts" />

      <Card className="p-4">
        <form onSubmit={createTemplate} className="space-y-4">
          <Input
            label="Workout Name"
            placeholder="Upper Body Push"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-white" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              className="input-field resize-none"
              rows={3}
              placeholder="Optional notes for this template"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isPending}>
            Create and Add Exercises
          </Button>
        </form>
      </Card>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  )
}
