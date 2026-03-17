'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { resetPassword } from '@/lib/supabase/actions'

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
      await resetPassword(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a password reset link to your email"
      >
        <div className="text-center py-4 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto"
          >
            <CheckCircle className="w-8 h-8 text-gold" />
          </motion.div>
          
          <p className="text-platinum">
            {"We've sent a password reset link to "}
            <span className="text-ivory font-medium">{email}</span>
          </p>

          <p className="text-sm text-platinum">
            {"Follow the link in your email to reset your password. "}
            <br />
            {"It expires in 24 hours."}
          </p>

          <div className="pt-4 border-t border-glass-border space-y-4">
            <p className="text-sm text-platinum">
              {"Didn't receive the email? Check your spam folder or "}
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-gold hover:text-gold/80 font-medium"
              >
                try again
              </button>
            </p>

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
      </form>
    </AuthLayout>
  )
}

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a password reset link to your email"
      >
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-8 h-8 text-emerald" />
          </motion.div>
          
          <p className="text-platinum mb-6">
            {"We've sent a password reset link to "}
            <span className="text-ivory font-medium">{email}</span>
          </p>

          <p className="text-sm text-platinum mb-8">
            {"Didn't receive the email? Check your spam folder or "}
            <button 
              onClick={() => setIsSubmitted(false)}
              className="text-gold hover:text-gold/80"
            >
              try again
            </button>
          </p>

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
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all"
            />
          </div>
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-obsidian/30 border-t-obsidian rounded-full"
            />
          ) : (
            'Reset password'
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
      </form>
    </AuthLayout>
  )
}
