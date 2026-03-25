'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, Bell, User, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/lib/store'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (path: string) => void
  avatarUrl?: string
}

export function ProfileMenu({ isOpen, onClose, onNavigate, avatarUrl }: ProfileMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const userProfile = useStore((state) => state.userProfile)
  const currentUserEmail = useStore((state) => state.currentUserEmail)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSignOut = async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    onClose()

    try {
      await signOutAndRedirectHome()
    } catch (error) {
      console.error('[v0] Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const handleNavigation = (path: string) => {
    onClose()

    // Check if we're already on the target page
    if (pathname === path || pathname.startsWith(path.split('?')[0])) {
      // If navigating to settings with a section, scroll to it
      if (path.includes('?section=')) {
        const section = new URLSearchParams(path.split('?')[1]).get('section')
        if (section) {
          // Use setTimeout to allow menu to close first
          setTimeout(() => {
            const element = document.getElementById(section)
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
        return
      }
    }

    if (onNavigate) {
      onNavigate(path)
    } else {
      router.push(path)
    }
  }

  // Get plan display info
  const planNames: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Member',
    family: 'Family Plan',
    enterprise: 'Enterprise',
  }
  const planName = userProfile?.plan ? planNames[userProfile.plan] : 'Free Plan'
  const isPremium = userProfile?.plan && userProfile.plan !== 'free'

  const menuItems = [
    {
      icon: User,
      label: 'Profile',
      description: 'View and edit your profile',
      path: '/app/settings?section=profile',
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Notification preferences',
      path: '/app/notifications',
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Account settings',
      path: '/app/settings',
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full right-0 mt-2 w-80 rounded-2xl glass-strong border border-glass-border shadow-luxury z-50"
        >
          {/* User info header */}
          <div className="p-4 border-b border-glass-border">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userProfile?.name || 'Profile'}
                  className="w-12 h-12 rounded-xl object-cover border border-glass-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                  <span className="text-lg font-semibold text-gold">
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentUserEmail || 'No email'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Crown className={cn("w-3.5 h-3.5", isPremium ? "text-gold" : "text-muted-foreground")} />
                  <span className={cn("text-xs font-medium", isPremium ? "text-gold" : "text-muted-foreground")}>
                    {planName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path.split('?')[0]

              return (
                <motion.button
                  key={item.label}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "hover:bg-secondary/50 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isActive ? "bg-gold/20" : "bg-secondary"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-gold" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Sign out */}
          <div className="p-2 border-t border-glass-border">
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </p>
                <p className="text-xs text-muted-foreground">
                  End your session
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
