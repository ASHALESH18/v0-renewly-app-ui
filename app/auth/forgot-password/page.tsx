'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { createClient } from '@/lib/supabase/client'
import { getURL } from '@/lib/supabase/url'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Build the redirect URL with type=recovery parameter
      // Supabase will append its own parameters (code, etc.) to this URL
      const redirectUrl = new URL(getURL('auth/callback'))
      redirectUrl.searchParams.set('type', 'recovery')
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl.toString(),
      })

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email')
        return
      }

      // Success - show submitted state
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
    } finally {
      // Always stop loading regardless of outcome
      setIsLoading(false)
    }
  }

  // Success state - email sent
  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent a password reset link"
      >
        <div className="text-center py-4 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto"
          >
            <Mail className="w-8 h-8 text-gold" />
          </motion.div>

          <div className="space-y-2">
            <p className="text-ivory text-lg font-semibold">
              Check your inbox
            </p>
            <p className="text-sm text-platinum">
              If an account exists for <span className="text-gold">{email}</span>, you&apos;ll receive a password reset link shortly.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setIsSubmitted(false)
                setEmail('')
              }}
              className="w-full h-12 rounded-xl border border-gold/30 text-gold font-medium hover:bg-gold/10 transition-colors"
            >
              Try a different email
            </button>
            
            <Link href="/auth/sign-in">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury"
              >
                Back to sign in
              </motion.button>
            </Link>
          </div>

          {/* Sign up prompt */}
          <div className="pt-4 border-t border-glass-border">
            <p className="text-sm text-center text-platinum">
              Don&apos;t have an account?{' '}
              <Link href="/auth/sign-up" className="text-gold hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ivory mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading || !email}
          whileHover={{ scale: !isLoading ? 1.01 : 1 }}
          whileTap={{ scale: !isLoading ? 0.99 : 1 }}
          className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full"
            />
          ) : (
            'Send reset link'
          )}
        </motion.button>

        {/* Back to sign in */}
        <Link 
          href="/auth/sign-in"
          className="flex items-center justify-center gap-2 text-sm text-platinum hover:text-ivory transition-colors pt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        {/* Sign up prompt */}
        <div className="pt-4 border-t border-glass-border mt-4">
          <p className="text-sm text-center text-platinum">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-gold hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
