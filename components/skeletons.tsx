'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const shimmer = {
  initial: { backgroundPosition: '0% 0%' },
  animate: { backgroundPosition: '100% 0%' },
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
        <motion.div
          variants={shimmer}
          initial="initial"
          animate="animate"
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-xl bg-gradient-to-r from-muted via-card to-muted bg-[length:200%_100%]"
        />
        <div className="flex-1 space-y-2">
          <motion.div
            variants={shimmer}
            initial="initial"
            animate="animate"
            transition={{ duration: 2, repeat: Infinity }}
            className="h-4 rounded bg-gradient-to-r from-muted via-card to-muted bg-[length:200%_100%] w-3/4"
          />
          <motion.div
            variants={shimmer}
            initial="initial"
            animate="animate"
            transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            className="h-3 rounded bg-gradient-to-r from-muted via-card to-muted bg-[length:200%_100%] w-1/2"
          />
        </div>
      </div>
      <motion.div
        variants={shimmer}
        initial="initial"
        animate="animate"
        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
        className="h-4 rounded bg-gradient-to-r from-muted via-card to-muted bg-[length:200%_100%] w-2/3"
      />
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
          <motion.div
            key={i}
            variants={shimmer}
            initial="initial"
            animate="animate"
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
            className="h-9 rounded-full w-20 bg-gradient-to-r from-muted via-card to-muted bg-[length:200%_100%]"
          />
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
