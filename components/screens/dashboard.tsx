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
        {/* DRAMATIC: Cinematic Command Center Hero */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(16px)', scale: 0.98 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-[32px] overflow-hidden relative"
          >
            {/* DRAMATIC: Full cinematic ambient background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-secondary/60 dark:from-graphite dark:via-obsidian dark:to-slate/40" />
              
              {/* DRAMATIC: Large animated gold orb - much bigger and more visible */}
              <motion.div
                className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full"
                style={{ 
                  background: 'radial-gradient(circle, rgba(199, 163, 106, 0.35) 0%, rgba(199, 163, 106, 0.1) 40%, transparent 70%)',
                  filter: 'blur(80px)'
                }}
                animate={{ 
                  scale: [1, 1.3, 1],
                  x: [0, 30, 0],
                  y: [0, 20, 0],
                  opacity: [0.3, 0.7, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* DRAMATIC: Emerald orb - bottom left */}
              <motion.div
                className="absolute -bottom-36 -left-36 w-[400px] h-[400px] rounded-full"
                style={{ 
                  background: 'radial-gradient(circle, rgba(46, 94, 82, 0.3) 0%, rgba(46, 94, 82, 0.08) 45%, transparent 70%)',
                  filter: 'blur(100px)'
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  x: [0, -20, 0],
                  y: [0, -30, 0],
                  opacity: [0.25, 0.5, 0.25]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
              />
              
              {/* DRAMATIC: Center spotlight pulse */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px]"
                style={{ 
                  background: 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.12) 0%, transparent 60%)'
                }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              
              {/* DRAMATIC: Light sweep across hero */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(115deg, transparent 0%, rgba(199, 163, 106, 0.06) 25%, rgba(199, 163, 106, 0.12) 50%, rgba(199, 163, 106, 0.06) 75%, transparent 100%)',
                  transform: 'skewX(-15deg)'
                }}
                animate={{ x: ['-150%', '150%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5 }}
              />
              
              {/* Grid pattern - more visible */}
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(199, 163, 106, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(199, 163, 106, 0.6) 1px, transparent 1px)',
                  backgroundSize: '50px 50px'
                }}
              />
              
              {/* Top highlight line - animated */}
              <motion.div 
                className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            
            {/* DRAMATIC: Premium glass surface with depth */}
            <div className="relative surface-cinematic p-8 md:p-10">
              {/* DRAMATIC: Glowing eyebrow badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 mb-8"
              >
                <div className="relative">
                  {/* Glow behind badge */}
                  <div className="absolute inset-0 rounded-full bg-gold/20 blur-md" />
                  <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-full bg-gold/10 border border-gold/25 backdrop-blur-sm">
                    <motion.div
                      className="relative w-2.5 h-2.5"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="absolute inset-0 rounded-full bg-gold" />
                      <span className="absolute inset-0 rounded-full bg-gold blur-sm" />
                    </motion.div>
                    <span className="text-xs font-semibold text-gold tracking-wider uppercase">Financial Command Center</span>
                  </div>
                </div>
              </motion.div>

              {/* DRAMATIC: Premium metrics grid with floating cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-10">
                {/* Monthly Spend - Primary metric with glow */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.6 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-gold/15 group"
                >
                  {/* Ambient glow on hover */}
                  <motion.div
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(circle at center, rgba(199, 163, 106, 0.15) 0%, transparent 70%)' }}
                  />
                  <div className="relative">
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Monthly Spend</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-bold text-gold tracking-tight">
                        {currencySymbol}
                        <AnimatedNumber value={Math.round(metrics.totalMonthly)} language={preferredLanguage} />
                      </span>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-sm">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium">12% vs last month</span>
                    </div>
                  </div>
                </motion.div>
                
                {/* Annual Projected */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.35, duration: 0.6 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 group"
                >
                  <motion.div
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(circle at center, rgba(188, 194, 204, 0.08) 0%, transparent 70%)' }}
                  />
                  <div className="relative">
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Annual Projected</p>
                    <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                      {currencySymbol}
                      <AnimatedNumber value={Math.round(metrics.totalYearly)} language={preferredLanguage} />
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">Based on current spend</p>
                  </div>
                </motion.div>
                
                {/* Potential Savings - with emerald glow */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald/8 to-emerald/3 backdrop-blur-xl border border-emerald/20 group"
                >
                  {/* Emerald glow effect */}
                  <motion.div
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'radial-gradient(circle at center, rgba(46, 94, 82, 0.2) 0%, transparent 70%)' }}
                  />
                  <div className="relative">
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Potential Savings</p>
                    <p className="text-3xl md:text-4xl font-bold text-emerald tracking-tight">
                      {currencySymbol}
                      <AnimatedNumber value={Math.round(metrics.savingsPotential)} language={preferredLanguage} />
                      <span className="text-lg text-muted-foreground ml-1">/mo</span>
                    </p>
                    <p className="mt-4 text-sm text-emerald font-medium">Review unused subscriptions</p>
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
