'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, AlertTriangle, Info, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaggerList } from '@/components/motion'
import { useNotifications } from '@/lib/hooks/use-remote-data'
import { NotificationsListSkeleton } from '@/components/skeletons'
import { getCategoryLabel } from '@/lib/notifications/notification-types'
import type { NotificationCategory } from '@/lib/notifications/notification-types'

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
  actionHref?: string
  actionUrl?: string
  category?: NotificationCategory
  severity?: string
}

type NotificationMutationAction = 'mark_read' | 'mark_all_read' | 'dismiss'

const typeConfig = {
  reminder: {
    icon: Calendar,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-crimson',
    bgColor: 'bg-crimson/10',
  },
  info: {
    icon: Info,
    color: 'text-platinum',
    bgColor: 'bg-platinum/10',
  },
}

export function NotificationsScreen() {
  const router = useRouter()
  const { notifications: apiNotifications, isLoading, error, refresh } = useNotifications()
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  // N2: Add category filter support
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory | 'all'>('all')
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(true)

  useEffect(() => {
    const normalized = ((apiNotifications as Notification[]) || []).map((item: any) => ({
      ...item,
      actionHref: item.actionHref || item.action_url || item.actionUrl,
      category: item.category || 'system',
      read: Boolean(item.read),
    }))
    setItems(normalized)
    // Always stop loading after API data arrives
    setLocalLoading(false)
  }, [apiNotifications])

  // Initial fetch on mount
  useEffect(() => {
    const init = async () => {
      try {
        await refresh(false)
      } catch (e) {
        console.error('[notifications] Failed to refresh on mount:', e)
      } finally {
        setLocalLoading(false)
      }
    }
    void init()
  }, [])

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items]
  )

  const filteredItems = useMemo(
    () => {
      let result = items
      
      // Apply read/unread filter
      if (filter === 'unread') {
        result = result.filter((notification) => !notification.read)
      }
      
      // N2: Apply category filter
      if (categoryFilter !== 'all') {
        result = result.filter((notification) => notification.category === categoryFilter)
      }
      
      return result
    },
    [filter, categoryFilter, items]
  )

  const isPending = (id: string) => pendingIds.includes(id)

  const persistAction = async (payload: {
    action: NotificationMutationAction
    id?: string
    ids?: string[]
  }) => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('Failed to update notifications')
    }
  }

  const markAsRead = async (id: string) => {
    const existing = items.find((item) => item.id === id)
    if (!existing || existing.read || isPending(id)) return

    const previousItems = items
    setActionError(null)
    setPendingIds((prev) => [...prev, id])
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    )

    try {
      // S5B.3-R: Handle derived Family invite notifications
      if (id.startsWith('family-invite-')) {
        const { markDerivedNotificationRead } = await import('@/lib/notifications/derive-family-invite-notification')
        markDerivedNotificationRead(id)
      } else {
        await persistAction({ action: 'mark_read', id })
      }
    } catch {
      setItems(previousItems)
      setActionError('Could not update that notification. Please try again.')
    } finally {
      setPendingIds((prev) => prev.filter((itemId) => itemId !== id))
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id)
    if (!unreadIds.length || isMarkingAll) return

    const previousItems = items
    setActionError(null)
    setIsMarkingAll(true)
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))

    try {
      // S5B.3-R: Separate derived and API notifications
      const derivedIds = unreadIds.filter((id) => id.startsWith('family-invite-'))
      const apiIds = unreadIds.filter((id) => !id.startsWith('family-invite-'))

      if (derivedIds.length > 0) {
        const { markDerivedNotificationRead } = await import('@/lib/notifications/derive-family-invite-notification')
        derivedIds.forEach((id) => markDerivedNotificationRead(id))
      }

      if (apiIds.length > 0) {
        await persistAction({ action: 'mark_all_read', ids: apiIds })
      }
    } catch {
      setItems(previousItems)
      setActionError('Could not mark all notifications as read. Please try again.')
    } finally {
      setIsMarkingAll(false)
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
    <div className="min-h-screen bg-transparent pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 glass-premium border-b border-gold/10"
      >
        <div className="px-4 pt-12 pb-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-gold font-medium">{unreadCount}</span> unread
                  notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void markAllAsRead()}
                disabled={isMarkingAll}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gold bg-gold/10 border border-gold/20 hover:bg-gold/15 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Mark all read
              </motion.button>
            )}
          </div>

          {/* Primary filter: All/Unread */}
          <div className="flex gap-3 mb-6">
            {(['all', 'unread'] as const).map((tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap',
                  filter === tab
                    ? 'bg-gradient-to-r from-gold to-gold/80 text-obsidian shadow-[0_4px_12px_-4px_rgba(199,163,106,0.4)]'
                    : 'bg-card/60 border border-border text-muted-foreground hover:text-foreground hover:border-gold/20'
                )}
                type="button"
              >
                {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
              </motion.button>
            ))}
          </div>

          {/* Category filter: separate row with better spacing */}
          <div className="flex gap-3 flex-wrap">
            {(['all', 'billing', 'family', 'renewals', 'security', 'system'] as const).map((cat) => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCategoryFilter(cat === 'all' ? 'all' : (cat as NotificationCategory))}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
                  categoryFilter === cat
                    ? 'bg-gold/20 border border-gold/50 text-gold'
                    : 'bg-card/40 border border-border/50 text-muted-foreground hover:text-foreground hover:border-gold/30'
                )}
                type="button"
              >
                {cat === 'all' ? 'All' : getCategoryLabel(cat)}
              </motion.button>
            ))}
          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-crimson/20 bg-crimson/10 px-3 py-2 text-sm text-crimson">
              {actionError}
            </div>
          )}
        </div>
      </motion.div>

      <div className="px-4 py-4">
        {localLoading ? (
          <NotificationsListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-crimson/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-crimson" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Failed to load</h3>
            <p className="text-sm text-muted-foreground text-center">
              Could not load notifications. Please try again.
            </p>
          </div>
        ) : (
          <StaggerList className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((notification) => {
                const config = typeConfig[notification.type] || typeConfig.info
                const Icon = config.icon
                const pending = isPending(notification.id)

                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -100, filter: 'blur(4px)' }}
                    whileHover={{
                      y: -2,
                      boxShadow: '0 12px 24px -8px rgba(199, 163, 106, 0.12)',
                    }}
                    onClick={() => {
                      if (!notification.read) {
                        void markAsRead(notification.id)
                      }
                      const href = notification.actionHref || notification.actionUrl
                      if (href && href !== '/app/notifications') {
                        router.push(href)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (!notification.read) {
                          void markAsRead(notification.id)
                        }
                        const href = notification.actionHref || notification.actionUrl
                        if (href && href !== '/app/notifications') {
                          router.push(href)
                        }
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'relative p-5 rounded-2xl bg-card/60 backdrop-blur-sm border transition-all cursor-pointer group overflow-hidden',
                      !notification.read
                        ? 'border-gold/30 bg-gradient-to-br from-gold/5 to-transparent shadow-[0_0_0_1px_rgba(199,163,106,0.1)]'
                        : 'border-border hover:border-gold/20',
                      pending && 'opacity-70'
                    )}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle at top left, rgba(199,163,106,0.08) 0%, transparent 60%)',
                      }}
                    />

                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold" />
                    )}

                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                          config.bgColor
                        )}
                      >
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={cn(
                            'font-medium text-foreground',
                            !notification.read && 'text-gold'
                          )}
                        >
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.date)}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex flex-col gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {!notification.read && (
                          <button
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              void markAsRead(notification.id)
                            }}
                            disabled={pending}
                            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                          >
                            <Check className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {filter === 'unread'
                    ? 'No unread notifications'
                    : "You don't have any notifications yet"}
                </p>
              </motion.div>
            )}
          </StaggerList>
        )}
      </div>
    </div>
  )
}
