'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SocialButtons } from '@/components/auth/social-buttons'
import { signUpWithEmail } from '@/lib/supabase/actions'

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/app'

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    agreeToTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      await signUpWithEmail(formData.email, formData.password, next)
      // If we get here, email confirmation is disabled - redirect to app
      setConfirmationSent(true)
      setConfirmedEmail(formData.email)
      // Auto-redirect after showing confirmation
      setTimeout(() => router.push(next), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
      setIsLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="We've sent you a confirmation link"
      >
        <div className="space-y-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto bg-gold/20 rounded-full flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-gold" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-ivory">
              Confirmation link sent to{' '}
              <span className="font-semibold text-gold">{confirmedEmail}</span>
            </p>
            <p className="text-sm text-platinum">
              Click the link in your email to verify your account and start using Renewly.
            </p>
          </div>

          <div className="pt-6 border-t border-glass-border">
            <p className="text-sm text-platinum mb-4">
              Didn't receive an email? Check your spam folder or
            </p>
            <motion.button
              type="button"
              onClick={() => {
                setConfirmationSent(false)
                setFormData({ ...formData, email: '', password: '' })
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="text-gold hover:text-gold/80 font-medium transition-colors"
            >
              try a different email
            </motion.button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start your journey to financial clarity"
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

        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ivory mb-2">
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum" />
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                setError(null)
              }}
              placeholder="Enter your name"
              disabled={isLoading}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

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
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                setError(null)
              }}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ivory mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setError(null)
              }}
              placeholder="Create a password"
              required
              minLength={8}
              disabled={isLoading}
              className="w-full h-12 pl-12 pr-12 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-platinum hover:text-ivory transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-platinum">
            Must be at least 8 characters
          </p>
        </div>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeToTerms}
            onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
            disabled={isLoading}
            className="mt-1 w-4 h-4 rounded border-glass-border bg-slate text-gold focus:ring-gold/50 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-sm text-platinum">
            I agree to the{' '}
            <Link href="#" className="text-gold hover:text-gold/80">Terms of Service</Link>
            {' '}and{' '}
            <Link href="#" className="text-gold hover:text-gold/80">Privacy Policy</Link>
          </span>
        </label>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password || !formData.agreeToTerms}
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
            'Create account'
          )}
        </motion.button>

        {/* Divider */}
        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-sm text-platinum bg-graphite">or continue with</span>
          </div>
        </div>

        {/* Social login */}
        <SocialButtons />

        {/* Sign in link */}
        <p className="text-center text-sm text-platinum pt-4">
          Already have an account?{' '}
          <Link href="/auth/sign-in" className="text-gold hover:text-gold/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
