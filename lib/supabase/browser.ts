import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/types/database'

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key'

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )
}
