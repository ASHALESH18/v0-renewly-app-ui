'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { SegmentedControl } from '@/components/filter-chips'
import { useAnalyticsData } from '@/lib/hooks/use-remote-data'
import useStore from '@/lib/store'
import { formatMoney } from '@/lib/preferences-format'
import { AnalyticsSkeleton } from '@/components/skeletons'

const timeSegments = [
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
]

const COLORS = ['#C7A36A', '#2E5E52', '#7A3940', '#BCC2CC', '#F4EFE7']

type AnalyticsScreenProps = {
  onNavigateTab?: (tab: string) => void
  onProfileClick?: () => void
}

// Inline skeleton removed - using AnalyticsSkeleton from @/components/skeletons

function MetricCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string
  value: string
  trend?: { value: string; positive?: boolean; note?: string }
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        y: -8, 
        boxShadow: '0 32px 64px -16px rgba(199, 163, 106, 0.25), 0 0 0 1px rgba(199, 163, 106, 0.15), 0 0 60px -20px rgba(199, 163, 106, 0.15)'
      }}
      transition={{ duration: 0.6 }}
      className="relative rounded-3xl border border-gold/15 bg-card/90 backdrop-blur-2xl p-7 shadow-card overflow-hidden group"
    >
      {/* DRAMATIC: Multi-layer ambient glow on hover */}
      <motion.div 
        className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top right, rgba(199, 163, 106, 0.2) 0%, transparent 60%)' }}
      />
      <motion.div 
        className="absolute -inset-4 opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
        style={{ background: 'radial-gradient(circle at bottom left, rgba(199, 163, 106, 0.1) 0%, transparent 50%)' }}
      />
      
      {/* Animated top highlight line */}
      <motion.div 
        className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="mt-3 text-3xl font-bold text-foreground tracking-tight">{value}</p>

          {trend ? (
            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${trend.positive
                  ? 'bg-emerald/15 text-emerald border border-emerald/25'
                  : 'bg-crimson/15 text-crimson border border-crimson/25'
                }`}
            >
              {trend.positive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{trend.value}</span>
              {trend.note ? <span className="opacity-70">{trend.note}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-gold/8 text-gold border border-gold/15">
          {/* DRAMATIC: Multi-layer icon glow */}
          <div className="absolute -inset-2 rounded-2xl bg-gold/15 blur-xl opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
          <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
          <Icon className="relative h-7 w-7" />
        </div>
      </div>
    </motion.div>
  )
}

export function AnalyticsScreen({
  onProfileClick,
}: AnalyticsScreenProps) {
  const [timeRange, setTimeRange] = useState('6m')
  const [isMounted, setIsMounted] = useState(false)

  const { monthlySpendData, categoryBreakdown, isLoading, error } = useAnalyticsData()
  const subscriptions = useStore((state) => state.subscriptions)
  const notificationSettings = useStore((state) => state.notificationSettings)

  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredSpendData = useMemo(() => {
    const count = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
    return monthlySpendData.slice(-count)
  }, [monthlySpendData, timeRange])

  const totalSpend = useMemo(
    () => filteredSpendData.reduce((sum: number, item: any) => sum + (item.amount || 0), 0),
    [filteredSpendData]
  )

  const avgSpend = filteredSpendData.length
    ? Math.round(totalSpend / filteredSpendData.length)
    : 0

  const yearlyProjected = avgSpend * 12

  const lastMonthChange = useMemo(() => {
    if (filteredSpendData.length < 2) return 0
    const current = filteredSpendData[filteredSpendData.length - 1]?.amount || 0
    const previous = filteredSpendData[filteredSpendData.length - 2]?.amount || 0
    if (!previous) return 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }, [filteredSpendData])

  const pieData = useMemo(() => {
    const total = categoryBreakdown.reduce(
      (sum: number, item: any) => sum + (item.value || 0),
      0
    )

    return categoryBreakdown.map((item: any, index: number) => ({
      ...item,
      name: item.name || item.category || 'Other',
      value: item.value || 0,
      percentage: total ? Math.round(((item.value || 0) / total) * 100) : 0,
      color: item.color || COLORS[index % COLORS.length],
    }))
  }, [categoryBreakdown])

  const highestSpend = useMemo(() => {
    return [...subscriptions].sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [subscriptions])

  if (!isMounted || isLoading) {
    return (
      <>
        <Header
          title="Analytics"
          subtitle="Spending trends and subscription intelligence"
          onProfileClick={onProfileClick}
        />
        <AnalyticsSkeleton />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header
          title="Analytics"
          subtitle="Spending trends and subscription intelligence"
          onProfileClick={onProfileClick}
        />
        <PageTransition className="px-6 py-8 lg:px-8">
          <div className="rounded-3xl border border-crimson/20 bg-card/75 p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground">Could not load analytics</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </div>
        </PageTransition>
      </>
    )
  }

  return (
    <>
      <Header
        title="Analytics"
        subtitle="Spending trends and subscription intelligence"
        onProfileClick={onProfileClick}
      />

      <PageTransition className="px-6 py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Subscription analytics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Track trends, category concentration, and projected annual spend.
            </p>
          </div>

          <SegmentedControl
            segments={timeSegments}
            selectedSegment={timeRange}
            onSegmentSelect={setTimeRange}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Avg Monthly Spend"
            value={formatMoney(avgSpend, preferredCurrency, preferredLanguage)}
            icon={TrendingUp}
            trend={{
              value: `${lastMonthChange > 0 ? '+' : ''}${lastMonthChange}%`,
              positive: lastMonthChange <= 0,
              note: 'vs last month',
            }}
          />

          <MetricCard
            label="Projected Yearly"
            value={formatMoney(yearlyProjected, preferredCurrency, preferredLanguage)}
            icon={BarChart3}
          />

          <MetricCard
            label="Active Categories"
            value={String(pieData.length)}
            icon={PieChartIcon}
          />

          <MetricCard
            label="Tracked Services"
            value={String(subscriptions.length)}
            icon={BarChart3}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-gold/10 bg-card/75 p-5 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Monthly Spend Trend</h3>
              <p className="text-sm text-muted-foreground">
                Your recurring spend over the selected period
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredSpendData}>
                  <defs>
                    <linearGradient id="analyticsArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C7A36A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#C7A36A" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="month" stroke="currentColor" tick={{ fill: 'currentColor' }} />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fill: 'currentColor' }}
                    width={88}
                    tickFormatter={(value) =>
                      formatMoney(value, preferredCurrency, preferredLanguage)
                    }
                  />

                  <RechartsTooltip
                    formatter={(value: number) => [
                      formatMoney(value, preferredCurrency, preferredLanguage),
                      'Spend',
                    ]}
                    labelClassName="text-foreground"
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(199,163,106,0.15)',
                      background: 'rgba(18, 22, 28, 0.92)',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#C7A36A"
                    strokeWidth={3}
                    fill="url(#analyticsArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-gold/10 bg-card/75 p-5 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Category Breakdown</h3>
              <p className="text-sm text-muted-foreground">
                Where most of your recurring spend is concentrated
              </p>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={entry.name || index} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <RechartsTooltip
                    formatter={(value: number) => [
                      formatMoney(value, preferredCurrency, preferredLanguage),
                      'Spend',
                    ]}
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(199,163,106,0.15)',
                      background: 'rgba(18, 22, 28, 0.92)',
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-3">
              {pieData.slice(0, 5).map((cat: any, index: number) => (
                <div key={cat.name || index} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate text-sm text-foreground">{cat.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-gold/10 bg-card/75 p-5 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Highest Spend</h3>
              <p className="text-sm text-muted-foreground">
                Your most expensive active subscriptions
              </p>
            </div>

            <div className="space-y-3">
              {highestSpend.length === 0 ? (
                <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-6 text-sm text-muted-foreground">
                  No subscriptions available yet.
                </div>
              ) : (
                highestSpend.map((sub, index) => (
                  <div
                    key={sub.id || `${sub.name}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        <p className="truncate font-medium text-foreground">{sub.name}</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sub.category || 'Other'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {formatMoney(
                          sub.amount,
                          sub.currency || preferredCurrency,
                          preferredLanguage
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        /{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gold/10 bg-card/75 p-5 shadow-card">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Yearly Projection</h3>
              <p className="text-sm text-muted-foreground">
                Based on your current recurring commitments
              </p>
            </div>

            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Projected',
                      amount: yearlyProjected,
                    },
                  ]}
                >
                  <XAxis dataKey="name" stroke="currentColor" tick={{ fill: 'currentColor' }} />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fill: 'currentColor' }}
                    width={88}
                    tickFormatter={(value) =>
                      formatMoney(value, preferredCurrency, preferredLanguage)
                    }
                  />

                  <RechartsTooltip
                    formatter={(value: number) => [
                      formatMoney(value, preferredCurrency, preferredLanguage),
                      'Projected',
                    ]}
                    contentStyle={{
                      borderRadius: 16,
                      border: '1px solid rgba(199,163,106,0.15)',
                      background: 'rgba(18, 22, 28, 0.92)',
                    }}
                  />

                  <Bar dataKey="amount" fill="#C7A36A" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  )
}
