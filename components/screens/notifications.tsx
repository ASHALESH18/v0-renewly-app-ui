"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, AlertTriangle, Info, Check, Trash2, Settings, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaggerList } from '@/components/motion'
import { useNotifications } from '@/lib/hooks/use-remote-data'

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
}

const typeConfig = {
  reminder: {
    icon: Calendar,
    color: 'text-gold',
    bgColor: 'bg-gold/10'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-crimson',
    bgColor: 'bg-crimson/10'
  },
  info: {
    icon: Info,
    color: 'text-platinum',
    bgColor: 'bg-platinum/10'
  }
}

export function NotificationsScreen() {
  const { notifications: apiNotifications, unreadCount: apiUnreadCount, isLoading, error } = useNotifications()
  const [items, setItems] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  
  // Sync API data to local state for optimistic updates
  useEffect(() => {
    if (apiNotifications.length > 0) {
      setItems(apiNotifications)
    }
  }, [apiNotifications])
  
  const filteredItems = filter === 'all' ? items : items.filter(n => !n.read)
  const unreadCount = items.filter(n => !n.read).length
  
  const markAsRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  
  const markAllAsRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }
  
  const deleteNotification = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id))
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-strong">
        <div className="px-4 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button className="p-2 rounded-full glass hover:bg-secondary/50 transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'unread'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer",
                  filter === tab
                    ? "bg-gold text-obsidian"
                    : "glass text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === 'all' ? 'All' : `Unread (${unreadCount})`}
              </button>
            ))}
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="ml-auto px-4 py-2 rounded-full text-sm font-medium text-gold hover:bg-gold/10 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
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
                
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={cn(
                      "relative p-4 rounded-2xl glass transition-all",
                      !notification.read && "ring-1 ring-gold/30"
                    )}
                  >
                    {/* Unread Indicator */}
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-gold" />
                    )}
                    
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        config.bgColor
                      )}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-medium text-foreground",
                          !notification.read && "text-gold"
                        )}>
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
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors cursor-pointer"
                          >
                            <Check className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 rounded-full hover:bg-crimson/20 transition-colors cursor-pointer"
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
                    ? "No unread notifications"
                    : "You don't have any notifications yet"
                  }
                </p>
              </motion.div>
            )}
          </StaggerList>
        )}
      </div>
    </div>
  )
}
