'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Smartphone, Zap } from 'lucide-react'
import { signIn, signUp } from '@/lib/actions/auth'
import { isSupabaseConfigured } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { InstallInstructions } from '@/components/install-instructions'

export default function AuthPage() {
  const router = useRouter()
  const configured = isSupabaseConfigured()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const result =
        mode === 'login'
          ? await signIn(email, password)
          : await signUp(email, password, confirmPassword)

      if (result.success) {
        setToast({
          message: mode === 'login' ? 'Signed in' : 'Check your email to confirm your account.',
          type: 'success',
        })
        if (mode === 'login') router.push('/')
      } else {
        setToast({ message: result.error || 'Authentication failed.', type: 'error' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="safe-top flex min-h-dvh items-center justify-center overflow-x-hidden bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-[360px] space-y-5 sm:max-w-md">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--accent)] text-black shadow-[0_20px_60px_rgba(56,189,248,0.16)]">
            <Zap className="h-7 w-7" />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-[var(--accent)]">Progressive overload</p>
            <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Overload</h1>
            <p className="mx-auto mt-3 max-w-[20rem] text-sm font-medium leading-6 text-[var(--text-secondary)]">
              A focused training log for weights, reps, volume and real progression.
            </p>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">Sync your workouts securely.</p>
            </div>
          </div>

          {!configured && (
            <div className="mb-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
              Supabase environment variables are missing. Add them to `.env.local` before signing in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {mode === 'signup' && (
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            )}

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading} disabled={!configured}>
              {mode === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="min-h-11 font-bold text-[var(--accent)]"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Install on iPhone</h2>
          </div>
          <InstallInstructions />
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </main>
  )
}
