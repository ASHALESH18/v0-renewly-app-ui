'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateEmail, validatePassword, validatePasswordMatch, validateFullName, getPasswordStrength } from '@/lib/validation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

export function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    const fullNameValidation = validateFullName(formData.fullName)
    if (!fullNameValidation.isValid) newErrors.fullName = fullNameValidation.error || ''
    
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) newErrors.email = emailValidation.error || ''
    
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.error || ''
    
    const matchValidation = validatePasswordMatch(formData.password, formData.confirmPassword)
    if (!matchValidation.isValid) newErrors.confirmPassword = matchValidation.error || ''
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.fullName,
          },
        },
      })

      if (error) {
        setErrors({ submit: error.message })
        return
      }

      // Success - redirect to verification or dashboard
      router.push('/auth/verify-email?email=' + encodeURIComponent(formData.email))
    } catch (error) {
      setErrors({ submit: (error as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-destructive'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-emerald'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          className={`w-full px-4 py-3 rounded-lg bg-muted border transition-colors ${
            errors.fullName ? 'border-destructive' : 'border-border'
          } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50`}
        />
        {errors.fullName && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {errors.fullName}
          </div>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className={`w-full px-4 py-3 rounded-lg bg-muted border transition-colors ${
            errors.email ? 'border-destructive' : 'border-border'
          } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50`}
        />
        {errors.email && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </div>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-lg bg-muted border transition-colors ${
              errors.password ? 'border-destructive' : 'border-border'
            } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1">
              <div className={`h-1 flex-1 rounded ${getStrengthColor()}`} />
              <div className={`h-1 flex-1 rounded ${passwordStrength !== 'weak' ? getStrengthColor() : 'bg-muted'}`} />
              <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? getStrengthColor() : 'bg-muted'}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              Strength: <span className="capitalize text-foreground">{passwordStrength}</span>
            </p>
          </div>
        )}
        {errors.password && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {errors.password}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-3 rounded-lg bg-muted border transition-colors ${
              errors.confirmPassword ? 'border-destructive' : 'border-border'
            } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.confirmPassword && !errors.confirmPassword && (
          <div className="flex items-center gap-2 mt-2 text-sm text-emerald">
            <Check className="w-4 h-4" />
            Passwords match
          </div>
        )}
        {errors.confirmPassword && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            {errors.confirmPassword}
          </div>
        )}
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.submit}
        </div>
      )}

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={isLoading || Object.keys(errors).length > 0}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-lg gold-gradient text-obsidian font-semibold shadow-luxury transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </motion.button>

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/sign-in" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
