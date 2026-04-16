'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Copy,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition, springs } from '@/components/motion'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { formatMoney } from '@/lib/preferences-format'
import { useCountUp } from '@/lib/hooks/use-count-up'

interface LeakReportScreenProps {
  onNavigateTab?: (tab: string) => void
  onProfileClick?: () => void
}

export function LeakReportScreen({
  onNavigateTab,
  onProfileClick,
}: LeakReportScreenProps) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  const subscriptions = useStore((state) => state.subscriptions)
  const notificationSettings = useStore((state) => state.notificationSettings)

  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'active'),
    [subscriptions]
  )

  const unusedSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'unused'),
    [subscriptions]
  )

  const pausedSubscriptions = useMemo(
    () => subscriptions.filter((sub) => sub.status === 'paused'),
    [subscriptions]
  )

  const flaggedSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (sub) => sub.status === 'unused' || sub.status === 'paused'
      ),
    [subscriptions]
  )

  const monthlySpend = useMemo(
    () => activeSubscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0),
    [activeSubscriptions]
  )

  const yearlySpend = useMemo(() => monthlySpend * 12, [monthlySpend])

  const savingsPotential = useMemo(
    () => unusedSubscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0),
    [unusedSubscriptions]
  )

  const categorySpending = useMemo(() => {
    const buckets: Record<string, number> = {}

    activeSubscriptions.forEach((sub) => {
      buckets[sub.category] = (buckets[sub.category] || 0) + toMonthlyAmount(sub)
    })

    return buckets
  }, [activeSubscriptions])

  const topCategoryEntry = useMemo(() => {
    const entries = Object.entries(categorySpending)
    if (!entries.length) return null
    return entries.sort((a, b) => b[1] - a[1])[0]
  }, [categorySpending])

  const upcomingRenewals = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        if (!sub.renewalDate || sub.status !== 'active') return false
        const days = getDaysUntil(sub.renewalDate)
        return days > 0 && days <= 30
      })
      .sort((a, b) => {
        const aTime = a.renewalDate
          ? new Date(a.renewalDate).getTime()
          : Number.MAX_SAFE_INTEGER
        const bTime = b.renewalDate
          ? new Date(b.renewalDate).getTime()
          : Number.MAX_SAFE_INTEGER
        return aTime - bTime
      })
  }, [subscriptions])

  const leakScore = useMemo(() => {
    let score = 100

    score -= unusedSubscriptions.length * 18
    score -= pausedSubscriptions.length * 7

    if (topCategoryEntry && monthlySpend > 0) {
      const [, topAmount] = topCategoryEntry
      const ratio = topAmount / monthlySpend
      if (ratio > 0.45) score -= 8
    }

    if (upcomingRenewals.length >= 4) score -= 4
    if (activeSubscriptions.length >= 10) score -= 4

    return clamp(Math.round(score), 0, 100)
  }, [
    unusedSubscriptions.length,
    pausedSubscriptions.length,
    topCategoryEntry,
    monthlySpend,
    upcomingRenewals.length,
    activeSubscriptions.length,
  ])

  const scoreLabel =
    leakScore >= 80
      ? 'Stable'
      : leakScore >= 60
        ? 'Needs Review'
        : 'High Leakage'

  const scoreTone =
    leakScore >= 80
      ? 'text-emerald border-emerald/20 bg-emerald/10'
      : leakScore >= 60
        ? 'text-gold border-gold/20 bg-gold/10'
        : 'text-crimson border-crimson/20 bg-crimson/10'

  const observations = useMemo(
    () =>
      generateObservations({
        leakScore,
        unusedCount: unusedSubscriptions.length,
        pausedCount: pausedSubscriptions.length,
        activeCount: activeSubscriptions.length,
        totalMonthly: monthlySpend,
        totalYearly: yearlySpend,
        topCategory: topCategoryEntry?.[0] || 'N/A',
        savingsPotential,
        upcomingRenewalsCount: upcomingRenewals.length,
        preferredCurrency,
        preferredLanguage,
      }),
    [
      leakScore,
      unusedSubscriptions.length,
      pausedSubscriptions.length,
      activeSubscriptions.length,
      monthlySpend,
      yearlySpend,
      topCategoryEntry,
      savingsPotential,
      upcomingRenewals.length,
      preferredCurrency,
      preferredLanguage,
    ]
  )

  const handleCopySummary = async () => {
    const text = [
      `Renewly Leak Report`,
      `Leak Score: ${leakScore}/100`,
      `Monthly Spend: ${formatMoney(monthlySpend, preferredCurrency, preferredLanguage)}`,
      `Yearly Projected: ${formatMoney(yearlySpend, preferredCurrency, preferredLanguage)}`,
      `Potential Savings: ${formatMoney(savingsPotential, preferredCurrency, preferredLanguage)}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  if (!mounted) {
    return (
      <PageTransition className="min-h-screen bg-transparent">
        <Header
          title="Leak Report"
          subtitle="Loading your savings intelligence..."
          showSearch={false}
          showNotifications={false}
          onProfileClick={onProfileClick}
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <Header
        title="Leak Report"
        subtitle="Your subscription risk and savings snapshot"
        showSearch={false}
        showNotifications={false}
        onProfileClick={onProfileClick}
      />

      <div className="space-y-6 px-4 pb-8 lg:px-6">
        <motion.section
          initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative overflow-hidden rounded-[32px] border border-gold/10 glass-premium p-6 shadow-card md:p-8"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute -top-20 right-0 h-64 w-64 rounded-full blur-[120px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(199, 163, 106, 0.10) 0%, transparent 72%)',
              }}
            />
            <div
              className="absolute -bottom-16 left-0 h-56 w-56 rounded-full blur-[120px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(46, 94, 82, 0.08) 0%, transparent 74%)',
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-gold">
                  Your Leak Report
                </p>
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium',
                    scoreTone
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                  {scoreLabel}
                </div>
              </div>

              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 rounded-xl border border-gold/15 bg-card/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold/30 hover:bg-card/70"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[300px,1fr]">
              <div className="flex flex-col items-center justify-center">
                <div className="relative h-52 w-52">
                  <svg className="h-full w-full -rotate-90 transform">
                    <circle
                      cx="104"
                      cy="104"
                      r="78"
                      fill="none"
                      stroke="rgba(199,163,106,0.12)"
                      strokeWidth="10"
                    />
                    <motion.circle
                      cx="104"
                      cy="104"
                      r="78"
                      fill="none"
                      stroke="#C7A36A"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 78}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 78 * (1 - leakScore / 100),
                      }}
                      transition={{ duration: 1.6, ease: 'easeOut' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-gold">
                      <AnimatedValue value={leakScore} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Leak Score</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard
                  title="Monthly Recurring"
                  value={formatMoney(monthlySpend, preferredCurrency, preferredLanguage)}
                />
                <StatCard
                  title="Yearly Projected"
                  value={formatMoney(yearlySpend, preferredCurrency, preferredLanguage)}
                />
                <StatCard
                  title="Active Subscriptions"
                  value={String(activeSubscriptions.length)}
                />
                <StatCard
                  title="Possible Savings"
                  value={formatMoney(savingsPotential, preferredCurrency, preferredLanguage)}
                  highlight
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl border border-gold/15 bg-card/55 p-5 shadow-card backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <p className="font-semibold text-foreground">AI Insight</p>
                <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold">
                  New
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {observations[0]}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crimson/10 text-crimson">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Flagged Subscriptions</p>
                <p className="text-sm text-muted-foreground">
                  Unused or paused services worth reviewing
                </p>
              </div>
            </div>

            {flaggedSubscriptions.length === 0 ? (
              <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-4 text-sm text-emerald">
                No risky subscriptions found right now.
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedSubscriptions.slice(0, 5).map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{sub.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.category} • {sub.status}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gold">
                        {formatMoney(
                          toMonthlyAmount(sub),
                          sub.currency || preferredCurrency,
                          preferredLanguage
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">monthly impact</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Upcoming Renewals</p>
                <p className="text-sm text-muted-foreground">
                  Active charges due in the next 30 days
                </p>
              </div>
            </div>

            {upcomingRenewals.length === 0 ? (
              <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                No upcoming renewals in the next 30 days.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRenewals.slice(0, 5).map((sub) => {
                  const days = getDaysUntil(sub.renewalDate || '')
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{sub.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {days === 0 ? 'Due today' : `${days} day${days > 1 ? 's' : ''} left`}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatMoney(
                          sub.amount,
                          sub.currency || preferredCurrency,
                          preferredLanguage
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/12 text-gold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Observations</p>
              <p className="text-sm text-muted-foreground">
                What Renewly is noticing in your current stack
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {observations.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="rounded-xl border border-border bg-background/35 p-4"
              >
                <p className="text-sm leading-relaxed text-foreground">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/10 text-emerald">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Recommended Actions</p>
              <p className="text-sm text-muted-foreground">
                Quick next steps to improve your score
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <ActionCard
              title="Review unused subscriptions"
              description={`You currently have ${unusedSubscriptions.length} unused subscription${unusedSubscriptions.length !== 1 ? 's' : ''}.`}
              actionLabel="Open Dashboard"
              onClick={() => onNavigateTab?.('dashboard')}
            />
            <ActionCard
              title="Check renewal concentration"
              description={`${upcomingRenewals.length} renewal${upcomingRenewals.length !== 1 ? 's' : ''} fall in the next 30 days.`}
              actionLabel="Open Calendar"
              onClick={() => onNavigateTab?.('calendar')}
            />
            <ActionCard
              title="Audit biggest category"
              description={
                topCategoryEntry
                  ? `${topCategoryEntry[0]} is your top spend category at ${formatMoney(
                    topCategoryEntry[1],
                    preferredCurrency,
                    preferredLanguage
                  )} per month.`
                  : 'Add more subscriptions to unlock category analysis.'
              }
              actionLabel="View Analytics"
              onClick={() => onNavigateTab?.('analytics')}
            />
          </div>
        </motion.section>
      </div>
    </PageTransition>
  )
}

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string
  value: string
  highlight?: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-2xl border p-5 backdrop-blur-xl',
        highlight
          ? 'border-emerald/20 bg-gradient-to-br from-emerald/8 to-emerald/3'
          : 'border-border/50 bg-card/40'
      )}
    >
      <p className="mb-3 text-sm font-medium text-muted-foreground">{title}</p>
      <p
        className={cn(
          'text-2xl font-bold tracking-tight md:text-3xl',
          highlight ? 'text-emerald' : 'text-foreground'
        )}
      >
        {value}
      </p>
    </motion.div>
  )
}

function ActionCard({
  title,
  description,
  actionLabel,
  onClick,
}: {
  title: string
  description: string
  actionLabel: string
  onClick?: () => void
}) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-border bg-background/35 p-4 text-left transition-colors hover:border-gold/25"
    >
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2 text-sm font-medium text-gold">
        {actionLabel}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  )
}

function AnimatedValue({ value }: { value: number }) {
  const displayValue = useCountUp(value, 1800, 0)
  return <>{Math.round(displayValue)}</>
}

function toMonthlyAmount(subscription: Subscription) {
  const amount = subscription.amount || 0

  switch (subscription.billingCycle) {
    case 'yearly':
      return amount / 12
    case 'quarterly':
      return amount / 3
    case 'weekly':
      return amount * 4.345
    case 'daily':
      return amount * 30
    default:
      return amount
  }
}

function getDaysUntil(dateStr: string) {
  if (!dateStr) return 0

  const date = new Date(dateStr)
  const today = new Date()

  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
    observations.push(
      `Your subscription health shows significant optimization opportunities. You could potentially recover ${formatMoney(
        data.savingsPotential,
        data.preferredCurrency,
        data.preferredLanguage
      )} each month by reviewing flagged services.`
    )
  } else if (data.leakScore < 75) {
    observations.push(
      'There are opportunities to improve your subscription efficiency. Consider reviewing unused services to reduce your monthly spend.'
    )
  } else {
    observations.push(
      'Your subscriptions are well-optimized. Keep monitoring for new opportunities to save.'
    )
  }

  if (data.unusedCount > 0) {
    observations.push(
      `You have ${data.unusedCount} unused subscription${data.unusedCount > 1 ? 's' : ''} consuming ${formatMoney(
        data.savingsPotential,
        data.preferredCurrency,
        data.preferredLanguage
      )} monthly. These are prime candidates for cancellation.`
    )
  }

  if (data.topCategory && data.topCategory !== 'N/A' && data.activeCount > 0) {
    observations.push(
      `${data.topCategory} subscriptions dominate your portfolio. Consider evaluating if all services in this category provide distinct value.`
    )
  }

  if (data.upcomingRenewalsCount > 3) {
    observations.push(
      `You have ${data.upcomingRenewalsCount} renewals coming in the next 30 days. Bundle these review sessions to make informed decisions about renewal strategy.`
    )
  }

  const annualVsMonthly =
    data.totalMonthly > 0 ? data.totalYearly / (data.totalMonthly * 12) : 1

  if (annualVsMonthly > 1.15) {
    observations.push(
      'Your annual spend projection appears higher than monthly figures suggest. This indicates some subscriptions are billed annually, potentially offering better rates.'
    )
  }

  if (data.pausedCount > 0) {
    observations.push(
      `You have ${data.pausedCount} paused service${data.pausedCount > 1 ? 's' : ''}. Consider cancelling these completely if you have not resumed them in 30 days.`
    )
  }

  return observations.slice(0, 5)
}