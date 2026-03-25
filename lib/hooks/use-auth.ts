'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    // Set up auth state listener FIRST - this runs immediately on mount
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setError(null)
        setLoading(false)
      }
    })

    // Then fetch current user - this will trigger onAuthStateChange if needed
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) throw error

        if (mounted) {
          // Only update if we don't have a user from the listener yet
          if (!user) {
            setUser(null)
          }
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to get user'))
          if (!user) {
            setUser(null)
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return { user, loading, error, isAuthenticated: !!user }
}
