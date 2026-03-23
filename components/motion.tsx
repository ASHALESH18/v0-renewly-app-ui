'use client'

import { motion, type Variants, type HTMLMotionProps, AnimatePresence } from 'framer-motion'
import { forwardRef, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Spring configurations for premium feel
export const springs = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 },
  snappy: { type: 'spring', stiffness: 300, damping: 24 },
  bouncy: { type: 'spring', stiffness: 400, damping: 10 },
  smooth: { type: 'spring', stiffness: 100, damping: 20 },
  luxury: { type: 'spring', stiffness: 80, damping: 16 },
  cinematic: { type: 'spring', stiffness: 70, damping: 18 },
} as const

// Custom hook to detect prefers-reduced-motion
const useReducedMotionMediaQuery = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Utility to respect prefers-reduced-motion
export const useMotionPreferences = () => {
  const prefersReducedMotion = useReducedMotionMediaQuery()
  return {
    prefersReducedMotion,
    maybeVariants: (fullVariant: Variants, reducedVariant: Variants = fadeIn) => 
      prefersReducedMotion ? reducedVariant : fullVariant,
  }
}

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

// Cinematic reveals
export const cinematicFadeInUp: Variants = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: 'easeOut' }
  },
  exit: { opacity: 0, y: 24, filter: 'blur(8px)' },
}

export const cinematicScale: Variants = {
  initial: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  exit: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
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

// Luxury slide for sheets/modals
export const luxurySlideUp: Variants = {
  initial: { 
    y: '100%', 
    opacity: 0,
    filter: 'blur(12px)',
  },
  animate: { 
    y: 0, 
    opacity: 1,
    filter: 'blur(0px)',
    transition: { ...springs.luxury, duration: 0.5 },
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    filter: 'blur(12px)',
    transition: { duration: 0.3 },
  },
}

// Premium page transitions with stagger
export const premiumPageTransition: Variants = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    filter: 'blur(6px)',
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
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

// Premium stagger for cards with blur
export const luxuryStaggerItem: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { ...springs.cinematic, duration: 0.5 }
  },
}

// Card lift effect
export const cardLift: Variants = {
  initial: { y: 0, scale: 1 },
  hover: { 
    y: -6, 
    scale: 1.01,
    transition: springs.gentle,
  },
  tap: { 
    y: 0, 
    scale: 0.98,
    transition: springs.snappy,
  },
}

// Premium card with gold glow on hover
export const premiumCardHover: Variants = {
  initial: { y: 0 },
  hover: { 
    y: -8,
    boxShadow: '0 20px 40px rgba(199, 163, 106, 0.15), 0 0 1px rgba(199, 163, 106, 0.5)',
    transition: springs.gentle,
  },
  tap: { 
    y: -2,
    transition: springs.snappy,
  },
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

// Premium page transition with blur
export function CinematicPageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
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

// Premium backdrop with blur
export const premiumBackdropVariants: Variants = {
  initial: { opacity: 0, filter: 'blur(0px)' },
  animate: { 
    opacity: 1, 
    filter: 'blur(4px)',
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.2 }
  },
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

// Premium shimmer skeleton
export function PremiumSkeletonShimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-gradient-to-r from-muted via-muted-foreground/10 to-muted', className)}
      animate={{ 
        backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
      style={{ backgroundSize: '200% 100%' }}
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
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted opacity-20"
      />
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

// Premium screen transitions with stagger
export const screenTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
}

// Success animation for actions
export const successCheckmark: Variants = {
  initial: { scale: 0, rotate: -45 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
}

// Ripple effect for button press
export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: { scale: 4, opacity: 0 },
}

// List item enter animation with cascading delay
export const cascadingItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.4,
      ease: 'easeOut',
    },
  }),
  exit: { opacity: 0, x: 20 },
}

// Badge/tag entrance animation
export const badgeEntrance: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: springs.snappy,
  },
  exit: { scale: 0, opacity: 0 },
}

// Button hover and press animations
export const buttonHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: springs.gentle,
  },
  tap: { 
    scale: 0.96,
    transition: springs.snappy,
  },
}

// Magnetic button effect
export const magneticButtonVariants: Variants = {
  initial: { scale: 1, x: 0, y: 0 },
  hover: { 
    scale: 1.05,
    boxShadow: '0 12px 24px rgba(199, 163, 106, 0.2)',
    transition: springs.gentle,
  },
  tap: { 
    scale: 0.94,
    transition: springs.snappy,
  },
}

// Number reveal animation for metrics
export const numberReveal: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { ...springs.gentle, duration: 0.6 }
  },
}

// Toggle switch animation
export const toggleVariants: Variants = {
  off: { x: 0 },
  on: { x: 24 },
}

// Export AnimatePresence for use in components
export { AnimatePresence }
