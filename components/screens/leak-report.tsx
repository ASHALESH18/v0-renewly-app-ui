'use client'

import { motion } from 'framer-motion'
import { 
  Share2, 
  Download, 
  AlertTriangle, 
  TrendingDown,
  Check,
  ChevronRight,
  Sparkles,
  BarChart3,
  Music
} from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition, ProgressRing, springs, staggerItem, StaggerList } from '@/components/motion'
import { leakReport, subscriptions } from '@/lib/data'
import { cn } from '@/lib/utils'

export function LeakReportScreen() {
  const scoreColor = leakReport.leakScore >= 70 
    ? 'text-emerald' 
    : leakReport.leakScore >= 40 
    ? 'text-gold' 
    : 'text-crimson'

  const scoreLabel = leakReport.leakScore >= 70 
    ? 'Healthy' 
    : leakReport.leakScore >= 40 
    ? 'Needs Attention' 
    : 'Critical'

  return (
    <PageTransition className="min-h-screen">
      <Header 
        title="Leak Report"
        subtitle="March 2026"
        showSearch={false}
        showNotifications={false}
      />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {/* Main score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="relative rounded-3xl bg-gradient-to-br from-graphite via-slate to-graphite border border-gold/30 p-6 overflow-hidden"
        >
          {/* Gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
          
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-platinum">Your Leak Score</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('text-sm font-medium', scoreColor)}>
                  {scoreLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-slate flex items-center justify-center text-platinum hover:text-ivory transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-slate flex items-center justify-center text-platinum hover:text-ivory transition-colors"
              >
                <Download className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Score ring */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <ProgressRing progress={leakReport.leakScore} size={180} strokeWidth={12} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span 
                  className="text-5xl font-semibold text-gold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, ...springs.bouncy }}
                >
                  {leakReport.leakScore}
                </motion.span>
                <span className="text-sm text-platinum">out of 100</span>
              </div>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock 
              label="Monthly Recurring" 
              value={`₹${leakReport.monthlySpend.toLocaleString('en-IN')}`}
            />
            <MetricBlock 
              label="Yearly Projected" 
              value={`₹${leakReport.yearlyProjected.toLocaleString('en-IN')}`}
            />
            <MetricBlock 
              label="Active Subscriptions" 
              value={leakReport.activeSubscriptions.toString()}
            />
            <MetricBlock 
              label="Possible Savings" 
              value={`₹${leakReport.possibleSavings.toLocaleString('en-IN')}`}
              highlight
            />
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-gold/10 blur-3xl" />
        </motion.div>

        {/* Top category card */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="rounded-2xl bg-card border border-border p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-crimson/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-crimson" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Top Spend Category</p>
              <p className="font-semibold text-foreground">{leakReport.topCategory}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ₹{leakReport.topCategoryAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          </div>
        </motion.div>

        {/* AI Observations */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-semibold text-foreground">AI Observations</h2>
          </div>
          
          <StaggerList className="space-y-3">
            {leakReport.observations.map((observation, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className="flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/20"
              >
                <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{observation}</p>
              </motion.div>
            ))}
          </StaggerList>
        </div>

        {/* Unused subscriptions */}
        {leakReport.unusedSubscriptions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-emerald" />
              <h2 className="text-lg font-semibold text-foreground">Unused Services</h2>
            </div>
            
            <StaggerList className="space-y-3">
              {leakReport.unusedSubscriptions.map((name, index) => {
                const sub = subscriptions.find(s => s.name === name)
                if (!sub) return null
                
                return (
                  <motion.div
                    key={name}
                    variants={staggerItem}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: sub.color }}
                    >
                      {sub.logo}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{sub.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Low usage detected
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {sub.currency}{sub.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                )
              })}
            </StaggerList>
          </div>
        )}

        {/* Duplicate categories */}
        {leakReport.duplicateCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Music className="w-5 h-5 text-gold" />
              <h2 className="text-lg font-semibold text-foreground">Duplicate Categories</h2>
            </div>
            
            <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
              <p className="text-sm text-foreground mb-3">
                You have multiple {leakReport.duplicateCategories[0]} subscriptions:
              </p>
              <div className="flex gap-3">
                {subscriptions
                  .filter(s => s.category === leakReport.duplicateCategories[0])
                  .map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card">
                      <div 
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: sub.color }}
                      >
                        {sub.logo}
                      </div>
                      <span className="text-sm font-medium text-foreground">{sub.name}</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Consider keeping only one to save ₹99/month
              </p>
            </div>
          </div>
        )}

        {/* Savings action card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ...springs.gentle }}
          className="rounded-2xl gold-gradient p-5 shadow-luxury"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-obsidian/70 text-sm mb-1">
                Potential annual savings
              </p>
              <p className="text-3xl font-semibold text-obsidian">
                ₹{(leakReport.possibleSavings * 12).toLocaleString('en-IN')}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-obsidian text-ivory font-medium"
            >
              Start saving
            </motion.button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function MetricBlock({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string
  value: string
  highlight?: boolean 
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl',
      highlight 
        ? 'bg-emerald/10 border border-emerald/20' 
        : 'bg-obsidian/50 border border-glass-border'
    )}>
      <p className={cn(
        'text-xs mb-1',
        highlight ? 'text-emerald' : 'text-platinum'
      )}>
        {label}
      </p>
      <p className={cn(
        'text-xl font-semibold',
        highlight ? 'text-emerald' : 'text-ivory'
      )}>
        {value}
      </p>
    </div>
  )
}
