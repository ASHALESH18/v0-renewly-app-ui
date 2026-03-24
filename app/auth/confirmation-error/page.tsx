'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, RefreshCw, ArrowLeft, Mail } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { createClient } from '@/lib/supabase/client'

function ConfirmationErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('error') || 'unknown'
  const email = searchParams.get('email') || ''
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendEmail, setResendEmail] = useState(email)

  const errorMessages: Record<string, { title: string; description: string }> = {
    expired: {
      title: 'Link expired',
      description: 'This verification link has expired. Please request a new one below.',
    },
    invalid: {
      title: 'Invalid link',
      description: 'This verification link is invalid or has already been used.',
    },
    unknown: {
      title: 'Verification failed',
      description: 'We could not verify your email. Please try again or request a new link.',
    },
  }

  const error = errorMessages[errorType] || errorMessages.unknown

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resendEmail) return

    setIsResending(true)
    setResendError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      })

      if (error) {
        setResendError(error.message)
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setResendError('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (resendSuccess) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="New verification link sent"
      >
        <div className="space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-gold/20 rounded-full flex items-center justify-center"
          >
            <Mail className="w-8 h-8 text-gold" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-ivory">
              A new verification link has been sent to{' '}
              <span className="font-semibold text-gold">{resendEmail}</span>
            </p>
            <p className="text-sm text-platinum">
              Please check your inbox and click the link to verify your account.
            </p>
          </div>

          <div className="pt-6 border-t border-glass-border">
            <Link href="/auth/sign-in">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="inline-flex items-center gap-2 text-gold hover:text-gold/80 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
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
      title={error.title}
      subtitle="Email verification"
    >
      <div className="space-y-6">
        {/* Error icon and message */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
          </motion.div>
          
          <p className="text-platinum max-w-sm mx-auto">
            {error.description}
          </p>
        </div>

        {/* Resend form */}
        <form onSubmit={handleResendVerification} className="space-y-4">
          <div>
            <label htmlFor="resend-email" className="block text-sm font-medium text-ivory mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum" />
              <input
                id="resend-email"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isResending}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {resendError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm text-red-300">{resendError}</p>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isResending || !resendEmail}
            whileHover={{ scale: !isResending ? 1.01 : 1 }}
            whileTap={{ scale: !isResending ? 0.99 : 1 }}
            className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Resend verification email
              </>
            )}
          </motion.button>
        </form>

        {/* Back to sign in */}
        <div className="pt-6 border-t border-glass-border text-center">
          <Link href="/auth/sign-in">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="inline-flex items-center gap-2 text-platinum hover:text-ivory transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </motion.button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function ConfirmationErrorPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationErrorContent />
    </Suspense>
  )
}
