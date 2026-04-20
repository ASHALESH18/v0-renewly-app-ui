'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Search,
  ArrowUpRight,
  Zap
} from 'lucide-react'
import { Header, SearchOverlay } from '@/components/header'
import { MetricCard } from '@/components/metric-card'
import { SubscriptionCard, SubscriptionCardCompact } from '@/components/subscription-card'
import { FilterChips, SegmentedControl } from '@/components/filter-chips'
import { PageTransition, StaggerList, staggerItem } from '@/components/motion'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks/use-count-up'
import type { Subscription } from '@/lib/types'
import { formatMoney, formatNumberForLocale, getCurrencySymbol } from '@/lib/preferences-format'
import { calculateMetrics, getUpcomingRenewals } from '@/lib/subscription-math'

// Fast, performant transition - no spring physics overhead
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] }

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

  // Get data from store
  const subscriptions = useStore((state) => state.subscriptions)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const currencySymbol = getCurrencySymbol(preferredCurrency, preferredLanguage)


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

  return (
    <PageTransition className="min-h-screen bg-transparent">
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
        {/* Command Center Hero - static, no animation for instant render */}
        <div className="rounded-2xl overflow-hidden relative">
          {/* Subtle background treatment */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,254,250,0.75),rgba(248,244,236,0.60))] dark:bg-[linear-gradient(180deg,rgba(17,20,24,0.80),rgba(8,9,12,0.75))]" />

            <div
              className="absolute -top-16 right-4 w-48 h-48 rounded-full blur-[80px]"
              style={{ background: 'radial-gradient(circle, rgba(176, 132, 64, 0.06) 0%, transparent 70%)' }}
            />

            <div
              className="absolute -bottom-12 left-4 w-40 h-40 rounded-full blur-[90px]"
              style={{ background: 'radial-gradient(circle, rgba(61, 107, 88, 0.05) 0%, transparent 70%)' }}
            />

            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/12 to-transparent" />
          </div>

          <div className="relative glass-premium border border-gold/8 p-6 md:p-8 shadow-md">
            {/* Command Center eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-6"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/6 border border-gold/15 backdrop-blur-sm">
                <div className="relative w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-gold" />
                </div>
                <span className="text-[10px] font-semibold text-gold tracking-wider uppercase">
                  Financial Command Center
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-card/50 backdrop-blur-xl border border-gold/12 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(176, 132, 64, 0.05) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Monthly Spend</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-semibold text-gold tracking-tight">
                      {currencySymbol}
                      <AnimatedNumber value={Math.round(metrics.totalMonthly)} language={preferredLanguage} />
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/8 border border-emerald/15 text-emerald text-xs">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="font-medium">12% vs last month</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(168, 174, 184, 0.03) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Annual Projected</p>
                  <p className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                    {currencySymbol}
                    <AnimatedNumber value={Math.round(metrics.totalYearly)} language={preferredLanguage} />
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">Based on current spend</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.29, duration: 0.4 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-gradient-to-br from-emerald/6 to-emerald/2 backdrop-blur-xl border border-emerald/15 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(61, 107, 88, 0.06) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Potential Savings</p>
                  <p className="text-2xl md:text-3xl font-semibold text-emerald tracking-tight">
                    {currencySymbol}
                    <AnimatedNumber value={Math.round(metrics.savingsPotential)} language={preferredLanguage} />
                    <span className="text-sm text-muted-foreground ml-1">/mo</span>
                  </p>
                  <p className="mt-3 text-xs text-emerald font-medium">Review unused subscriptions</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between pt-6 border-t border-glass-border"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-gold/10 blur-md opacity-70" />
                  <svg className="relative w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(199,163,106,0.1)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#healthGradient)"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 28 * (1 - metrics.leakScore / 100)
                      }}
                      transition={{ delay: 0.7, duration: 1.8, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C7A36A" />
                        <stop offset="100%" stopColor="#2E5E52" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">
                    {metrics.leakScore}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Subscription Health Score</p>
                  <p className="text-base font-semibold text-foreground">
                    {metrics.leakScore > 70
                      ? 'Needs Attention'
                      : metrics.leakScore > 40
                        ? 'Some Optimization Possible'
                        : 'Well Optimized'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold text-sm font-medium border border-gold/20 hover:bg-gold/15 transition-colors cursor-pointer"
              >
                View Report
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>

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

        {/* Premium Quick Insights Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(199, 163, 106, 0.15)' }}
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-card to-emerald/5 dark:from-gold/10 dark:via-graphite dark:to-emerald/5" />

          {/* Animated light sweep */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.8 }}
          />

          {/* Content */}
          <div className="relative border border-gold/15 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20">
                  <Zap className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">AI Insight</p>
                    <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider">New</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    {metrics.leakScore > 0
                      ? `You could save ${formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)} monthly by reviewing unused subscriptions.`
                      : 'All your subscriptions are being actively used. Great job!'}
                  </p>
                </div>
              </div>
              <motion.div
                className="p-2 rounded-lg bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors"
                whileHover={{ x: 2 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </div>
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
                key={subscription.id}
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
                transition={{ ...fastTransition, delay: index * 0.03 }}
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

interface AnimatedNumberProps {
  value: number
  language?: string
}

function AnimatedNumber({ value, language = 'en' }: AnimatedNumberProps) {
  const displayValue = useCountUp(value, 1500, 0)
  return <>{formatNumberForLocale(displayValue, language)}</>
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
