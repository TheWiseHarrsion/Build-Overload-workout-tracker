import { Card } from '@/components/ui/card'

export function SetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <Card className="w-full max-w-md p-5">
        <h1 className="text-2xl font-bold">Supabase setup required</h1>
        <p className="mt-2 text-sm text-[#a0a0a0]">
          Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`,
          then restart the dev server.
        </p>
      </Card>
    </main>
  )
}
