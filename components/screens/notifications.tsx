'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, AlertTriangle, Info, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaggerList } from '@/components/motion'
import { useNotifications } from '@/lib/hooks/use-remote-data'
import { NotificationsListSkeleton } from '@/components/skeletons'

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
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
  const { notifications: apiNotifications, isLoading, error } = useNotifications()
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [pendingIds, setPendingIds] = useState<string[]>([])
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    setItems((apiNotifications as Notification[]) || [])
  }, [apiNotifications])

  const unreadCount = useMemo(
    () => items.filter((notification) => !notification.read).length,
    [items]
  )

  const filteredItems = useMemo(
    () => (filter === 'all' ? items : items.filter((notification) => !notification.read)),
    [filter, items]
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
      await persistAction({ action: 'mark_read', id })
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
      await persistAction({ action: 'mark_all_read', ids: unreadIds })
    } catch {
      setItems(previousItems)
      setActionError('Could not mark all notifications as read. Please try again.')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const dismissNotification = async (id: string) => {
    if (isPending(id)) return

    const previousItems = items
    setActionError(null)
    setPendingIds((prev) => [...prev, id])
    setItems((prev) => prev.filter((item) => item.id !== id))

    try {
      await persistAction({ action: 'dismiss', id })
    } catch {
      setItems(previousItems)
      setActionError('Could not remove that notification. Please try again.')
    } finally {
      setPendingIds((prev) => prev.filter((itemId) => itemId !== id))
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
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 glass-strong">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => void markAllAsRead()}
                disabled={isMarkingAll}
                className="px-4 py-2 rounded-full text-sm font-medium text-gold hover:bg-gold/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {(['all', 'unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer',
                  filter === tab
                    ? 'bg-gold text-obsidian'
                    : 'glass text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {actionError && (
            <div className="mt-3 rounded-xl border border-crimson/20 bg-crimson/10 px-3 py-2 text-sm text-crimson">
              {actionError}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    onClick={() => {
                      if (!notification.read) {
                        void markAsRead(notification.id)
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        !notification.read &&
                        (event.key === 'Enter' || event.key === ' ')
                      ) {
                        event.preventDefault()
                        void markAsRead(notification.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'relative p-4 rounded-2xl glass transition-all cursor-pointer',
                      !notification.read && 'ring-1 ring-gold/30',
                      pending && 'opacity-70'
                    )}
                  >
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
                            onClick={() => void markAsRead(notification.id)}
                            disabled={pending}
                            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}

                        <button
                          onClick={() => void dismissNotification(notification.id)}
                          disabled={pending}
                          className="p-1.5 rounded-full hover:bg-crimson/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-crimson" />
                        </button>
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