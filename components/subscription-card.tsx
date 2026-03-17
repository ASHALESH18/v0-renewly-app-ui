'use client'

import { motion } from 'framer-motion'
import { 
  MoreHorizontal, 
  RefreshCw, 
  Users, 
  CreditCard,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { cardLift, springs, staggerItem } from './motion'

interface SubscriptionCardProps {
  subscription: Subscription
  index?: number
  onClick?: () => void
}

export function SubscriptionCard({ subscription, index = 0, onClick }: SubscriptionCardProps) {
  const daysUntilRenewal = subscription.renewalDate ? getDaysUntilRenewal(subscription.renewalDate) : 0
  const isUrgent = daysUntilRenewal <= 3
  const billingLabel = getBillingLabel(subscription.billingCycle)

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      custom={index}
      transition={{ ...springs.gentle, delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer"
    >
    <motion.div
      variants={cardLift}
      whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(199, 163, 106, 0.15)' }}
      className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 shadow-card transition-shadow"
    >
        {/* Animated gradient accent overlay on hover */}
        <motion.div 
          className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100"
          style={{ background: subscription.color }}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Subtle shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none', opacity: 0.05 }}
        />

        <div className="relative z-10 flex items-start gap-4">
          {/* Logo */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg shrink-0"
            style={{ backgroundColor: subscription.color }}
          >
            {subscription.logo}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">
                  {subscription.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.category}
                </p>
              </div>
              <button 
                className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Amount and cycle */}
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-xl font-semibold text-foreground">
                {subscription.currency}{subscription.amount.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingLabel}
              </span>
            </div>

            {/* Meta info */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {/* Next renewal */}
              <div className={cn(
                'flex items-center gap-1.5',
                isUrgent && 'text-crimson'
              )}>
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isUrgent 
                    ? `${daysUntilRenewal === 0 ? 'Today' : `${daysUntilRenewal}d left`}`
                    : subscription.renewalDate ? formatDate(subscription.renewalDate) : 'N/A'
                  }
                </span>
              </div>

              {/* Status badge */}
              {subscription.status === 'paused' && (
                <div className="flex items-center gap-1.5 text-gold">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Paused</span>
                </div>
              )}

              {subscription.status === 'unused' && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Unused</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Compact card variant for lists
interface SubscriptionCardCompactProps {
  subscription: Subscription
  onClick?: () => void
}

export function SubscriptionCardCompact({ subscription, onClick }: SubscriptionCardCompactProps) {
  const daysUntilRenewal = subscription.renewalDate ? getDaysUntilRenewal(subscription.renewalDate) : 0
  const isUrgent = daysUntilRenewal <= 3

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border cursor-pointer"
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold shrink-0"
        style={{ backgroundColor: subscription.color }}
      >
        {subscription.logo}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{subscription.name}</p>
        <p className="text-xs text-muted-foreground">{subscription.category}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-foreground">
          {subscription.currency}{subscription.amount.toLocaleString('en-IN')}
        </p>
        <p className={cn(
          'text-xs',
          isUrgent ? 'text-crimson' : 'text-muted-foreground'
        )}>
          {daysUntilRenewal === 0 
            ? 'Due today' 
            : `${daysUntilRenewal}d left`
          }
        </p>
      </div>
    </motion.div>
  )
}

// Helper functions
function getDaysUntilRenewal(dateStr: string): number {
  const renewalDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  renewalDate.setHours(0, 0, 0, 0)
  const diffTime = renewalDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case 'daily': return 'day'
    case 'weekly': return 'wk'
    case 'monthly': return 'mo'
    case 'quarterly': return 'qtr'
    case 'yearly': return 'yr'
    default: return 'mo'
  }
}
