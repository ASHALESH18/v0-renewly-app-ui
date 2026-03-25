'use client'

import { createClient } from '@/lib/supabase/client'
import useStore from '@/lib/store'

export async function signOutAndRedirectHome() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  useStore.getState().clearUserData?.()

  if (typeof window !== 'undefined') {
    window.location.replace('/')
  }
}