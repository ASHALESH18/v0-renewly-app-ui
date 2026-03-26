'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from './motion'
import useStore from '@/lib/store'
import { generateAvatar } from '@/lib/avatar-utils'
import { ProfileMenu } from './profile-menu'

interface HeaderProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  showNotifications?: boolean
  showProfile?: boolean
  onSearchClick?: () => void
  onNotificationClick?: () => void
  onProfileClick?: () => void
  onSettingsClick?: () => void
  notificationCount?: number
  transparent?: boolean
  className?: string
}

export function Header({
  title,
  subtitle,
  showSearch = true,
  showNotifications = true,
  showProfile = true,
  onSearchClick,
  onNotificationClick,
  onProfileClick,
  onSettingsClick,
  notificationCount = 0,
  transparent = false,
  className,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const userProfile = useStore((state) => state.userProfile)
  const firstName = userProfile?.name?.split(' ')[0] || 'User'
  const avatar = firstName.charAt(0).toUpperCase()

  // Generate avatar URL deterministically
  const avatarUrl = useMemo(() => {
    if (!userProfile) return null
    const seed = userProfile.avatarSeed || userProfile.email || 'default'
    return generateAvatar({ seed, size: 256 })
  }, [userProfile?.email, userProfile?.avatarSeed])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springs.gentle}
      className={cn(
        'sticky top-0 z-30 px-4 py-4 lg:px-6',
        !transparent && 'glass-strong',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Title or Logo */}
        <div className="flex-1 min-w-0">
          {title ? (
            <div>
              <h1 className="text-xl font-semibold text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center lg:hidden">
                <span className="text-obsidian font-semibold text-sm">R</span>
              </div>
              <div className="lg:hidden">
                <p className="text-sm text-muted-foreground">Good morning,</p>
                <p className="font-semibold text-foreground">{firstName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {showSearch && (
            <HeaderButton onClick={onSearchClick}>
              <Search className="w-5 h-5" />
            </HeaderButton>
          )}

          {showNotifications && (
            <HeaderButton onClick={onNotificationClick} badge={notificationCount}>
              <Bell className="w-5 h-5" />
            </HeaderButton>
          )}

          {showProfile && (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen)
                  onProfileClick?.()
                }}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 bg-[radial-gradient(circle_at_top,rgba(199,163,106,0.14),rgba(255,255,255,0.02))] hover:border-gold/60 hover:shadow-[0_0_0_4px_rgba(199,163,106,0.08)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userProfile?.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gold/10 flex items-center justify-center text-gold font-medium text-sm">
                    {avatar}
                  </div>
                )}
              </motion.button>
              <ProfileMenu
                isOpen={isProfileMenuOpen}
                onClose={() => setIsProfileMenuOpen(false)}
                avatarUrl={avatarUrl || undefined}
              />
            </div>
          )}

          {onSettingsClick && (
            <HeaderButton onClick={onSettingsClick}>
              <Settings className="w-5 h-5" />
            </HeaderButton>
          )}
        </div>
      </div>
    </motion.header>
  )
}

interface HeaderButtonProps {
  children: React.ReactNode
  onClick?: () => void
  badge?: number
}

function HeaderButton({ children, onClick, badge }: HeaderButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative w-10 h-10 rounded-xl border border-gold/15 bg-[radial-gradient(circle_at_top,rgba(199,163,106,0.12),rgba(255,255,255,0.02))] flex items-center justify-center text-foreground/80 hover:text-gold hover:border-gold/35 hover:bg-gold/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50"
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-crimson text-[10px] font-semibold text-ivory flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  )
}

// Search overlay component
interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange
}: SearchOverlayProps) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
