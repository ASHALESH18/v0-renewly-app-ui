'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'

interface SmartCTAButtonProps {
  text: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onAuth?: (href: string) => void
}

/**
 * Smart CTA button that routes based on auth state
 * - Unauthenticated: Routes to /auth/sign-in with ?next=/app/dashboard
 * - Authenticated: Routes directly to /app/dashboard
 */
export function SmartGetStartedCTA({
  text = 'Get started',
  variant = 'primary',
  size = 'md',
  className = '',
}: SmartCTAButtonProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = () => {
    if (loading) return

    setIsNavigating(true)
    const href = isAuthenticated ? '/app/dashboard' : '/auth/sign-in?next=/app/dashboard'
    router.push(href)
  }

  const baseStyles = {
    primary: 'gold-gradient text-obsidian font-semibold shadow-luxury',
    secondary: 'border border-glass-border text-ivory hover:bg-glass',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-8 py-4 text-base rounded-xl',
    lg: 'px-10 py-5 text-lg rounded-2xl',
  }

  const baseClass = `${sizeStyles[size]} ${baseStyles[variant]} transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`

  return (
    <button
      onClick={handleClick}
      disabled={loading || isNavigating}
      className={baseClass}
    >
      {isNavigating ? 'Loading...' : text}
    </button>
  )
}

/**
 * Smart upgrade button for Free users
 * - Free users: Show upgrade modal
 * - Pro/Family/Enterprise: Disabled or hidden
 */
export function SmartUpgradeCTA({
  onUpgrade,
  text = 'Upgrade to Pro',
  variant = 'primary',
  size = 'md',
  className = '',
}: SmartCTAButtonProps & { onUpgrade: () => void }) {
  const baseStyles = {
    primary: 'gold-gradient text-obsidian font-semibold shadow-luxury',
    secondary: 'border border-glass-border text-ivory hover:bg-glass',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-8 py-4 text-base rounded-xl',
    lg: 'px-10 py-5 text-lg rounded-2xl',
  }

  const baseClass = `${sizeStyles[size]} ${baseStyles[variant]} transition-all cursor-pointer ${className}`

  return (
    <button onClick={onUpgrade} className={baseClass}>
      {text}
    </button>
  )
}
