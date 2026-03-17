'use client'

import React, { useState } from 'react'
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
import useStore, { selectMetrics, selectUpcomingRenewals } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/lib/hooks/use-count-up'

const viewSegments = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
]

export function DashboardScreen() {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [mounted, setMounted] = useState(false)

  // Get data from store
  const subscriptions = useStore((state) => state.subscriptions)
  const metrics = selectMetrics(useStore.getState())
  const upcoming = selectUpcomingRenewals(useStore.getState())

  // Prevent hydration mismatch
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

  return (
    <PageTransition className="min-h-screen">
      <Header 
        showProfile
        notificationCount={0}
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
                  prefix="₹"
                  delay={0.2}
                />
                <AnimatedMetricItem
                  label="Annual Projected"
                  value={Math.round(metrics.totalYearly)}
                  prefix="₹"
                  delay={0.3}
                />
                <AnimatedMetricItem
                  label="Potential Savings"
                  value={Math.round(metrics.savingsPotential)}
                  prefix="₹"
                  suffix="/month"
                  delay={0.4}
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
                      stroke="rgba(255,255,255,0.1)"
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
            prefix="₹"
            change={-12}
            changeLabel="vs last month"
            icon={CreditCard}
            iconColor="#C7A36A"
            index={0}
          />
          <MetricCard
            title="Yearly Projected"
            value={Math.round(metrics.totalYearly)}
            prefix="₹"
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
            prefix="₹"
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
                    ? `You could save ₹${metrics.savingsPotential} monthly by reviewing unused subscriptions.`
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
                key={subscription.id}
                subscription={subscription}
                index={index}
              />
            ) : (
              <motion.div
                key={subscription.id}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                custom={index}
                transition={{ ...springs.gentle, delay: index * 0.05 }}
              >
                <SubscriptionCardCompact subscription={subscription} />
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
                <UpcomingCard key={sub.id} subscription={sub} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

interface UpcomingCardProps {
  subscription: any
  index: number
}

function UpcomingCard({ subscription, index }: UpcomingCardProps) {
  const daysUntil = getDaysUntil(subscription.renewalDate || '')
  const isUrgent = daysUntil <= 3

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.1, ...springs.gentle }}
      whileHover={{ y: -2 }}
      className={cn(
        'flex-shrink-0 w-36 p-4 rounded-xl border cursor-pointer transition-all',
        isUrgent 
          ? 'bg-crimson/10 border-crimson/20 hover:border-crimson/40' 
          : 'bg-card border-border hover:border-gold/40'
      )}
    >
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm mb-3"
        style={{ backgroundColor: subscription.color || '#C7A36A' }}
      >
        {subscription.logo || subscription.name.charAt(0)}
      </div>
      <p className="font-medium text-foreground text-sm truncate">
        {subscription.name}
      </p>
      <p className={cn(
        'text-xs mt-1',
        isUrgent ? 'text-crimson' : 'text-muted-foreground'
      )}>
        {daysUntil === 0 ? 'Due today' : `${daysUntil} days left`}
      </p>
      <p className="text-sm font-semibold text-foreground mt-2">
        ₹{subscription.amount.toLocaleString('en-IN')}
      </p>
    </motion.div>
  )
}

interface AnimatedMetricItemProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  delay?: number
}

function AnimatedMetricItem({ 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  delay = 0 
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
        {prefix}{displayValue.toLocaleString('en-IN')}{suffix && <span className="text-lg text-muted-foreground ml-1">{suffix}</span>}
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
