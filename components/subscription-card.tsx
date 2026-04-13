'use client'

import { motion } from 'framer-motion'
import { RefreshCw, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { cardLift, springs, staggerItem } from './motion'
import { SubscriptionActions } from './subscription-actions'
import { SubscriptionIcon } from '@/lib/brand-icons'

interface SubscriptionCardProps {
  subscription: Subscription
  index?: number
  onClick?: () => void
  onEdit?: () => void
}

interface SubscriptionCardCompactProps {
  subscription: Subscription
  onClick?: () => void
  onEdit?: () => void
}

export function SubscriptionCard({
  subscription,
  index = 0,
  onClick,
  onEdit,
}: SubscriptionCardProps) {
  const daysUntilRenewal = subscription.renewalDate
    ? getDaysUntilRenewal(subscription.renewalDate)
    : 0
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
      className="cursor-pointer group"
    >
      <motion.div
        variants={cardLift}
        whileHover={{ 
          y: -8, 
          boxShadow: '0 32px 64px -16px rgba(199, 163, 106, 0.25), 0 0 0 1px rgba(199, 163, 106, 0.15), 0 0 60px -20px rgba(199, 163, 106, 0.15)' 
        }}
        className="relative overflow-hidden rounded-3xl bg-card/90 backdrop-blur-xl border border-border p-6 shadow-card transition-all duration-400"
      >
        {/* DRAMATIC: Colored accent line at top - thicker and animated */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ 
            background: `linear-gradient(90deg, ${subscription.color || '#C7A36A'} 0%, ${subscription.color || '#C7A36A'}60 50%, transparent 100%)` 
          }}
          initial={{ scaleX: 0, originX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        />

        {/* DRAMATIC: Ambient glow on hover - more visible */}
        <motion.div
          className="absolute -inset-4 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ 
            background: `radial-gradient(circle at top left, ${subscription.color || '#C7A36A'}20 0%, transparent 50%)` 
          }}
        />
        
        {/* DRAMATIC: Secondary glow at bottom */}
        <motion.div
          className="absolute -inset-4 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700"
          style={{ 
            background: `radial-gradient(circle at bottom right, ${subscription.color || '#C7A36A'}10 0%, transparent 50%)` 
          }}
        />

        {/* DRAMATIC: Shimmer effect - slower and more visible */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none' }}
        />

        <div className="relative z-10 flex items-start gap-5">
          {/* DRAMATIC: Icon with animated glow effect */}
          <div className="relative">
            {/* Multi-layer glow */}
            <motion.div
              className="absolute -inset-2 rounded-2xl blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-500"
              style={{ backgroundColor: subscription.color || '#C7A36A' }}
            />
            <motion.div
              className="absolute -inset-1 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"
              style={{ backgroundColor: subscription.color || '#C7A36A' }}
            />
            <div className="relative">
              <SubscriptionIcon
                name={subscription.name}
                fallbackColor={subscription.color}
                size="lg"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                  {subscription.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.category}
                </p>
              </div>

              <div
                className="p-1.5 rounded-lg cursor-pointer opacity-60 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <SubscriptionActions subscription={subscription} onEdit={onEdit} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground tracking-tight">
                {subscription.currency}
                {Number(subscription.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingLabel}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full',
                isUrgent 
                  ? 'bg-crimson/10 text-crimson' 
                  : 'bg-muted/50 text-muted-foreground'
              )}>
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {isUrgent
                    ? daysUntilRenewal === 0
                      ? 'Due Today'
                      : `${daysUntilRenewal}d left`
                    : subscription.renewalDate
                      ? formatDate(subscription.renewalDate)
                      : 'N/A'}
                </span>
              </div>

              {subscription.status === 'paused' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gold/10 text-gold">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Paused</span>
                </div>
              )}

              {subscription.status === 'unused' && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
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

export function SubscriptionCardCompact({
  subscription,
  onClick,
  onEdit,
}: SubscriptionCardCompactProps) {
  const daysUntilRenewal = subscription.renewalDate
    ? getDaysUntilRenewal(subscription.renewalDate)
    : 0
  const isUrgent = daysUntilRenewal <= 3

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border cursor-pointer"
    >
      <SubscriptionIcon
        name={subscription.name}
        fallbackColor={subscription.color}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{subscription.name}</p>
        <p className="text-xs text-muted-foreground">{subscription.category}</p>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold text-foreground">
          {subscription.currency}
          {Number(subscription.amount || 0).toLocaleString('en-IN')}
        </p>
        <p className={cn('text-xs', isUrgent ? 'text-crimson' : 'text-muted-foreground')}>
          {daysUntilRenewal === 0 ? 'Due today' : `${daysUntilRenewal}d left`}
        </p>
      </div>

      <div
        className="shrink-0 p-1 rounded-lg cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <SubscriptionActions subscription={subscription} onEdit={onEdit} />
      </div>
    </motion.div>
  )
}

function getDaysUntilRenewal(dateStr: string): number {
  if (!dateStr) return 0

  const renewalDate = new Date(dateStr)
  if (Number.isNaN(renewalDate.getTime())) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  renewalDate.setHours(0, 0, 0, 0)

  const diffTime = renewalDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case 'daily':
      return 'day'
    case 'weekly':
      return 'wk'
    case 'monthly':
      return 'mo'
    case 'quarterly':
      return 'qtr'
    case 'yearly':
      return 'yr'
    default:
      return 'mo'
  }
}
