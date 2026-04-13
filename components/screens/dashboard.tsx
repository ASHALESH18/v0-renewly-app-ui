'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Search
} from 'lucide-react'
import { Header, SearchOverlay } from '@/components/header'
import { MetricCard } from '@/components/metric-card'
import { SubscriptionCard, SubscriptionCardCompact } from '@/components/subscription-card'
import { FilterChips, SegmentedControl } from '@/components/filter-chips'
import { PageTransition, StaggerList, staggerItem, springs } from '@/components/motion'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks/use-count-up'
import type { Subscription } from '@/lib/types'
import { formatMoney, formatNumberForLocale, getCurrencySymbol } from '@/lib/preferences-format'
import { calculateMetrics, getUpcomingRenewals } from '@/lib/subscription-math'

const viewSegments = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
]

export function DashboardScreen({
  onSubscriptionSelect,
  onNavigateTab,
  onProfileClick,
  onNotificationClick
}: {
  onSubscriptionSelect?: (subscription: Subscription) => void
  onNavigateTab?: (tab: string) => void
  onProfileClick?: () => void
  onNotificationClick?: () => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [mounted, setMounted] = useState(false)

  // Get data from store
  const subscriptions = useStore((state) => state.subscriptions)
  const addToast = useStore((state) => state.addToast)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const currencySymbol = getCurrencySymbol(preferredCurrency, preferredLanguage)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)
  const hasHydratedFromCloud = useStore((state) => state.hasHydratedFromCloud)


  // Memoize metrics calculation to prevent infinite loops
  const metrics = useMemo(() => {
    const m = calculateMetrics(subscriptions)

    return {
      totalMonthly: m.totalMonthlySpend,
      totalYearly: m.totalYearlySpend,
      activeSubscriptions: m.activeCount,
      savingsPotential: m.savingsPotential,
      leakScore: m.leakScore,
    }
  }, [subscriptions])

  // Calculate upcoming renewals
  const upcoming = useMemo(() => {
    return getUpcomingRenewals(subscriptions, 30)
  }, [subscriptions])

  // Prevent hydration mismatch - only render dynamic content after mount AND store is ready
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Build filter chips dynamically from subscriptions
  const categories = [...new Set(subscriptions.map(s => s.category))]
  const filterChips = [
    { id: 'all', label: 'All', count: subscriptions.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    ...categories.map(cat => ({
      id: cat,
      label: cat,
      count: subscriptions.filter(s => s.category === cat).length
    }))
  ]

  // Filter subscriptions based on selected filter
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'upcoming') {
      const days = getDaysUntil(sub.renewalDate || '')
      return days <= 7 && days > 0
    }
    return sub.category === selectedFilter
  })

  // Filter by search query
  const displayedSubscriptions = filteredSubscriptions.filter(sub =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Early return: Don't render any content until store is hydrated
  // This prevents blank page states and ensures all data is available
  if (!mounted) {
    return null
  }

  return (
    <PageTransition className="min-h-screen">
      <Header
        showProfile
        onSearchClick={() => setShowSearch(true)}
      />

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {/* Premium hero card with animated metrics */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springs.gentle}
            className="rounded-3xl glass-strong p-6 md:p-8 overflow-hidden relative"
          >
            {/* Animated background gradient accent */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gold/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-gold mb-2"
              >
                Your Financial Overview
              </motion.h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                <AnimatedMetricItem
                  label="Monthly Spend"
                  value={Math.round(metrics.totalMonthly)}
                  prefix={currencySymbol}
                  delay={0.2}
                  language={preferredLanguage}
                />
                <AnimatedMetricItem
                  label="Annual Projected"
                  value={Math.round(metrics.totalYearly)}
                  prefix={currencySymbol}
                  delay={0.3}
                  language={preferredLanguage}
                />
                <AnimatedMetricItem
                  label="Potential Savings"
                  value={Math.round(metrics.savingsPotential)}
                  prefix={currencySymbol}
                  suffix="/month"
                  delay={0.4}
                  language={preferredLanguage}
                />
              </div>

              {/* Leak score indicator */}
              <div className="flex items-center justify-between pt-6 border-t border-glass-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Subscription Health</p>
                  <p className="text-lg font-semibold text-foreground">
                    {metrics.leakScore > 70
                      ? '🚨 Review Subscriptions'
                      : metrics.leakScore > 40
                        ? '⚠️ Some Unused Services'
                        : '✓ Well Optimized'}
                  </p>
                </div>
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(192,142,75,0.16)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="#C7A36A"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 28 * (1 - metrics.leakScore / 100)
                      }}
                      transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {metrics.leakScore}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Metrics grid */}
        <StaggerList className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Monthly Recurring"
            value={Math.round(metrics.totalMonthly)}
            prefix={currencySymbol}
            change={-12}
            changeLabel="vs last month"
            icon={CreditCard}
            iconColor="#C7A36A"
            index={0}
          />
          <MetricCard
            title="Yearly Projected"
            value={Math.round(metrics.totalYearly)}
            prefix={currencySymbol}
            icon={Calendar}
            iconColor="#2E5E52"
            index={1}
          />
          <MetricCard
            title="Active Subscriptions"
            value={metrics.activeSubscriptions}
            suffix=" services"
            icon={Sparkles}
            iconColor="#BCC2CC"
            index={2}
          />
          <MetricCard
            title="Possible Savings"
            value={Math.round(metrics.savingsPotential)}
            prefix={currencySymbol}
            suffix="/mo"
            icon={TrendingDown}
            iconColor="#2E5E52"
            index={3}
            variant="emerald"
          />
        </StaggerList>

        {/* Quick insights card */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 p-4 cursor-pointer hover:from-gold/15 hover:to-gold/10 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Smart Insight</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.leakScore > 0
                    ? `You could save ${formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)} monthly by reviewing unused subscriptions.`
                    : 'All your subscriptions are being actively used. Great job!'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gold shrink-0" />
          </div>
        </motion.div>

        {/* Filters section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Your Subscriptions
            </h2>
            <SegmentedControl
              segments={viewSegments}
              selectedSegment={viewMode}
              onSegmentSelect={setViewMode}
            />
          </div>

          <FilterChips
            chips={filterChips}
            selectedChip={selectedFilter}
            onChipSelect={setSelectedFilter}
          />
        </div>

        {/* Subscriptions list */}
        <StaggerList className="space-y-3">
          {displayedSubscriptions.map((subscription, index) => (
            viewMode === 'cards' ? (
              <SubscriptionCard
                subscription={subscription}
                index={index}
                onClick={() => onSubscriptionSelect?.(subscription)}
                onEdit={() => onSubscriptionSelect?.(subscription)}
              />
            ) : (
              <motion.div
                key={subscription.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                custom={index}
                transition={{ ...springs.gentle, delay: index * 0.05 }}
                onClick={() => onSubscriptionSelect?.(subscription)}
                className="cursor-pointer"
              >
                <SubscriptionCardCompact
                  subscription={subscription}
                  onClick={() => onSubscriptionSelect?.(subscription)}
                  onEdit={() => onSubscriptionSelect?.(subscription)}
                />
              </motion.div>
            )
          ))}
        </StaggerList>

        {displayedSubscriptions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {subscriptions.length === 0 ? 'No subscriptions yet' : 'No subscriptions match your search'}
            </p>
          </motion.div>
        )}

        {/* Upcoming renewals section */}
        {upcoming.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Upcoming Renewals
              </h2>
              <button className="text-sm text-gold font-medium cursor-pointer hover:text-gold/80 transition-colors">
                View all
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {upcoming.slice(0, 5).map((sub, index) => (
                <UpcomingCard
                  key={sub.id || `${sub.name}-${sub.renewalDate}-${index}`}
                  subscription={sub}
                  index={index}
                  preferredCurrency={preferredCurrency}
                  preferredLanguage={preferredLanguage}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

interface UpcomingCardProps {
  subscription: Subscription
  index: number
  preferredCurrency: string
  preferredLanguage: string
}

function UpcomingCard({
  subscription,
  index,
  preferredCurrency,
  preferredLanguage,
}: UpcomingCardProps) {
  const daysUntil = getDaysUntil(subscription.renewalDate || '')
  const isUrgent = daysUntil <= 3

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'rounded-2xl border p-4 transition-all',
        isUrgent
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shrink-0"
            style={{ backgroundColor: subscription.color || '#7c6a46' }}
          >
            {subscription.logo || subscription.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{subscription.name}</p>
            <p className="text-sm text-muted-foreground">
              {daysUntil === 0 ? 'Due today' : `${daysUntil} days left`}
            </p>
          </div>
        </div>

        <span className="font-semibold text-foreground whitespace-nowrap">
          {formatMoney(
            subscription.amount,
            subscription.currency || preferredCurrency,
            preferredLanguage
          )}
        </span>
      </div>
    </motion.div>
  )
}

interface AnimatedMetricItemProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  delay?: number
  language?: string
}

function AnimatedMetricItem({
  label,
  value,
  prefix = '',
  suffix = '',
  delay = 0,
  language = 'en'
}: AnimatedMetricItemProps) {
  const displayValue = useCountUp(value, 1500, delay * 1000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...springs.gentle }}
    >
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-3xl font-bold text-gold">
        {prefix}
        {formatNumberForLocale(displayValue, language)}
        {suffix || ''}
      </p>
    </motion.div>
  )
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
