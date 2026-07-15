'use server'

import { createServerClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function signUp(email: string, password: string, confirmPassword: string) {
  try {
    signupSchema.parse({ email, password, confirmPassword })
    
    const supabase = await createServerClient()
    const headerStore = await headers()
    const origin = headerStore.get('origin') || 'http://localhost:3000'
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    
    if (error) throw error
    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Sign up failed' }
  }
}

export async function signIn(email: string, password: string) {
  try {
    loginSchema.parse({ email, password })
    
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    revalidatePath('/', 'layout')
    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Validation failed' }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Sign in failed' }
  }
}

export async function signOut() {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Sign out failed' }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    return user
  } catch {
    return null
  }
}
