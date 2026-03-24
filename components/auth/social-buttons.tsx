'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type Provider = 'google' | 'apple'

const socialProviders: { name: string; provider: Provider; icon: JSX.Element }[] = [
  {
    name: 'Google',
    provider: 'google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    name: 'Apple',
    provider: 'apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
      </svg>
    ),
  },
]

export function SocialButtons() {
  const [loading, setLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSocialLogin = async (provider: Provider) => {
    setLoading(provider)
    setError(null)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        // Check if it's a setup issue (provider not configured)
        if (authError.message.includes('not enabled') || authError.message.includes('not configured')) {
          setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-in is not yet configured. Please use email/password.`)
        } else {
          setError(authError.message)
        }
        setLoading(null)
      }
      // On success, the user will be redirected to the OAuth provider
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {socialProviders.map((provider) => (
          <motion.button
            key={provider.name}
            type="button"
            disabled={loading !== null}
            onClick={() => handleSocialLogin(provider.provider)}
            whileHover={{ scale: loading ? 1 : 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="h-12 rounded-xl border border-glass-border text-ivory flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading === provider.provider ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              provider.icon
            )}
            <span className="text-sm font-medium">{provider.name}</span>
          </motion.button>
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-crimson text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}
