'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
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
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="rounded-xl bg-[#06b6d4] p-3 text-black">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-white">Overload</h1>
          </div>
          <p className="text-[#a0a0a0]">Train. Track. Progress.</p>
        </div>

        {!configured && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-100">
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

        <p className="text-center text-sm text-[#a0a0a0]">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-medium text-[#06b6d4] hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <InstallInstructions />
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </main>
  )
}
