'use client'

import { motion } from 'framer-motion'
import { RefreshCw, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { cardLift, springs, staggerItem } from './motion'
import { SubscriptionActions } from './subscription-actions'
import { SubscriptionIcon } from '@/lib/brand-icons'
import useStore from '@/lib/store'
import { useExchangeRates } from '@/lib/hooks/use-exchange-rates'
import { formatSubscriptionMoney } from '@/lib/preferences-format'
import { isRenewlyManagedSubscription } from '@/lib/billing/managed-subscription-utils'

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
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const preferredLanguage = notificationSettings.language || 'en'
  const { rates } = useExchangeRates()
  const displayAmount = formatSubscriptionMoney(subscription, preferredCurrency, preferredLanguage, rates)

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
      className="group relative cursor-pointer overflow-visible"
    >
      <motion.div
        variants={cardLift}
        whileHover={{ y: -5 }}
        className="relative overflow-visible rounded-2xl bg-card/95 backdrop-blur-xl border border-border/70 p-5 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-gold/12"
      >
        <motion.div
          className="pointer-events-none absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: `linear-gradient(90deg, ${subscription.color || '#B08440'} 0%, ${subscription.color || '#B08440'}50 60%, transparent 100%)`,
          }}
          initial={{ scaleX: 0, originX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.35 }}
        />

        <motion.div
          className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at top left, ${subscription.color || '#B08440'}10 0%, transparent 50%)`,
          }}
        />

        <div className="relative z-10 flex items-start gap-4">
          <div className="relative shrink-0">
            <motion.div
              className="absolute -inset-1 rounded-xl blur-md opacity-0 transition-opacity duration-300 group-hover:opacity-40"
              style={{ backgroundColor: subscription.color || '#B08440' }}
            />
            <div className="relative">
              <SubscriptionIcon
                name={subscription.name}
                fallbackColor={subscription.color}
                size="lg"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-gold">
                  {subscription.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.category}
                </p>
              </div>

              {!isRenewlyManagedSubscription(subscription) && (
                <div
                  className="relative z-30 shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SubscriptionActions subscription={subscription} onEdit={onEdit} />
                </div>
              )}
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-foreground">
                {displayAmount}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingLabel}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-2 py-1',
                  isUrgent
                    ? 'bg-crimson/10 text-crimson'
                    : 'bg-muted/50 text-muted-foreground'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {subscription.renewalDate
                    ? isUrgent
                      ? daysUntilRenewal === 0
                        ? 'Due Today'
                        : `${daysUntilRenewal}d left`
                      : formatDate(subscription.renewalDate)
                    : 'N/A'}
                </span>
              </div>

              {subscription.status === 'paused' && (
                <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2 py-1 text-gold">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Paused</span>
                </div>
              )}

              {subscription.status === 'unused' && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Unused</span>
                </div>
              )}

              {subscription.isSystemManaged && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2 py-1 text-muted-foreground text-xs">
                  <span>Managed by Renewly</span>
                </div>
              )}

              {subscription.coveredByFamily && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald/10 px-2 py-1 text-emerald text-xs">
                  <span>Covered by Family</span>
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
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const preferredLanguage = notificationSettings.language || 'en'
  const { rates } = useExchangeRates()
  const displayAmount = formatSubscriptionMoney(subscription, preferredCurrency, preferredLanguage, rates)

  return (
    <motion.div
      whileHover={{ scale: 1.01, x: 4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="relative overflow-visible cursor-pointer rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-4">
        <SubscriptionIcon
          name={subscription.name}
          fallbackColor={subscription.color}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{subscription.name}</p>
          <p className="text-xs text-muted-foreground">{subscription.category}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold text-foreground">
            {displayAmount}
          </p>
          <p className={cn('text-xs', isUrgent ? 'text-crimson' : 'text-muted-foreground')}>
            {subscription.renewalDate
              ? daysUntilRenewal === 0
                ? 'Due today'
                : `${daysUntilRenewal}d left`
              : 'N/A'}
          </p>
        </div>

        {!isRenewlyManagedSubscription(subscription) && (
          <div
            className="relative z-30 shrink-0 rounded-lg p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <SubscriptionActions subscription={subscription} onEdit={onEdit} />
          </div>
        )}
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
