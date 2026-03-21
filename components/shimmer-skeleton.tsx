'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ShimmerSkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
}

/**
 * Premium shimmer skeleton with luxury gold sweep animation
 * Used for loading states across the app
 */
export function ShimmerSkeleton({ 
  className,
  width = '100%',
  height = '20px',
  circle = false,
}: ShimmerSkeletonProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden bg-muted',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{ width, height }}
    >
      {/* Shimmer sweep effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}

/**
 * Premium card loading skeleton
 */
export function CardLoadingSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 border border-border space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <ShimmerSkeleton height="16px" width="120px" />
          <ShimmerSkeleton height="24px" width="160px" />
        </div>
        <ShimmerSkeleton height="32px" width="32px" circle />
      </div>

      {/* Content */}
      <div className="space-y-3">
        <ShimmerSkeleton height="12px" width="100%" />
        <ShimmerSkeleton height="12px" width="90%" />
        <ShimmerSkeleton height="12px" width="85%" />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-2">
        <ShimmerSkeleton height="16px" width="60px" />
        <ShimmerSkeleton height="16px" width="80px" />
      </div>
    </div>
  )
}

/**
 * Premium dashboard metric skeleton
 */
export function MetricLoadingSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-6 border border-border space-y-4">
      <ShimmerSkeleton height="14px" width="80px" />
      <ShimmerSkeleton height="36px" width="140px" />
      <div className="flex items-center gap-2">
        <ShimmerSkeleton height="16px" width="60px" />
        <ShimmerSkeleton height="16px" width="80px" />
      </div>
    </div>
  )
}

/**
 * Premium list item skeleton
 */
export function ListItemLoadingSkeleton() {
  return (
    <div className="rounded-xl bg-slate/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ShimmerSkeleton height="40px" width="40px" circle />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton height="14px" width="100px" />
          <ShimmerSkeleton height="12px" width="140px" />
        </div>
      </div>
    </div>
  )
}
