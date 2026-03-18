'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Settings, Bell, Home, User, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import useStore from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (path: string) => void
  avatarUrl?: string
}

export function ProfileMenu({ isOpen, onClose, onNavigate, avatarUrl }: ProfileMenuProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const userProfile = useStore((state) => state.userProfile)
  const currentUserEmail = useStore((state) => state.currentUserEmail)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
    router.refresh()
  }

  const handleNavigation = (path: string) => {
    onClose()
    if (onNavigate) {
      onNavigate(path)
    } else {
      router.push(path)
    }
  }

  if (!userProfile) {
    // Not signed in
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-full right-0 mt-2 w-64 rounded-xl',
          'glass-strong border border-glass-border',
          'shadow-lg z-50',
          !isOpen && 'pointer-events-none'
        )}
      >
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground text-center py-2">
            You're not signed in
          </p>
          <button
            onClick={() => handleNavigation('/auth/sign-in')}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => handleNavigation('/auth/sign-up')}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
          >
            <User className="w-4 h-4" />
            Sign Up
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={isOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'absolute top-full right-0 mt-2 w-72 rounded-xl',
        'glass-strong border border-glass-border',
        'shadow-lg z-50',
        !isOpen && 'pointer-events-none'
      )}
    >
      {/* User info header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center gap-3">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt={userProfile.name}
              className="w-10 h-10 rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userProfile.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentUserEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-2 space-y-1">
        <button
          onClick={() => handleNavigation('/app/settings#profile')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
        >
          <User className="w-4 h-4 text-muted-foreground" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => handleNavigation('/app/settings#notifications')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => handleNavigation('/app/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => handleNavigation('/')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-foreground"
        >
          <Home className="w-4 h-4 text-muted-foreground" />
          <span>Home</span>
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-glass-border" />

      {/* Sign out */}
      <div className="p-2">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-sm text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </div>
    </motion.div>
  )
}
