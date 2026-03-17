'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, Lock, AlertCircle, Check } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to reset password')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      // Auto-redirect after showing success
      setTimeout(() => {
        router.replace('/auth/sign-in')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password reset"
        subtitle="Your password has been successfully changed"
      >
        <div className="text-center py-4 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto"
          >
            <Check className="w-8 h-8 text-gold" />
          </motion.div>

          <div className="space-y-2">
            <p className="text-ivory text-lg font-semibold">
              You're all set!
            </p>
            <p className="text-sm text-platinum">
              Your password has been reset. You can now sign in with your new password.
            </p>
          </div>

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
      title="Set your new password"
      subtitle="Create a strong password to secure your account"
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

        {/* New Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ivory mb-2">
            New Password
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
              placeholder="Create a new password"
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

        {/* Confirm Password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-ivory mb-2">
            Confirm Password
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
              placeholder="Confirm your new password"
              required
              minLength={8}
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
        </div>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading || !formData.password || !formData.confirmPassword}
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
            'Reset password'
          )}
        </motion.button>

        {/* Back to sign in */}
        <Link 
          href="/auth/sign-in"
          className="flex items-center justify-center gap-2 text-sm text-platinum hover:text-ivory transition-colors pt-4"
        >
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  )
}
