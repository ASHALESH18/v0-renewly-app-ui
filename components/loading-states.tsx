'use client'

import { motion } from 'framer-motion'
import { springs } from './motion'
import { cn } from '@/lib/utils'

export function DashboardSkeleton() {
  return (
    <div className="px-4 lg:px-6 space-y-6 pb-8 animate-pulse">
      {/* Hero card skeleton */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-3xl glass-strong p-6 md:p-8 h-48"
      >
        <div className="space-y-4">
          <div className="h-4 w-20 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-8 w-32 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.gentle, delay: i * 0.05 }}
            className="rounded-2xl bg-card p-4 h-32 border border-border"
          />
        ))}
      </div>

      {/* Subscription cards skeleton */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} delay={0.15 + i * 0.05} />
        ))}
      </div>
    </div>
  )
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.gentle, delay }}
      className="rounded-2xl bg-card p-5 border border-border"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-5 w-20 bg-muted rounded ml-auto" />
          <div className="h-3 w-24 bg-muted rounded ml-auto" />
        </div>
      </div>
    </motion.div>
  )
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.gentle}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
        className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10 text-gold" />
      </motion.div>

      <h3 className="text-xl font-semibold text-foreground mb-2 text-center">
        {title}
      </h3>

      <p className="text-muted-foreground text-center max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="px-6 py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

export function CircleLoadingSpinner() {
  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="text-gold"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <motion.circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="94.25"
          strokeDashoffset="0"
          initial={{ strokeDashoffset: 94.25 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  )
}

interface SkeletonPulseProps {
  className?: string
}

export function SkeletonPulse({ className }: SkeletonPulseProps) {
  return (
    <motion.div
      className={cn('rounded-lg bg-muted', className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}
