'use server'

import { createClient } from './server'
import { redirect } from 'next/navigation'

const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
}

export async function signUpWithEmail(
  email: string,
  password: string,
  next?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next || '/app')}`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  // If email confirmation is disabled, we'll redirect after user confirms in callback
  // If enabled, we'll show a confirmation screen
}

export async function signInWithEmail(email: string, password: string, next?: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Provide helpful error messages for common cases
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please confirm your email before signing in. Check your inbox for a confirmation link.')
    }
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please try again.')
    }
    throw new Error(error.message)
  }

  redirect(next && next.startsWith('/app') ? next : '/app')
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/reset-password`,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
  
  redirect('/auth/sign-in')
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new Error(error.message)
  }

  redirect('/app')
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }

  redirect('/auth/sign-in')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error(error.message)
  }

  return user
}
