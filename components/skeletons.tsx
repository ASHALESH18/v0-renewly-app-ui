'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const shimmer = {
  initial: { backgroundPosition: '0% 0%' },
  animate: { backgroundPosition: '100% 0%' },
}

// Premium shimmer skeleton base component
function ShimmerBlock({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      transition={{ duration: 2, repeat: Infinity, delay }}
      className={cn(
        'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-lg',
        className
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      transition={{ duration: 2, repeat: Infinity }}
      className="rounded-2xl p-5 bg-gradient-to-r from-card via-muted to-card bg-[length:200%_100%] shadow-card"
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      transition={{ duration: 2, repeat: Infinity }}
      className="rounded-2xl p-5 bg-gradient-to-r from-card via-muted to-card bg-[length:200%_100%] h-24 shadow-card"
    />
  )
}

export function SubscriptionCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border border-border bg-card space-y-4">
      <div className="flex items-start gap-4">
        <ShimmerBlock className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-4 w-3/4" />
          <ShimmerBlock className="h-3 w-1/2" delay={0.1} />
        </div>
      </div>
      <ShimmerBlock className="h-4 w-2/3" delay={0.2} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-8">
      {/* Hero card skeleton */}
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity }}
        className="rounded-3xl h-40 bg-gradient-to-r from-card via-muted to-card bg-[length:200%_100%]"
      />

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <ShimmerBlock key={i} className="h-9 w-20 rounded-full" delay={i * 0.1} />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <SubscriptionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Calendar page skeleton
export function CalendarSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-32" />
          <ShimmerBlock className="h-4 w-48" delay={0.1} />
        </div>
        <ShimmerBlock className="h-10 w-10 rounded-full" />
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <ShimmerBlock className="h-8 w-8 rounded-lg" />
        <ShimmerBlock className="h-6 w-32" />
        <ShimmerBlock className="h-8 w-8 rounded-lg" />
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <ShimmerBlock key={i} className="h-4 w-8 mx-auto" delay={i * 0.05} />
          ))}
        </div>
        {/* Calendar days */}
        {[...Array(5)].map((_, week) => (
          <div key={week} className="grid grid-cols-7 gap-2 mb-2">
            {[...Array(7)].map((_, day) => (
              <ShimmerBlock 
                key={day} 
                className="h-12 rounded-xl" 
                delay={(week * 7 + day) * 0.02} 
              />
            ))}
          </div>
        ))}
      </div>

      {/* Upcoming renewals */}
      <div className="space-y-3">
        <ShimmerBlock className="h-5 w-40" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <ShimmerBlock className="w-10 h-10 rounded-xl flex-shrink-0" delay={i * 0.1} />
              <div className="flex-1 space-y-2">
                <ShimmerBlock className="h-4 w-24" delay={i * 0.1 + 0.05} />
                <ShimmerBlock className="h-3 w-32" delay={i * 0.1 + 0.1} />
              </div>
              <ShimmerBlock className="h-5 w-16" delay={i * 0.1 + 0.15} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Analytics page skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-28" />
          <ShimmerBlock className="h-4 w-44" delay={0.1} />
        </div>
        <ShimmerBlock className="h-10 w-10 rounded-full" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <ShimmerBlock className="h-4 w-20" delay={i * 0.1} />
            <ShimmerBlock className="h-8 w-24" delay={i * 0.1 + 0.05} />
            <ShimmerBlock className="h-3 w-16" delay={i * 0.1 + 0.1} />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <ShimmerBlock className="h-5 w-32" />
          <div className="flex gap-2">
            <ShimmerBlock className="h-8 w-16 rounded-lg" />
            <ShimmerBlock className="h-8 w-16 rounded-lg" delay={0.05} />
          </div>
        </div>
        <ShimmerBlock className="h-64 w-full rounded-xl" delay={0.1} />
      </div>

      {/* Category breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <ShimmerBlock className="h-5 w-36" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <ShimmerBlock className="w-8 h-8 rounded-lg flex-shrink-0" delay={i * 0.1} />
                <ShimmerBlock className="h-4 flex-1" delay={i * 0.1 + 0.05} />
                <ShimmerBlock className="h-4 w-16" delay={i * 0.1 + 0.1} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <ShimmerBlock className="h-5 w-28" />
          <ShimmerBlock className="h-48 w-full rounded-xl" delay={0.1} />
        </div>
      </div>
    </div>
  )
}

// Leak Report page skeleton
export function LeakReportSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-32" />
          <ShimmerBlock className="h-4 w-52" delay={0.1} />
        </div>
        <ShimmerBlock className="h-10 w-10 rounded-full" />
      </div>

      {/* Summary card */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <ShimmerBlock className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-5 w-40" />
            <ShimmerBlock className="h-8 w-28" delay={0.1} />
          </div>
        </div>
        <ShimmerBlock className="h-4 w-full" delay={0.15} />
        <ShimmerBlock className="h-4 w-4/5" delay={0.2} />
      </div>

      {/* Leak items */}
      <div className="space-y-3">
        <ShimmerBlock className="h-5 w-36" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <ShimmerBlock className="w-12 h-12 rounded-xl flex-shrink-0" delay={i * 0.1} />
              <div className="flex-1 space-y-2">
                <ShimmerBlock className="h-4 w-32" delay={i * 0.1 + 0.05} />
                <ShimmerBlock className="h-3 w-48" delay={i * 0.1 + 0.1} />
                <ShimmerBlock className="h-3 w-24" delay={i * 0.1 + 0.15} />
              </div>
              <ShimmerBlock className="h-6 w-20 rounded-full" delay={i * 0.1 + 0.2} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Notifications page skeleton (full page with header)
export function NotificationsSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-36" />
          <ShimmerBlock className="h-4 w-48" delay={0.1} />
        </div>
        <ShimmerBlock className="h-9 w-24 rounded-lg" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <ShimmerBlock key={i} className="h-9 w-20 rounded-full" delay={i * 0.05} />
        ))}
      </div>

      {/* Notification items */}
      <NotificationsListSkeleton />
    </div>
  )
}

// Inline notifications list skeleton (no outer padding, for use inside containers)
export function NotificationsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <ShimmerBlock className="w-10 h-10 rounded-xl flex-shrink-0" delay={i * 0.08} />
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-3/4" delay={i * 0.08 + 0.04} />
              <ShimmerBlock className="h-3 w-full" delay={i * 0.08 + 0.08} />
              <ShimmerBlock className="h-3 w-20" delay={i * 0.08 + 0.12} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Auth page skeleton
export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <ShimmerBlock className="w-12 h-12 rounded-xl" />
        </div>
        
        {/* Title */}
        <div className="text-center space-y-2">
          <ShimmerBlock className="h-8 w-48 mx-auto" />
          <ShimmerBlock className="h-4 w-64 mx-auto" delay={0.1} />
        </div>
        
        {/* Form fields */}
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-16" />
            <ShimmerBlock className="h-12 w-full rounded-xl" delay={0.05} />
          </div>
          <div className="space-y-2">
            <ShimmerBlock className="h-4 w-20" delay={0.1} />
            <ShimmerBlock className="h-12 w-full rounded-xl" delay={0.15} />
          </div>
          <ShimmerBlock className="h-12 w-full rounded-xl" delay={0.2} />
        </div>
        
        {/* Social buttons */}
        <div className="pt-4 space-y-3">
          <ShimmerBlock className="h-12 w-full rounded-xl" delay={0.25} />
          <ShimmerBlock className="h-12 w-full rounded-xl" delay={0.3} />
        </div>
      </div>
    </div>
  )
}

// Settings page skeleton
export function SettingsSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerBlock className="h-7 w-24" />
          <ShimmerBlock className="h-4 w-40" delay={0.1} />
        </div>
        <ShimmerBlock className="h-10 w-10 rounded-full" />
      </div>

      {/* Profile section */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-4">
          <ShimmerBlock className="w-16 h-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-5 w-32" />
            <ShimmerBlock className="h-4 w-48" delay={0.1} />
          </div>
          <ShimmerBlock className="h-9 w-16 rounded-lg" delay={0.15} />
        </div>
      </div>

      {/* Settings sections */}
      {[...Array(4)].map((_, section) => (
        <div key={section} className="space-y-3">
          <ShimmerBlock className="h-4 w-24" delay={section * 0.1} />
          <div className="rounded-2xl border border-border bg-card divide-y divide-border">
            {[...Array(3)].map((_, item) => (
              <div key={item} className="p-4 flex items-center gap-4">
                <ShimmerBlock 
                  className="w-9 h-9 rounded-full flex-shrink-0" 
                  delay={section * 0.1 + item * 0.05} 
                />
                <div className="flex-1 space-y-1">
                  <ShimmerBlock 
                    className="h-4 w-28" 
                    delay={section * 0.1 + item * 0.05 + 0.02} 
                  />
                  <ShimmerBlock 
                    className="h-3 w-36" 
                    delay={section * 0.1 + item * 0.05 + 0.04} 
                  />
                </div>
                <ShimmerBlock 
                  className="h-5 w-5 rounded" 
                  delay={section * 0.1 + item * 0.05 + 0.06} 
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
