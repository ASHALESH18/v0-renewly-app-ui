'use client'

import { motion, type Variants, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Spring configurations for premium feel
export const springs = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 },
  snappy: { type: 'spring', stiffness: 300, damping: 24 },
  bouncy: { type: 'spring', stiffness: 400, damping: 10 },
  smooth: { type: 'spring', stiffness: 100, damping: 20 },
} as const

// Fade variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// Slide variants
export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
}

export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
}

export const slideInUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
}

// Stagger container
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: springs.gentle,
  },
}

// Card lift effect
export const cardLift: Variants = {
  initial: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.01,
    transition: springs.gentle,
  },
  tap: { 
    y: 0, 
    scale: 0.98,
    transition: springs.snappy,
  },
}

// Count up animation component
interface CountUpProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ 
  value, 
  duration = 1.5, 
  prefix = '', 
  suffix = '',
  className 
}: CountUpProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {prefix}
      </motion.span>
      <motion.span
        initial={0}
        animate={value}
        transition={{ duration, ease: 'easeOut' }}
        // @ts-expect-error motion value types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children={(latest: any) => Math.round(latest).toLocaleString('en-IN')}
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: duration * 0.8 }}
      >
        {suffix}
      </motion.span>
    </motion.span>
  )
}

// Animated card wrapper
interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  delay?: number
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, className, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={staggerItem}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        className={cn('cursor-pointer', className)}
        transition={{ ...springs.gentle, delay }}
        {...props}
      >
        <motion.div variants={cardLift}>
          {children}
        </motion.div>
      </motion.div>
    )
  }
)
AnimatedCard.displayName = 'AnimatedCard'

// Page transition wrapper
interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={springs.gentle}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger list wrapper
interface StaggerListProps {
  children: ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Bottom sheet animation
export const bottomSheetVariants: Variants = {
  initial: { 
    y: '100%',
    opacity: 0,
  },
  animate: { 
    y: 0,
    opacity: 1,
    transition: springs.gentle,
  },
  exit: { 
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
}

// Modal backdrop
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Skeleton pulse animation
export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-muted', className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// Loading skeleton for cards
export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 border border-border">
      <div className="flex items-center gap-4">
        <SkeletonPulse className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-24" />
          <SkeletonPulse className="h-3 w-16" />
        </div>
        <div className="text-right space-y-2">
          <SkeletonPulse className="h-5 w-16 ml-auto" />
          <SkeletonPulse className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

// Premium chip animation
export const chipVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: springs.snappy,
  },
  tap: { scale: 0.95 },
}

// Number ticker for dashboard metrics
interface NumberTickerProps {
  value: number
  prefix?: string
  className?: string
}

export function NumberTicker({ value, prefix = '', className }: NumberTickerProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {prefix}{value.toLocaleString('en-IN')}
    </motion.span>
  )
}

// Progress ring animation
interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8,
  className 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className={className}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted opacity-20"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#goldGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C7A36A" />
          <stop offset="50%" stopColor="#D4B87A" />
          <stop offset="100%" stopColor="#C7A36A" />
        </linearGradient>
      </defs>
    </svg>
  )
}
