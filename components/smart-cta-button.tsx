'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { getStartedDestination, getUpgradeDestination } from '@/lib/upgrade-flow'

interface SmartCTAButtonProps {
  text: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onAuth?: (href: string) => void
}

/**
 * Smart CTA button that routes based on auth state
 * Uses centralized upgrade-flow utility for consistent routing
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
    const destination = getStartedDestination(isAuthenticated)
    router.push(destination)
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
 * Smart upgrade button that routes to upgrade flow
 * Uses centralized upgrade-flow utility for auth-aware routing
 */
export function SmartUpgradeCTA({
  planId = 'pro',
  text = 'Upgrade to Pro',
  variant = 'primary',
  size = 'md',
  className = '',
}: SmartCTAButtonProps & { planId?: 'pro' | 'family' | 'enterprise' }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = () => {
    if (loading) return
    setIsNavigating(true)
    const destination = getUpgradeDestination(planId, isAuthenticated)
    router.push(destination)
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

  const baseClass = `${sizeStyles[size]} ${baseStyles[variant]} transition-all cursor-pointer disabled:opacity-50 ${className}`

  return (
    <button onClick={handleClick} disabled={loading || isNavigating} className={baseClass}>
      {isNavigating ? 'Loading...' : text}
    </button>
  )
}
