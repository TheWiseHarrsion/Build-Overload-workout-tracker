import { Card } from '@/components/ui/card'

export function SetupRequired() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-4 text-[var(--text-primary)]">
      <Card className="w-full max-w-md p-5" interactive={false}>
        <h1 className="text-2xl font-black">Supabase setup required</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
          then restart the dev server.
        </p>
      </Card>
    </main>
  )
}
