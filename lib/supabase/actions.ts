'use server'

import { createClient } from './server'

const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  
  if (!appUrl) {
    // Development fallback - only use localhost in dev
    return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'http://localhost:3000'
  }
  
  return appUrl
}

export interface AuthResult {
  ok: boolean
  redirectTo?: string
  message?: string
  requiresEmailConfirmation?: boolean
  email?: string
}

export async function signUpWithEmail(
  email: string,
  password: string,
  next?: string
): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(next || '/app')}`,
    },
  })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  return {
    ok: true,
    requiresEmailConfirmation: true,
    email,
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
  next?: string
): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    let message = error.message
    if (error.message.includes('Email not confirmed')) {
      message = 'Please confirm your email before signing in. Check your inbox for a confirmation link.'
    } else if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password. Please try again.'
    }
    
    return {
      ok: false,
      message,
      requiresEmailConfirmation: error.message.includes('Email not confirmed'),
      email,
    }
  }

  return {
    ok: true,
    redirectTo: next && next.startsWith('/app') ? next : '/app',
  }
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getAppUrl()}/auth/reset-password`,
  })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  return {
    ok: true,
    message: 'Password reset email sent. Check your inbox.',
  }
}

export async function resendConfirmationEmail(email: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  return {
    ok: true,
    message: 'Confirmation email sent! Check your inbox.',
  }
}

export async function logoutUser(): Promise<AuthResult> {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }
  
  return {
    ok: true,
    redirectTo: '/auth/sign-in',
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return {
      ok: false,
      message: error.message,
    }
  }

  return {
    ok: true,
    redirectTo: '/app',
    message: 'Password updated successfully.',
  }
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

