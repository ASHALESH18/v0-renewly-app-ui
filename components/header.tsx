'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Settings, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs } from './motion'
import useStore from '@/lib/store'
import { generateAvatar } from '@/lib/avatar-utils'
import { ProfileMenu } from './profile-menu'
import { useNotifications } from '@/lib/hooks/use-remote-data'

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

interface NotificationItem {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
  actionHref?: string
  actionUrl?: string
  category?: string
  severity?: string
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
  notificationCount,
  transparent = false,
  className,
}: HeaderProps) {
  const router = useRouter()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false)

  const notificationPanelRef = useRef<HTMLDivElement | null>(null)

  const userProfile = useStore((state) => state.userProfile)
  const firstName = userProfile?.name?.split(' ')[0] || 'User'
  const avatar = firstName.charAt(0).toUpperCase()

  const {
    notifications,
    unreadCount: liveUnreadCount,
    isLoading: notificationsLoading,
    refresh: refreshNotifications,
    refreshForBellOpen,
  } = useNotifications()

  // Close notification popover on route change to prevent blocking navigation
  useEffect(() => {
    const handleRouteChange = () => {
      setIsNotificationsOpen(false)
    }
    // Note: useRouter doesn't provide route change listeners in Next.js 13+
    // Instead, we'll use the window popstate event as a fallback
    window.addEventListener('popstate', handleRouteChange)
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [])

  const recentNotifications = useMemo<NotificationItem[]>(
    () => ((notifications || []) as NotificationItem[]).slice(0, 3),
    [notifications]
  )

  const resolvedNotificationCount =
    typeof notificationCount === 'number' ? notificationCount : liveUnreadCount

  const avatarUrl = useMemo(() => {
    if (!userProfile) return null

    if (userProfile.avatarUrl) {
      return userProfile.avatarUrl
    }

    const seed =
      userProfile.avatarSeed ||
      [userProfile.name, userProfile.email].filter(Boolean).join('::') ||
      'default'

    return generateAvatar({ seed, size: 256 })
  }, [userProfile?.name, userProfile?.email, userProfile?.avatarSeed, userProfile?.avatarUrl])

  useEffect(() => {
    if (!isNotificationsOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen])

  const persistNotificationAction = async (payload: {
    action: 'mark_read' | 'mark_all_read' | 'dismiss'
    id?: string
    ids?: string[]
  }) => {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error('Failed to update notifications')
    }
  }

  const handleMarkRead = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead || isUpdatingNotifications) return

    try {
      setIsUpdatingNotifications(true)
      
      // S5B.3-R: Handle derived Family invite notifications stored in localStorage
      if (id.startsWith('family-invite-')) {
        const { markDerivedNotificationRead } = await import('@/lib/notifications/derive-family-invite-notification')
        markDerivedNotificationRead(id)
      } else {
        // Regular API notification
        await persistNotificationAction({ action: 'mark_read', id })
      }
      
      await refreshNotifications()
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const handleMarkAllRead = async () => {
    if (!liveUnreadCount || isUpdatingNotifications) return

    try {
      setIsUpdatingNotifications(true)
      const unreadIds = ((notifications || []) as NotificationItem[])
        .filter((item) => !item.read)
        .map((item) => item.id)

      if (!unreadIds.length) return

      // S5B.3-R: Separate derived and API notifications
      const derivedIds = unreadIds.filter((id) => id.startsWith('family-invite-'))
      const apiIds = unreadIds.filter((id) => !id.startsWith('family-invite-'))

      if (derivedIds.length > 0) {
        const { markDerivedNotificationRead } = await import('@/lib/notifications/derive-family-invite-notification')
        derivedIds.forEach((id) => markDerivedNotificationRead(id))
      }

      if (apiIds.length > 0) {
        await persistNotificationAction({ action: 'mark_all_read', ids: apiIds })
      }

      await refreshNotifications()
    } finally {
      setIsUpdatingNotifications(false)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'sticky top-0 z-30 px-4 py-5 lg:px-6',
        !transparent && 'bg-card/98 backdrop-blur-lg border-b border-gold/10 shadow-[0_4px_24px_-4px_rgba(199,163,106,0.06)]',
        className
      )}
    >
      {/* Static top highlight - no animation */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {title ? (
            <div>
              <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
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

        <div className="flex items-center gap-2">
          {showSearch && (
            <HeaderButton onClick={onSearchClick} ariaLabel="Search subscriptions">
              <Search className="w-5 h-5" />
            </HeaderButton>
          )}

          {showNotifications && (
            <div className="relative" ref={notificationPanelRef}>
              <HeaderButton
                onClick={() => {
                  // S5B.4-R: Refresh with shorter TTL (10s) when opening bell
                  refreshForBellOpen?.().catch(() => {})
                  setIsNotificationsOpen((prev) => !prev)
                  onNotificationClick?.()
                }}
                badge={resolvedNotificationCount}
              >
                <Bell className="w-5 h-5" />
              </HeaderButton>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute right-0 top-14 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gold/25 overflow-hidden"
                    style={{
                      background: 'rgba(8, 12, 22, 0.985)',
                      backdropFilter: 'blur(26px) saturate(130%)',
                      boxShadow: '0 28px 90px rgba(0, 0, 0, 0.72)',
                    }}
                  >
                    {/* Top gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            {liveUnreadCount} unread
                          </p>
                        </div>

                        {liveUnreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void handleMarkAllRead()}
                            disabled={isUpdatingNotifications}
                            className="text-xs font-medium text-gold hover:text-gold/80 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                        Loading notifications...
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
                        You’re all caught up.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              'rounded-xl border p-3 transition-colors',
                              notification.read
                                ? 'border-border bg-card/40'
                                : 'border-gold/20 bg-gold/5'
                            )}
                          >
                            <button
                              type="button"
                              onClick={async (event) => {
                                event.preventDefault()
                                event.stopPropagation()

                                if (!notification.read) {
                                  await handleMarkRead(notification.id, notification.read)
                                }

                                setIsNotificationsOpen(false)
                                const href = notification.actionHref || notification.actionUrl || '/app/notifications'
                                router.push(href)
                              }}
                              className="w-full text-left cursor-pointer"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p
                                    className={cn(
                                      'text-sm font-medium truncate',
                                      notification.read
                                        ? 'text-foreground'
                                        : 'text-gold'
                                    )}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-2">
                                    {formatTimeAgo(notification.date)}
                                  </p>
                                </div>

                                {!notification.read && (
                                  <span className="mt-1 w-2 h-2 rounded-full bg-gold shrink-0" />
                                )}
                              </div>
                            </button>

                            <div className="flex items-center justify-end gap-2 mt-2">
                              {!notification.read && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    void handleMarkRead(notification.id, notification.read)
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                                >
                                  <Check className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Link
                      href="/app/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="mt-3 flex items-center justify-center rounded-xl border border-gold/15 bg-white/5 px-3 py-2 text-sm font-medium text-foreground hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                      View all notifications
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
  children: ReactNode
  onClick?: () => void
  badge?: number
  ariaLabel?: string
}

function HeaderButton({ children, onClick, badge, ariaLabel }: HeaderButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative w-11 h-11 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(199,163,106,0.15),rgba(255,255,255,0.03))] flex items-center justify-center text-foreground/80 hover:text-gold hover:border-gold/40 hover:bg-gold/15 hover:shadow-[0_8px_24px_-8px_rgba(199,163,106,0.25)] transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 group"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gold/10 blur-lg opacity-0 group-hover:opacity-60 transition-opacity -z-10" />
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-crimson text-[10px] font-bold text-ivory flex items-center justify-center shadow-[0_4px_8px_-2px_rgba(122,57,64,0.5)]">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  )
}

interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
  meta?: string
}

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  results?: SearchResultItem[]
  emptyMessage?: string
  onResultClick?: (id: string) => void // Deprecated: results are now display-only
}

export type { SearchResultItem, SearchOverlayProps }

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  results = [],
  emptyMessage = 'No subscriptions match your search',
  onResultClick,
}: SearchOverlayProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl"
    >
      <div className="absolute inset-0 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Search input area */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-border/50">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
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
              className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </motion.button>
          </div>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            {searchQuery.trim() === '' ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-sm">
                  Search by subscription name or category
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-sm">
                  {emptyMessage}
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground mb-4">
                  Showing {results.length} result{results.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-2">
                  {results.slice(0, 6).map((result) => (
                    <div
                      key={result.id}
                      className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 transition-colors cursor-default"
                    >
                      <div className="font-medium text-foreground">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.subtitle}
                        </div>
                      )}
                      {result.meta && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.meta}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return createPortal(content, document.body)
}
