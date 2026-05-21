'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatMoney, formatSubscriptionMoney } from '@/lib/preferences-format'
import { useExchangeRates } from '@/lib/hooks/use-exchange-rates'
import { calculateMetrics, toMonthlyAmount } from '@/lib/subscription-math'
import {
  Share2,
  Download,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition, springs, staggerItem, StaggerList } from '@/components/motion'
import useStore from '@/lib/store'
import { useCountUp } from '@/lib/hooks/use-count-up'
import { cn } from '@/lib/utils'
import { getLeakStatusConfig, getLeakStatusLabel } from '@/lib/leak-status-config'

export function LeakReportScreen({
  onNavigateTab,
  onProfileClick
}: {
  onNavigateTab?: (tab: string) => void
  onProfileClick?: () => void
} = {}) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get live data from store
  const subscriptions = useStore((state) => state.subscriptions)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const { rates } = useExchangeRates()

  // Memoize metrics calculation to prevent infinite loop
  const metrics = useMemo(() => {
    const calculated = calculateMetrics(subscriptions, preferredCurrency, rates)

    return {
      totalMonthly: calculated.totalMonthlySpend,
      totalYearly: calculated.totalYearlySpend,
      savingsPotential: calculated.savingsPotential,
    }
  }, [subscriptions, preferredCurrency, rates])

  // Calculate leak data
  const leakData = (() => {
    const categories: Record<string, number> = {}
    let mostExpensiveCategory = ''
    let mostExpensiveAmount = 0
    let overallScore = 100

    subscriptions.forEach(sub => {
      const monthlyAmount = toMonthlyAmount(sub, preferredCurrency, rates)
      categories[sub.category] = (categories[sub.category] || 0) + monthlyAmount
      if (monthlyAmount > mostExpensiveAmount) {
        mostExpensiveAmount = monthlyAmount
        mostExpensiveCategory = sub.category
      }
      if (sub.status === 'unused') overallScore -= 20
      if (sub.status === 'paused') overallScore -= 5
    })

    const unusedSubscriptions = subscriptions.filter(sub => sub.status === 'unused')

    return {
      overallScore: Math.max(0, overallScore),
      categorySpending: Object.entries(categories).map(([category, amount]) => ({
        category,
        amount,
        percentage: metrics.totalMonthly > 0
          ? (amount / metrics.totalMonthly) * 100
          : 0,
      })),
      mostExpensiveCategory,
      unusedSubscriptionsCount: unusedSubscriptions.length,
      potentialSavings: unusedSubscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub, preferredCurrency, rates), 0),
    }
  })()

  // Calculate upcoming renewals
  const upcoming = subscriptions
    .filter(sub => {
      const daysUntilRenewal = Math.ceil(
        (new Date(sub.nextRenewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      return daysUntilRenewal <= 30 && daysUntilRenewal > 0
    })
    .sort((a, b) => new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime())

  if (!mounted) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <Header
          title="Leak Report"
          subtitle="Loading..."
          showSearch={false}
          showNotifications={false}
        />
        <div className="px-4 lg:px-6 py-16 text-center">
          <p className="text-muted-foreground">Analyzing your subscriptions...</p>
        </div>
      </PageTransition>
    )
  }

  // Calculate insights
  const unusedSubs = subscriptions.filter(s => s.status === 'unused')
  const pausedSubs = subscriptions.filter(s => s.status === 'paused')
  const activeSubs = subscriptions.filter(s => s.status === 'active')

  const categoryCounts = activeSubs.reduce((acc, sub) => {
    acc[sub.category] = (acc[sub.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]
  const topCategoryCount = topCategory?.[1] ?? 0
  const topCategoryName = topCategory?.[0] ?? 'N/A'

  const categorySpends = subscriptions.reduce((acc, sub) => {
    if (sub.status === 'active') {
      const monthlyAmount = toMonthlyAmount(sub, preferredCurrency, rates)
      acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount
    }
    return acc
  }, {} as Record<string, number>)

  const topSpendCategory = Object.entries(categorySpends).sort(([, a], [, b]) => b - a)[0]
  const topSpendAmount = topSpendCategory?.[1] ?? 0

  // Generate observations
  const observations = generateObservations({
    leakScore: leakData.overallScore,
    unusedCount: unusedSubs.length,
    pausedCount: pausedSubs.length,
    activeCount: activeSubs.length,
    totalMonthly: metrics.totalMonthly,
    totalYearly: metrics.totalYearly,
    topCategory: topCategoryName,
    savingsPotential: metrics.savingsPotential,
    upcomingRenewalsCount: upcoming.length,
    preferredCurrency,
    preferredLanguage,
  })

  const handleShare = async () => {
    try {
      const shareText = `Renewly Leak Report: My subscription leak score is ${leakData.overallScore}/100. Monthly spend: ${formatMoney(metrics.totalMonthly, preferredCurrency, preferredLanguage)}. Annual projected: ${formatMoney(metrics.totalYearly, preferredCurrency, preferredLanguage)}. Potential savings: ${formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)}`

      if (navigator.share) {
        await navigator.share({
          title: 'Renewly Leak Report',
          text: shareText,
        })
      } else {
        handleCopy(shareText)
      }
    } catch (error) {
      console.log('[v0] Share cancelled or failed')
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scoreColor = leakData.overallScore >= 85
    ? 'text-emerald'
    : leakData.overallScore >= 70
      ? 'text-emerald-200'
      : leakData.overallScore >= 50
        ? 'text-gold'
        : leakData.overallScore >= 30
          ? 'text-amber-400'
          : 'text-crimson'

  const scoreLabel = getLeakStatusLabel(leakData.overallScore)
  const statusConfig = getLeakStatusConfig(leakData.overallScore)

  const AnimatedLeakScore = () => {
    const displayValue = useCountUp(leakData.overallScore, 2000, 0)
    return <span>{Math.round(displayValue)}</span>
  }

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <Header
        title="Leak Report"
        subtitle="Subscription exposure and security risk overview"
        showSearch={false}
        showNotifications={false}
      />

      <div className="px-4 lg:px-6 space-y-8 pb-8">
        {/* Premium Command Center Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative rounded-[28px] overflow-hidden"
        >
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,249,0.7),rgba(248,241,231,0.5))] dark:bg-[linear-gradient(180deg,rgba(19,22,28,0.78),rgba(10,12,17,0.72))]" />

            <div
              className="absolute -top-20 right-0 w-64 h-64 rounded-full blur-[110px]"
              style={{ background: 'radial-gradient(circle, rgba(199, 163, 106, 0.1) 0%, transparent 72%)' }}
            />

            <div
              className="absolute -bottom-16 -left-6 w-52 h-52 rounded-full blur-[110px]"
              style={{ background: 'radial-gradient(circle, rgba(46, 94, 82, 0.08) 0%, transparent 74%)' }}
            />

            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold/16 to-transparent" />
          </div>

          <div className="relative glass-premium border border-gold/10 p-8 md:p-12 shadow-card">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-12">
                <div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    className="text-sm font-medium text-gold mb-2 uppercase tracking-wider"
                  >
                    Your Leak Score
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35, duration: 0.55 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full font-semibold',
                      statusConfig.bgColor,
                      statusConfig.textColor,
                      statusConfig.borderColor,
                      'border',
                      statusConfig.glowStrength,
                      statusConfig.animationClass
                    )}
                  >
                    {scoreLabel}
                  </motion.div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="w-10 h-10 rounded-xl bg-slate/40 hover:bg-slate/60 flex items-center justify-center text-platinum hover:text-ivory transition-colors backdrop-blur-sm border border-gold/10"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(`Renewly Leak Report - Score: ${leakData.overallScore}/100`)}
                    className="w-10 h-10 rounded-xl bg-slate/40 hover:bg-slate/60 flex items-center justify-center text-platinum hover:text-ivory transition-colors backdrop-blur-sm border border-gold/10"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald" /> : <Copy className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>

              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, ...springs.bouncy }}
                  className="inline-block"
                >
                  <div className="text-center">
                    <div className="text-8xl md:text-9xl font-black text-gold mb-2 leading-none">
                      <AnimatedLeakScore />
                    </div>
                    <p className="text-sm font-medium text-platinum uppercase tracking-wider">
                      out of 100
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard
                  label="Monthly Recurring"
                  value={formatMoney(metrics.totalMonthly, preferredCurrency, preferredLanguage)}
                  icon="💳"
                  delay={0.5}
                />
                <MetricCard
                  label="Annual Projected"
                  value={formatMoney(metrics.totalYearly, preferredCurrency, preferredLanguage)}
                  icon="📊"
                  delay={0.6}
                />
                <MetricCard
                  label="Active Subscriptions"
                  value={activeSubs.length.toString()}
                  icon="✓"
                  delay={0.7}
                />
                <MetricCard
                  label="Potential Savings"
                  value={formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)}
                  icon="💰"
                  highlight
                  delay={0.8}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Honest capability notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springs.gentle }}
          className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Current report:</span> Based on your subscription and account signals. Breach monitoring can be connected later for real-time protection.
          </p>
        </motion.div>

        {/* Spend overview section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ...springs.gentle }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Spend Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <SpendCard
              label="Active Services"
              value={activeSubs.length}
              icon="🎯"
              color="emerald"
            />
            <SpendCard
              label="Unused Services"
              value={unusedSubs.length}
              icon="⚠️"
              color="crimson"
            />
            <SpendCard
              label="Paused Services"
              value={pausedSubs.length}
              icon="⏸️"
              color="gold"
            />
            <SpendCard
              label="Upcoming Renewals"
              value={upcoming.length}
              icon="📅"
              color="platinum"
            />
          </div>
        </motion.div>

        {/* Top spend category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, ...springs.gentle }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Top Spend Category</h2>
          <div className="rounded-2xl glass-strong p-6 border border-gold/20">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-platinum mb-2">{topSpendCategory?.[0]}</p>
                <p className="text-4xl font-bold text-gold">{formatMoney(Math.round(topSpendAmount), preferredCurrency, preferredLanguage)}</p>
                <p className="text-xs text-muted-foreground mt-1">{topCategoryCount} subscriptions</p>
              </div>
              <div className="text-right">
                <p className="text-2xl">📊</p>
                <p className="text-xs text-muted-foreground mt-2">{((topSpendAmount / metrics.totalMonthly) * 100).toFixed(0)}% of spend</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Observations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, ...springs.gentle }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="text-xl font-semibold text-foreground">Observations</h2>
          </div>

          <StaggerList className="space-y-3">
            {observations.map((observation, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                initial="initial"
                animate="animate"
                custom={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-gold/5 border border-gold/20"
              >
                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{observation}</p>
              </motion.div>
            ))}
          </StaggerList>
        </motion.div>

        {/* Risky subscriptions */}
        {unusedSubs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, ...springs.gentle }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-crimson" />
              <h2 className="text-xl font-semibold text-foreground">Flagged Subscriptions</h2>
            </div>

            <StaggerList className="space-y-3">
              {unusedSubs.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  variants={staggerItem}
                  initial="initial"
                  animate="animate"
                  custom={index}
                  className="flex items-center gap-4 p-4 rounded-2xl glass-strong border border-crimson/20 hover:border-crimson/40 transition-colors cursor-pointer group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: sub.color }}
                  >
                    {sub.logo}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">Unused • {sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-crimson">{formatSubscriptionMoney(sub, preferredCurrency, preferredLanguage, rates)}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </motion.div>
              ))}
            </StaggerList>
          </motion.div>
        )}

        {/* Upcoming renewals */}
        {upcoming.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, ...springs.gentle }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Renewals</h2>

            <StaggerList className="space-y-3">
              {upcoming.slice(0, 5).map((sub, index) => {
                const daysUntil = Math.ceil((new Date(sub.renewalDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <motion.div
                    key={sub.id}
                    variants={staggerItem}
                    initial="initial"
                    animate="animate"
                    custom={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:border-gold/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.logo}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">{daysUntil}d remaining</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gold">{formatSubscriptionMoney(sub, preferredCurrency, preferredLanguage, rates)}</span>
                  </motion.div>
                )
              })}
            </StaggerList>
          </motion.div>
        )}

        {/* Suggested actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, ...springs.gentle }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4">Suggested Actions</h2>
          <div className="space-y-3">
            {unusedSubs.length > 0 && (
              <ActionCard
                title="Review Unused Subscriptions"
                description={`You have ${unusedSubs.length} unused service${unusedSubs.length > 1 ? 's' : ''} that could be cancelled`}
                action="Review"
                onClick={() => onNavigateTab?.('dashboard')}
              />
            )}
            {upcoming.length > 3 && (
              <ActionCard
                title="Cluster of Renewals"
                description={`${upcoming.length} subscriptions renew in the next 30 days`}
                action="View Calendar"
                onClick={() => onNavigateTab?.('calendar')}
              />
            )}
            {topCategoryCount > 2 && (
              <ActionCard
                title="Category Concentration"
                description={`${topCategoryCount} ${topCategoryName} subscriptions might have overlaps`}
                action="Optimize"
                onClick={() => onNavigateTab?.('dashboard')}
              />
            )}
            <ActionCard
              title="Enable Leak Alerts"
              description="Get notified when new potential savings are detected"
              action="Enable"
              onClick={() => {
                // Navigate to settings with notifications section
                window.location.href = '/app/settings?section=notifications'
              }}
            />
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function MetricCard({
  label,
  value,
  icon,
  highlight = false,
  delay = 0
}: {
  label: string
  value: string
  icon: string
  highlight?: boolean
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ...springs.gentle }}
      className={cn(
        'p-4 rounded-xl border transition-colors',
        highlight
          ? 'bg-emerald/10 border-emerald/20'
          : 'bg-slate/40 border-gold/10'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={cn(
          'text-xs font-medium',
          highlight ? 'text-emerald' : 'text-platinum'
        )}>
          {label}
        </p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-lg font-bold text-ivory">
        {value}
      </p>
    </motion.div>
  )
}

function SpendCard({
  label,
  value,
  icon,
  color
}: {
  label: string
  value: number
  icon: string
  color: string
}) {
  const colorClasses = {
    emerald: 'bg-emerald/10 border-emerald/20',
    crimson: 'bg-crimson/10 border-crimson/20',
    gold: 'bg-gold/10 border-gold/20',
    platinum: 'bg-platinum/10 border-platinum/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.bouncy}
      className={cn('p-4 rounded-xl border', colorClasses[color as keyof typeof colorClasses])}
    >
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <span className="text-2xl">{icon}</span>
      </div>
    </motion.div>
  )
}

function ActionCard({
  title,
  description,
  action,
  onClick
}: {
  title: string
  description: string
  action: string
  onClick?: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      whileHover={{ x: 4 }}
      className="flex items-start justify-between p-4 rounded-xl glass-strong border border-gold/20 hover:border-gold/40 transition-colors cursor-pointer group w-full text-left"
    >
      <div>
        <p className="font-semibold text-foreground mb-1">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <motion.div
        whileHover={{ x: 4 }}
        className="flex items-center gap-2 text-gold shrink-0 group-hover:gap-3 transition-all"
      >
        <span className="text-sm font-medium">{action}</span>
        <ArrowRight className="w-4 h-4" />
      </motion.div>
    </motion.button>
  )
}

function generateObservations(data: {
  leakScore: number
  unusedCount: number
  pausedCount: number
  activeCount: number
  totalMonthly: number
  totalYearly: number
  topCategory: string
  savingsPotential: number
  upcomingRenewalsCount: number
  preferredCurrency: string
  preferredLanguage: string
}): string[] {
  const observations: string[] = []

  if (data.leakScore < 50) {
    observations.push(`Your subscription health shows significant optimization opportunities. You could potentially recover ${formatMoney(data.savingsPotential, data.preferredCurrency, data.preferredLanguage)} each month by reviewing flagged services.`)
  } else if (data.leakScore < 75) {
    observations.push(`There are opportunities to improve your subscription efficiency. Consider reviewing unused services to reduce your monthly spend.`)
  } else {
    observations.push(`Your subscriptions are well-optimized. Keep monitoring for new opportunities to save.`)
  }

  if (data.unusedCount > 0) {
    observations.push(`You have ${data.unusedCount} unused subscription${data.unusedCount > 1 ? 's' : ''} consuming ${formatMoney(data.savingsPotential, data.preferredCurrency, data.preferredLanguage)} monthly. These are prime candidates for cancellation.`)
  }

  if (data.topCategory && data.activeCount > 0) {
    const categoryPct = ((data.topCategory.length / data.activeCount) * 100).toFixed(0)
    observations.push(`${data.topCategory} subscriptions dominate your portfolio. Consider evaluating if all services in this category provide distinct value.`)
  }

  if (data.upcomingRenewalsCount > 3) {
    observations.push(`You have ${data.upcomingRenewalsCount} renewals coming in the next 30 days. Bundle these review sessions to make informed decisions about renewal strategy.`)
  }

  const annualVsMonthly = data.totalYearly / (data.totalMonthly * 12)
  if (annualVsMonthly > 1.15) {
    observations.push(`Your annual spend projection appears higher than monthly figures suggest. This indicates some subscriptions are billed annually, potentially offering better rates.`)
  }

  if (data.pausedCount > 0) {
    observations.push(`You have ${data.pausedCount} paused service${data.pausedCount > 1 ? 's' : ''}. Consider cancelling these completely if you haven't resumed them in 30 days.`)
  }

  return observations.slice(0, 5)
}
