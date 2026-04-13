'use client'

import React, { useState, useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
import { PageTransition, StaggerList, staggerItem, springs } from '@/components/motion'
import { AmbientBackground } from '@/components/premium/ambient-background'
import { PremiumSurface } from '@/components/premium/premium-surface'
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
        {/* Premium Command Center Hero */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-[28px] overflow-hidden relative"
          >
            {/* Cinematic ambient background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-secondary/50 dark:from-graphite dark:via-obsidian dark:to-slate/30" />
              
              {/* Animated glow orbs */}
              <motion.div
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px]"
                style={{ background: 'radial-gradient(circle, rgba(199, 163, 106, 0.2) 0%, transparent 70%)' }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-[80px]"
                style={{ background: 'radial-gradient(circle, rgba(46, 94, 82, 0.15) 0%, transparent 70%)' }}
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              />
              
              {/* Subtle grid pattern */}
              <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(199, 163, 106, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(199, 163, 106, 0.5) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
              />
              
              {/* Top highlight line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            {/* Glass surface */}
            <div className="relative glass-premium border border-gold/10 p-6 md:p-8">
              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mb-6"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-gold"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-gold tracking-wide uppercase">Financial Command Center</span>
                </div>
              </motion.div>

              {/* Main metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm text-muted-foreground mb-2">Monthly Spend</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-bold text-gold tracking-tight">
                      {currencySymbol}
                      <AnimatedNumber value={Math.round(metrics.totalMonthly)} language={preferredLanguage} />
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-emerald text-sm">
                    <TrendingDown className="w-4 h-4" />
                    <span>12% vs last month</span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground mb-2">Annual Projected</p>
                  <p className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                    {currencySymbol}
                    <AnimatedNumber value={Math.round(metrics.totalYearly)} language={preferredLanguage} />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Based on current spend</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative"
                >
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-emerald/5 to-transparent" />
                  <div className="relative">
                    <p className="text-sm text-muted-foreground mb-2">Potential Savings</p>
                    <p className="text-3xl md:text-4xl font-semibold text-emerald tracking-tight">
                      {currencySymbol}
                      <AnimatedNumber value={Math.round(metrics.savingsPotential)} language={preferredLanguage} />
                      <span className="text-lg text-muted-foreground">/mo</span>
                    </p>
                    <p className="mt-2 text-sm text-emerald/80">Review unused subscriptions</p>
                  </div>
                </motion.div>
              </div>

              {/* Health score section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-between pt-6 border-t border-glass-border"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    {/* Glow effect behind ring */}
                    <div className="absolute inset-0 rounded-full bg-gold/20 blur-lg animate-glow-pulse" />
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
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20">
                    <Zap className="w-6 h-6 text-gold" />
                  </div>
                  <motion.div
                    className="absolute -inset-1 rounded-xl bg-gold/20 blur-md -z-10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
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
