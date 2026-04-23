'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, LogIn, UserPlus } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'

function ConfirmationErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('error') || 'unknown'

  const errorMessages: Record<string, { title: string; description: string }> = {
    expired: {
      title: 'Link expired',
      description:
        'This verification link has expired. Sign in if your email is already verified, or create your account again to receive a new verification email.',
    },
    invalid: {
      title: 'Invalid link',
      description:
        'This verification link may already have been opened, or it may no longer be valid. Try signing in first. If you still cannot access your account, create your account again.',
    },
    unknown: {
      title: 'Verification failed',
      description:
        'We could not verify your email from this link. Try signing in first, or create your account again.',
    },
  }

  const error = errorMessages[errorType] || errorMessages.unknown

  return (
    <AuthLayout title={error.title} subtitle="Email verification">
      <div className="space-y-6">
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

        <div className="space-y-3">
          <Link href="/auth/sign-in">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              Go to sign in
            </motion.button>
          </Link>

          <Link href="/auth/sign-up">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full h-12 rounded-xl border border-glass-border text-platinum hover:text-ivory transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              Create account again
            </motion.button>
          </Link>
        </div>

        <div className="pt-6 border-t border-glass-border text-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="inline-flex items-center gap-2 text-platinum hover:text-ivory transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
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