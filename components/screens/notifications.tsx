"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, AlertTriangle, TrendingUp, Check, Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StaggerList, staggerItem } from '@/components/motion'

interface Notification {
  id: string
  type: 'renewal' | 'alert' | 'insight' | 'system'
  title: string
  message: string
  time: string
  read: boolean
  actionLabel?: string
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'renewal',
    title: 'Netflix Renewal Tomorrow',
    message: 'Your Netflix subscription ($15.99) will renew on March 13, 2026.',
    time: '2 hours ago',
    read: false,
    actionLabel: 'View Details'
  },
  {
    id: '2',
    type: 'alert',
    title: 'Price Increase Detected',
    message: 'Spotify increased their Premium tier by $2/month starting next billing cycle.',
    time: '5 hours ago',
    read: false,
    actionLabel: 'Review'
  },
  {
    id: '3',
    type: 'insight',
    title: 'Money-Saving Opportunity',
    message: 'You could save $48/year by switching to annual billing for Adobe Creative Cloud.',
    time: '1 day ago',
    read: true,
    actionLabel: 'Learn More'
  },
  {
    id: '4',
    type: 'system',
    title: 'Leak Report Ready',
    message: 'Your monthly Leak Report for February is ready to view.',
    time: '2 days ago',
    read: true,
    actionLabel: 'View Report'
  },
  {
    id: '5',
    type: 'renewal',
    title: 'Figma Renewed',
    message: 'Your Figma Professional subscription ($15/month) was successfully renewed.',
    time: '3 days ago',
    read: true
  },
  {
    id: '6',
    type: 'alert',
    title: 'Unused Subscription',
    message: 'You haven\'t used Notion in the past 30 days. Consider reviewing this subscription.',
    time: '5 days ago',
    read: true,
    actionLabel: 'Review'
  }
]

const typeConfig = {
  renewal: {
    icon: Calendar,
    color: 'text-gold',
    bgColor: 'bg-gold/10'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-crimson',
    bgColor: 'bg-crimson/10'
  },
  insight: {
    icon: TrendingUp,
    color: 'text-emerald',
    bgColor: 'bg-emerald/10'
  },
  system: {
    icon: Bell,
    color: 'text-platinum',
    bgColor: 'bg-platinum/10'
  }
}

export function NotificationsScreen() {
  const [items, setItems] = useState(notifications)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  
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
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
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
                className="ml-auto px-4 py-2 rounded-full text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="px-4 py-4">
        <StaggerList className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((notification) => {
              const config = typeConfig[notification.type]
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
                          {notification.time}
                        </span>
                        {notification.actionLabel && (
                          <button className="text-xs font-medium text-gold hover:text-gold/80 transition-colors">
                            {notification.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors"
                        >
                          <Check className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded-full hover:bg-crimson/20 transition-colors"
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
      </div>
    </div>
  )
}
