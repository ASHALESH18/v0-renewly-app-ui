'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Search,
  ArrowUpRight,
  Zap,
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
  onNotificationClick,
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

  const subscriptions = useStore((state) => state.subscriptions)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const currencySymbol = getCurrencySymbol(preferredCurrency, preferredLanguage)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)
  const hasHydratedFromCloud = useStore((state) => state.hasHydratedFromCloud)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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

  const upcoming = useMemo(() => getUpcomingRenewals(subscriptions, 30), [subscriptions])

  const categories = [...new Set(subscriptions.map((sub) => sub.category))]
  const filterChips = [
    { id: 'all', label: 'All', count: subscriptions.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    ...categories.map((category) => ({
      id: category,
      label: category,
      count: subscriptions.filter((sub) => sub.category === category).length,
    })),
  ]

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'upcoming') {
      const days = getDaysUntil(sub.renewalDate || '')
      return days <= 7 && days > 0
    }
    return sub.category === selectedFilter
  })

  const displayedSubscriptions = filteredSubscriptions.filter((sub) =>
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted || isHydratingUserData || !hasHydratedFromCloud) {
    return null
  }

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <Header showProfile onSearchClick={() => setShowSearch(true)} />

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="space-y-6 px-4 pb-8 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 36, filter: 'blur(12px)', scale: 0.985 }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden rounded-[32px]"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,249,0.68),rgba(248,241,231,0.48))] dark:bg-[linear-gradient(180deg,rgba(19,22,28,0.76),rgba(10,12,17,0.70))]" />
            <div
              className="absolute -top-20 right-6 h-64 w-64 rounded-full blur-[110px]"
              style={{ background: 'radial-gradient(circle, rgba(199, 163, 106, 0.10) 0%, transparent 72%)' }}
            />
            <div
              className="absolute -bottom-16 left-4 h-56 w-56 rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(46, 94, 82, 0.08) 0%, transparent 74%)' }}
            />
            <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/16 to-transparent" />
          </div>

          <div className="relative rounded-[32px] border border-gold/10 glass-premium p-8 shadow-card md:p-10">
            <div className="mb-8 flex items-center gap-2">
              <div className="flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/8 px-4 py-2 backdrop-blur-sm">
                <motion.div
                  className="relative h-2.5 w-2.5"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="absolute inset-0 rounded-full bg-gold" />
                  <span className="absolute inset-0 rounded-full bg-gold blur-sm" />
                </motion.div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Financial Command Center
                </span>
              </div>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.22, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-gold/15 bg-card/40 p-6 backdrop-blur-xl"
              >
                <p className="mb-3 text-sm font-medium text-muted-foreground">Monthly Spend</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-gold md:text-5xl">
                    {currencySymbol}
                    <AnimatedNumber value={Math.round(metrics.totalMonthly)} language={preferredLanguage} />
                  </span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1.5 text-sm text-emerald">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-medium">12% vs last month</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.32, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-border/50 bg-card/40 p-6 backdrop-blur-xl"
              >
                <p className="mb-3 text-sm font-medium text-muted-foreground">Annual Projected</p>
                <p className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  {currencySymbol}
                  <AnimatedNumber value={Math.round(metrics.totalYearly)} language={preferredLanguage} />
                </p>
                <p className="mt-4 text-sm text-muted-foreground">Based on current spend</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.42, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-emerald/20 bg-gradient-to-br from-emerald/8 to-emerald/3 p-6 backdrop-blur-xl"
              >
                <p className="mb-3 text-sm font-medium text-muted-foreground">Potential Savings</p>
                <p className="text-3xl font-bold tracking-tight text-emerald md:text-4xl">
                  {currencySymbol}
                  <AnimatedNumber value={Math.round(metrics.savingsPotential)} language={preferredLanguage} />
                  <span className="ml-1 text-lg text-muted-foreground">/mo</span>
                </p>
                <p className="mt-4 text-sm font-medium text-emerald">Review unused subscriptions</p>
              </motion.div>
            </div>

            <div className="flex items-center justify-between border-t border-glass-border pt-6">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full bg-gold/10 blur-md opacity-70" />
                  <svg className="relative h-full w-full -rotate-90 transform">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(199,163,106,0.10)" strokeWidth="4" />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#dashboardHealthGradient)"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - metrics.leakScore / 100) }}
                      transition={{ delay: 0.64, duration: 1.8, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="dashboardHealthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
                  <p className="mb-1 text-sm text-muted-foreground">Subscription Health Score</p>
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
                className="hidden items-center gap-2 rounded-xl border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/15 sm:flex"
              >
                View Report
                <ArrowUpRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(199, 163, 106, 0.12)' }}
          className="group relative overflow-hidden rounded-2xl cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-card to-emerald/5 dark:from-gold/10 dark:via-graphite dark:to-emerald/5" />
          <div className="relative rounded-2xl border border-gold/15 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gradient-to-br from-gold/20 to-gold/10">
                    <Zap className="h-6 w-6 text-gold" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold text-foreground">AI Insight</p>
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold">New</span>
                  </div>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                    {metrics.leakScore > 0
                      ? `You could save ${formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)} monthly by reviewing unused subscriptions.`
                      : 'All your subscriptions are being actively used. Great job!'}
                  </p>
                </div>
              </div>
              <motion.div className="rounded-lg bg-gold/10 p-2 text-gold transition-colors group-hover:bg-gold/20" whileHover={{ x: 2 }}>
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Subscriptions</h2>
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

        <StaggerList className="space-y-3">
          {displayedSubscriptions.map((subscription, index) =>
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
          )}
        </StaggerList>

        {displayedSubscriptions.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {subscriptions.length === 0 ? 'No subscriptions yet' : 'No subscriptions match your search'}
            </p>
          </motion.div>
        )}

        {upcoming.length > 0 && (
          <div className="pt-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Upcoming Renewals</h2>
              <button className="text-sm font-medium text-gold transition-colors hover:text-gold/80">
                View all
              </button>
            </div>

            <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
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

function UpcomingCard({
  subscription,
  preferredCurrency,
  preferredLanguage,
}: {
  subscription: Subscription
  index: number
  preferredCurrency: string
  preferredLanguage: string
}) {
  const daysUntil = getDaysUntil(subscription.renewalDate || '')
  const isUrgent = daysUntil <= 3

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'rounded-2xl border p-4 transition-all',
        isUrgent ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold text-white"
            style={{ backgroundColor: subscription.color || '#7c6a46' }}
          >
            {subscription.logo || subscription.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{subscription.name}</p>
            <p className="text-sm text-muted-foreground">
              {daysUntil === 0 ? 'Due today' : `${daysUntil} days left`}
            </p>
          </div>
        </div>

        <span className="whitespace-nowrap font-semibold text-foreground">
          {formatMoney(subscription.amount, subscription.currency || preferredCurrency, preferredLanguage)}
        </span>
      </div>
    </motion.div>
  )
}

function AnimatedNumber({ value, language = 'en' }: { value: number; language?: string }) {
  const displayValue = useCountUp(value, 1500, 0)
  return <>{formatNumberForLocale(displayValue, language)}</>
}

function getDaysUntil(dateStr: string) {
  if (!dateStr) return 0
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}