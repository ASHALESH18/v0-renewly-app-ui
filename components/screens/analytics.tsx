'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react'
import { Header } from '@/components/header'
import { PageTransition, springs, staggerItem, StaggerList } from '@/components/motion'
import { SegmentedControl } from '@/components/filter-chips'
import { useState } from 'react'
import { useAnalyticsData } from '@/lib/hooks/use-remote-data'
import useStore from '@/lib/store'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  BarChart,
  Bar
} from 'recharts'
import { cn } from '@/lib/utils'

const timeSegments = [
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
]

const COLORS = ['#C7A36A', '#2E5E52', '#7A3940', '#BCC2CC', '#F4EFE7']

export function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('6m')
  
  const { monthlySpendData, categoryBreakdown, isLoading } = useAnalyticsData()
  const subscriptions = useStore((state) => state.subscriptions)

  const totalSpend = monthlySpendData.reduce((sum: number, m: any) => sum + m.amount, 0)
  const avgSpend = Math.round(totalSpend / monthlySpendData.length)
  const lastMonthChange = monthlySpendData.length >= 5 
    ? ((monthlySpendData[monthlySpendData.length - 1].amount - monthlySpendData[monthlySpendData.length - 2].amount) / monthlySpendData[monthlySpendData.length - 2].amount * 100).toFixed(1)
    : '0'

  return (
    <PageTransition className="min-h-screen">
      <Header 
        title="Analytics"
        subtitle="Your spending insights"
        showSearch={false}
      />

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        {/* Time range selector */}
        <div className="flex justify-center">
          <SegmentedControl
            segments={timeSegments}
            selectedSegment={timeRange}
            onSegmentSelect={setTimeRange}
          />
        </div>

        {/* Overview cards */}
        <StaggerList className="grid grid-cols-2 gap-4">
          <motion.div
            variants={staggerItem}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Avg Monthly</span>
            </div>
            <p className="text-xl font-semibold text-foreground">
              ₹{avgSpend.toLocaleString('en-IN')}
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerItem}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {Number(lastMonthChange) > 0 ? (
                <TrendingUp className="w-4 h-4 text-crimson" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald" />
              )}
              <span className="text-xs">vs Last Month</span>
            </div>
            <p className={cn(
              'text-xl font-semibold',
              Number(lastMonthChange) > 0 ? 'text-crimson' : 'text-emerald'
            )}>
              {Number(lastMonthChange) > 0 ? '+' : ''}{lastMonthChange}%
            </p>
          </motion.div>
        </StaggerList>

        {/* Spend trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="rounded-2xl bg-card border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gold" />
            <h3 className="font-semibold text-foreground">Monthly Spend Trend</h3>
          </div>
          
          <div className="h-[200px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySpendData}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C7A36A" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#C7A36A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#BCC2CC', fontSize: 12 }}
                />
                <YAxis 
                  hide
                  domain={['dataMin - 500', 'dataMax + 500']}
                />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: '#13161C',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                  }}
                  labelStyle={{ color: '#BCC2CC' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#C7A36A"
                  strokeWidth={2}
                  fill="url(#goldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...springs.gentle }}
          className="rounded-2xl bg-card border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-gold" />
            <h3 className="font-semibold text-foreground">Category Breakdown</h3>
          </div>

          <div className="flex items-center gap-6">
            {/* Pie chart */}
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {categoryBreakdown.slice(0, 5).map((cat, index) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{cat.category}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{cat.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Yearly projection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springs.gentle }}
          className="rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 p-5"
        >
          <h3 className="font-semibold text-foreground mb-4">Yearly Projection</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-gold">
              ₹{leakReport.yearlyProjected.toLocaleString('en-IN')}
            </span>
            <span className="text-muted-foreground">projected spend</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Based on your current subscriptions
          </p>
        </motion.div>

        {/* Highest spend subscriptions */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">Highest Spend</h3>
          <StaggerList className="space-y-3">
            {subscriptions
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5)
              .map((sub, index) => (
                <motion.div
                  key={sub.id}
                  variants={staggerItem}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <span className="text-sm text-muted-foreground w-4">{index + 1}</span>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: sub.color }}
                  >
                    {sub.logo}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {sub.currency}{sub.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}
                    </p>
                  </div>
                </motion.div>
              ))}
          </StaggerList>
        </div>

        {/* Savings opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.gentle }}
          className="rounded-2xl bg-emerald/10 border border-emerald/20 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-emerald" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Savings Opportunity</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Switch to annual plans for Netflix and Spotify to save money.
              </p>
              <p className="text-lg font-semibold text-emerald">
                Save up to ₹1,200/year
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
