'use client'

// Motion utilities - uses custom useReducedMotionSafe hook (NOT React.useReducedMotion)
import { motion, type Variants, type HTMLMotionProps, AnimatePresence } from 'framer-motion'
import { forwardRef, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Spring configurations - refined for premium luxury feel
export const springs = {
  // Standard interactions - responsive but smooth
  gentle: { type: 'spring', stiffness: 100, damping: 16, mass: 0.8 },
  // Quick feedback - buttons, toggles
  snappy: { type: 'spring', stiffness: 280, damping: 26, mass: 0.6 },
  // Playful bounce - notifications, badges
  bouncy: { type: 'spring', stiffness: 350, damping: 12, mass: 0.5 },
  // Smooth transitions - cards, panels
  smooth: { type: 'spring', stiffness: 90, damping: 18, mass: 1 },
  // Luxury reveals - hero, featured content
  luxury: { type: 'spring', stiffness: 60, damping: 20, mass: 1.2 },
  // Cinematic entrances - page transitions
  cinematic: { type: 'spring', stiffness: 50, damping: 22, mass: 1.4 },
  // Subtle float - ambient motion
  float: { type: 'spring', stiffness: 40, damping: 25, mass: 1.5 },
} as const

// Easing curves for tween animations
export const easings = {
  // Apple-style ease out
  premium: [0.25, 0.1, 0.25, 1],
  // Dramatic entrance
  entrance: [0.0, 0.0, 0.2, 1],
  // Smooth exit
  exit: [0.4, 0.0, 1, 1],
  // Refined ease
  refined: [0.32, 0.72, 0, 1],
} as const

// SSR-safe hook: defaults false on server, reads matchMedia after hydration
function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

// Mobile detection hook for performance optimizations
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    // Debounced resize handler
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return isMobile
}

// Utility hook — use this everywhere instead of React's experimental useReducedMotion
export function useMotionPreferences() {
  const prefersReducedMotion = useReducedMotionSafe()
  const isMobile = useIsMobile()
  // On mobile or reduced motion, disable heavy animations
  const shouldReduceAnimations = prefersReducedMotion || isMobile
  
  return {
    prefersReducedMotion,
    isMobile,
    shouldReduceAnimations,
    maybeVariants: (fullVariant: Variants, reducedVariant: Variants = fadeIn) =>
      shouldReduceAnimations ? reducedVariant : fullVariant,
  }
}

// === FADE VARIANTS ===

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: easings.refined } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.premium } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.3 } },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easings.premium } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3 } },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easings.refined } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.25 } },
}

// Subtle fade for ambient elements
export const fadeInSubtle: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
}

// === CINEMATIC REVEALS - Performance Optimized ===
// Removed blur filters for smooth 60fps on mobile Safari

export const cinematicFadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.premium }
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
}

export const cinematicScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: easings.refined }
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
}

// Premium card hover - refined lift and glow
export const premiumCardHover: Variants = {
  initial: { y: 0 },
  hover: {
    y: -5,
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  tap: {
    y: -2,
    scale: 0.99,
    transition: { duration: 0.1 }
  }
}

// Luxury entrance for hero elements - smooth, no blur
export const luxuryReveal: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easings.premium }
  },
}

// Dramatic scale entrance - for featured elements, no blur
export const dramaticScale: Variants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easings.entrance }
  },
}

// === SLIDE VARIANTS ===

export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: easings.premium } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.3 } },
}

export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.4, ease: easings.premium } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
}

export const slideInUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: easings.premium } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.3 } },
}

// Luxury slide for sheets/modals - no blur for performance
export const luxurySlideUp: Variants = {
  initial: {
    y: '100%',
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: easings.premium },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: easings.exit },
  },
}

// Side panel slide - for sidebars
export const slideInPanel: Variants = {
  initial: { x: '-100%', opacity: 0.8 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.35, ease: easings.premium } },
  exit: { x: '-100%', opacity: 0.6, transition: { duration: 0.25 } },
}

// === PAGE TRANSITION SYSTEM ===

// Premium page transitions - fast, no blur
export const premiumPageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easings.premium,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.2,
      ease: easings.exit,
    },
  },
}

// Crossfade page transition - no movement, just opacity
export const crossfadeTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// === STAGGER ANIMATION SYSTEM ===

// Standard stagger container
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
}

// Slower stagger for hero sections
export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
}

// Standard stagger item
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.premium },
  },
}

// Premium stagger for cards - no blur
export const luxuryStaggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easings.premium }
  },
}

// Scale stagger item - for grid layouts
export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: easings.refined },
  },
}

// === CARD INTERACTION SYSTEM ===

// Standard card lift effect - refined and subtle
export const cardLift: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.005,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  tap: {
    y: -1,
    scale: 0.995,
    transition: { duration: 0.1 },
  },
}

// Premium card lift - more dramatic for featured cards
export const cardLiftPremium: Variants = {
  initial: { y: 0 },
  hover: {
    y: -6,
    transition: { duration: 0.3, ease: easings.premium },
  },
  tap: {
    y: -2,
    transition: { duration: 0.1 },
  },
}

// Subtle card interaction - for dense lists
export const cardLiftSubtle: Variants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    y: 0,
    scale: 0.99,
    transition: { duration: 0.1 },
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

// Cinematic page transition - fast, no blur for mobile performance
export function CinematicPageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
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

// Backdrop variants - no animated blur filter
export const premiumBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.25 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
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

// Skeleton shimmer - simple opacity pulse, no expensive gradients
export function PremiumSkeletonShimmer({ className }: { className?: string }) {
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

// === BUTTON INTERACTION SYSTEM ===

// Standard button hover - subtle and refined
export const buttonHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.015,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
}

// Premium CTA button - more prominent feedback
export const magneticButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: { duration: 0.25, ease: easings.premium },
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.1 },
  },
}

// Icon button - compact interaction
export const iconButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.08,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  tap: {
    scale: 0.92,
    transition: { duration: 0.08 },
  },
}

// Ghost button - very subtle
export const ghostButtonVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  hover: {
    scale: 1.01,
    opacity: 0.9,
    transition: { duration: 0.15 },
  },
  tap: {
    scale: 0.98,
    opacity: 0.85,
    transition: { duration: 0.08 },
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
