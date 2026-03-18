'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  
  // Memoize metrics calculation to prevent infinite loop
  const metrics = useMemo(() => {
    const totalMonthly = subscriptions.reduce((sum, sub) => sum + (sub.price || sub.amount || 0), 0)
    const totalYearly = totalMonthly * 12
    const savingsPotential = subscriptions
      .filter(sub => sub.status === 'unused')
      .reduce((sum, sub) => sum + (sub.price || sub.amount || 0), 0)
    
    return { totalMonthly, totalYearly, savingsPotential }
  }, [subscriptions])
  
  // Calculate leak data
  const leakData = (() => {
    const categories: Record<string, number> = {}
    let mostExpensiveCategory = ''
    let mostExpensiveAmount = 0
    let overallScore = 100

    subscriptions.forEach(sub => {
      categories[sub.category] = (categories[sub.category] || 0) + (sub.price || 0)
      if ((sub.price || 0) > mostExpensiveAmount) {
        mostExpensiveAmount = sub.price || 0
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
        percentage: subscriptions.length > 0 
          ? (amount / subscriptions.reduce((sum, s) => sum + (s.price || 0), 0)) * 100 
          : 0,
      })),
      mostExpensiveCategory,
      unusedSubscriptionsCount: unusedSubscriptions.length,
      potentialSavings: unusedSubscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0),
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
      <PageTransition className="min-h-screen">
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
  
  const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]
  const topCategoryCount = topCategory?.[1] ?? 0
  const topCategoryName = topCategory?.[0] ?? 'N/A'
  
  const categorySpends = subscriptions.reduce((acc, sub) => {
    if (sub.status === 'active') {
      const monthlyAmount = sub.billingCycle === 'yearly' ? sub.amount / 12 : sub.amount
      acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount
    }
    return acc
  }, {} as Record<string, number>)
  
  const topSpendCategory = Object.entries(categorySpends).sort(([,a], [,b]) => b - a)[0]
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
  })

  const handleShare = async () => {
    try {
      const shareText = `Renewly Leak Report: My subscription leak score is ${leakData.overallScore}/100. Monthly spend: ₹${metrics.totalMonthly}. Annual projected: ₹${metrics.totalYearly}. Potential savings: ₹${metrics.savingsPotential}`
      
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

  const scoreColor = leakData.overallScore >= 70 
    ? 'text-emerald' 
    : leakData.overallScore >= 40 
    ? 'text-gold' 
    : 'text-crimson'

  const scoreLabel = leakData.overallScore >= 70 
    ? 'Healthy' 
    : leakData.overallScore >= 40 
    ? 'Needs Attention' 
    : 'Critical'

  const AnimatedLeakScore = () => {
    const displayValue = useCountUp(leakData.overallScore, 2000, 0)
    return <span>{Math.round(displayValue)}</span>
  }

  return (
    <PageTransition className="min-h-screen">
      <Header 
        title="Leak Report"
        subtitle="Your financial health snapshot"
        showSearch={false}
        showNotifications={false}
      />

      <div className="px-4 lg:px-6 space-y-8 pb-8">
        {/* Full-screen hero leak score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Luxury background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-emerald/5" />
          
          {/* Premium border and glass effect */}
          <div className="relative bg-graphite/40 backdrop-blur-lg border border-gold/20 p-8 md:p-12">
            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-emerald/5 blur-3xl" />
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-12">
                <div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-medium text-gold mb-2 uppercase tracking-wider"
                  >
                    Your Leak Score
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <span className={cn('text-sm font-semibold px-3 py-1 rounded-full', 
                      scoreLabel === 'Healthy' ? 'bg-emerald/20 text-emerald' :
                      scoreLabel === 'Needs Attention' ? 'bg-gold/20 text-gold' :
                      'bg-crimson/20 text-crimson'
                    )}>
                      {scoreLabel}
                    </span>
                  </motion.div>
                </div>

                {/* Action buttons */}
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

              {/* Oversized score display */}
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
                    <p className="text-sm font-medium text-platinum uppercase tracking-wider">out of 100</p>
                  </div>
                </motion.div>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricCard 
                  label="Monthly Recurring"
                  value={`₹${metrics.totalMonthly.toLocaleString('en-IN')}`}
                  icon="₹"
                  delay={0.5}
                />
                <MetricCard 
                  label="Annual Projected"
                  value={`₹${metrics.totalYearly.toLocaleString('en-IN')}`}
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
                  value={`₹${metrics.savingsPotential.toLocaleString('en-IN')}`}
                  icon="💰"
                  highlight
                  delay={0.8}
                />
              </div>
            </div>
          </div>
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
                <p className="text-4xl font-bold text-gold">₹{Math.round(topSpendAmount).toLocaleString('en-IN')}</p>
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
                    <p className="font-semibold text-crimson">₹{sub.amount.toLocaleString('en-IN')}</p>
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
                    <span className="text-sm font-semibold text-gold">₹{sub.amount.toLocaleString('en-IN')}</span>
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
              />
            )}
            {upcoming.length > 3 && (
              <ActionCard 
                title="Cluster of Renewals"
                description={`${upcoming.length} subscriptions renew in the next 30 days`}
                action="View Calendar"
              />
            )}
            {topCategoryCount > 2 && (
              <ActionCard 
                title="Category Concentration"
                description={`${topCategoryCount} ${topCategoryName} subscriptions might have overlaps`}
                action="Optimize"
              />
            )}
            <ActionCard 
              title="Enable Leak Alerts"
              description="Get notified when new potential savings are detected"
              action="Enable"
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
  action 
}: { 
  title: string
  description: string
  action: string
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-start justify-between p-4 rounded-xl glass-strong border border-gold/20 hover:border-gold/40 transition-colors cursor-pointer group"
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
    </motion.div>
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
}): string[] {
  const observations: string[] = []

  if (data.leakScore < 50) {
    observations.push(`Your subscription health shows significant optimization opportunities. You could potentially recover ₹${data.savingsPotential.toLocaleString('en-IN')} each month by reviewing flagged services.`)
  } else if (data.leakScore < 75) {
    observations.push(`There are opportunities to improve your subscription efficiency. Consider reviewing unused services to reduce your monthly spend.`)
  } else {
    observations.push(`Your subscriptions are well-optimized. Keep monitoring for new opportunities to save.`)
  }

  if (data.unusedCount > 0) {
    observations.push(`You have ${data.unusedCount} unused subscription${data.unusedCount > 1 ? 's' : ''} consuming ₹${data.savingsPotential.toLocaleString('en-IN')} monthly. These are prime candidates for cancellation.`)
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
