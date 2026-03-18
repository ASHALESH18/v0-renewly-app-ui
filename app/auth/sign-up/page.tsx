'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { SocialButtons } from '@/components/auth/social-buttons'
import { createClient } from '@/lib/supabase/client'
import { getURL } from '@/lib/supabase/url'

function SignUpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/app'

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [confirmedEmail, setConfirmedEmail] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })

  // Validate password strength
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'No password', color: 'bg-muted' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
    return { score, label: 'Strong', color: 'bg-emerald-500' }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please use a stronger password.')
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
          emailRedirectTo: getURL('auth/callback?next=/app'),
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
        setIsLoading(false)
        return
      }

      // Check if we need email confirmation or if we got a session immediately
      if (data.user && !data.session) {
        // Email confirmation is required
        setConfirmationSent(true)
        setConfirmedEmail(formData.email)
        // Auto-redirect after showing confirmation
        setTimeout(() => router.push(next), 2000)
      } else if (data.session) {
        // Session created immediately - go to app
        router.replace('/app')
        router.refresh()
      }
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
          {/* Password strength indicator */}
          {formData.password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-platinum whitespace-nowrap">{passwordStrength.label}</span>
              </div>
              <ul className="text-xs text-platinum space-y-1">
                <li className={formData.password.length >= 8 ? 'text-emerald' : ''}>
                  {formData.password.length >= 8 ? '✓' : '•'} At least 8 characters
                </li>
                <li className={/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-emerald' : ''}>
                  {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? '✓' : '•'} Uppercase and lowercase letters
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-emerald' : ''}>
                  {/[0-9]/.test(formData.password) ? '✓' : '•'} At least one number
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-ivory mb-2">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-platinum" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value })
                setError(null)
              }}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
              className="w-full h-12 pl-12 pr-12 rounded-xl bg-slate border border-glass-border text-ivory placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-platinum hover:text-ivory transition-colors disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
          )}
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p className="mt-2 text-xs text-emerald">Passwords match</p>
          )}
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
          disabled={isLoading || !formData.email || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword || !formData.agreeToTerms || passwordStrength.score < 2}
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

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpPageContent />
    </Suspense>
  )
}
