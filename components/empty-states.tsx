'use client'

import { motion } from 'framer-motion'
import { Plus, Search, Bell, Calendar, TrendingDown } from 'lucide-react'
import { springs } from './motion'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...springs.gentle }}
        className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center mb-4"
      >
        <div className="text-gold text-3xl">
          {icon}
        </div>
      </motion.div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {description}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-2 rounded-xl gold-gradient text-obsidian font-medium cursor-pointer transition-all hover:shadow-luxury"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

export function NoSubscriptionsEmpty({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      icon={<Plus className="w-8 h-8" />}
      title="No subscriptions yet"
      description="Start tracking your recurring payments to take control of your finances."
      action={{ label: 'Add First Subscription', onClick: onAddClick }}
    />
  )
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      icon={<Search className="w-8 h-8" />}
      title="No results found"
      description={`We couldn't find any subscriptions matching "${query}"`}
    />
  )
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon={<Bell className="w-8 h-8" />}
      title="All caught up"
      description="You have no pending notifications. Enjoy the silence!"
    />
  )
}

export function NoUpcomingEmpty() {
  return (
    <EmptyState
      icon={<Calendar className="w-8 h-8" />}
      title="No upcoming renewals"
      description="Your next subscription renewals are further out. Relax for now!"
    />
  )
}

export function NoLeaksEmpty() {
  return (
    <EmptyState
      icon={<TrendingDown className="w-8 h-8" />}
      title="Well optimized"
      description="All your subscriptions are being actively used. Great job!"
    />
  )
}
