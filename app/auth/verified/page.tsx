'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function EmailVerifiedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/app/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <AuthLayout
      title="Email verified"
      subtitle="Your account is now active"
    >
      <div className="space-y-8 text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 15,
            delay: 0.1 
          }}
          className="relative mx-auto w-24 h-24"
        >
          {/* Outer glow ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-emerald/20 blur-xl"
          />
          
          {/* Main circle */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald/20 to-gold/20 border border-emerald/30 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              <CheckCircle className="w-12 h-12 text-emerald" />
            </motion.div>
          </div>
          
          {/* Sparkle decorations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-gold" />
          </motion.div>
        </motion.div>

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-xl font-semibold text-ivory">
            Welcome to Renewly
          </h2>
          <p className="text-platinum max-w-sm mx-auto">
            Your email has been verified successfully. You now have full access to your subscription intelligence dashboard.
          </p>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <Link href="/app/dashboard">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(199, 163, 106, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          
          <p className="text-sm text-platinum">
            Redirecting automatically in{' '}
            <span className="text-gold font-medium">{countdown}s</span>
          </p>
        </motion.div>

        {/* Trust indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-6 border-t border-glass-border"
        >
          <p className="text-xs text-platinum/60">
            Your data is protected with enterprise-grade security
          </p>
        </motion.div>
      </div>
    </AuthLayout>
  )
}
