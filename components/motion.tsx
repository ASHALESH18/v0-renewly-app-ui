'use client'

// Motion utilities — premium luxury motion system.
// Refined timing hierarchy, signature easing curves, cinematic stagger.
// Performance-conscious: no expensive blur/filter animation, SSR-safe, mobile-aware.
import { motion, type Variants, type HTMLMotionProps, type Transition, AnimatePresence } from 'framer-motion'
import { forwardRef, type ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// =============================================================================
// EASING LANGUAGE
// =============================================================================
// Each curve is chosen for a specific feeling in the interface.
// Use these named curves instead of raw cubic-beziers for consistency.

export const easings = {
  // Apple's swiftOut — refined, crisp decelerations.
  premium: [0.25, 0.1, 0.25, 1] as const,
  // Fast entrance with a soft settle.
  entrance: [0.0, 0.0, 0.2, 1] as const,
  // Clean exit.
  exit: [0.4, 0.0, 1, 1] as const,
  // Controlled Arc-style pull.
  refined: [0.32, 0.72, 0, 1] as const,
  // expoOut — signature luxury glide. Use for hero, section reveals, sheets.
  luxury: [0.22, 1, 0.36, 1] as const,
  // Slower silk decay — premium editorial pacing.
  silk: [0.16, 1, 0.3, 1] as const,
  // Confident in/out — use for segmented controls, tabs, ordered transitions.
  authority: [0.65, 0, 0.35, 1] as const,
  // quintOut — cards, chips, metric cascade.
  gentle: [0.33, 1, 0.68, 1] as const,
  // quiet fade — ambient/decorative.
  quiet: [0.2, 0.8, 0.2, 1] as const,
} as const

// =============================================================================
// TIMING LADDER
// =============================================================================
// Use these durations (in seconds) instead of magic numbers.
// They form a harmonic ladder that produces intentional rhythm across the UI.

export const durations = {
  micro: 0.18,      // tiny hover nudges, icon scale
  quick: 0.28,      // backdrops, toggles, tabs
  base: 0.42,       // chips, small cards, buttons
  reveal: 0.58,     // list items, standard cards, sections
  cinematic: 0.72,  // viewport sections, modal content
  hero: 0.9,        // hero headlines, summary metrics
  settle: 1.1,      // count-up, ring progress, long reveals
} as const

// Delay presets for choreography.
export const delays = {
  none: 0,
  beat: 0.06,
  staggerTight: 0.08,
  stagger: 0.1,
  staggerLuxury: 0.14,
  afterShell: 0.18,
  afterHero: 0.28,
} as const

// =============================================================================
// SPRING PRESETS — refined for a premium luxury feel
// =============================================================================

export const springs = {
  // Standard interactions — responsive but smooth
  gentle: { type: 'spring', stiffness: 180, damping: 22, mass: 0.9 },
  // Quick feedback — buttons, toggles
  snappy: { type: 'spring', stiffness: 320, damping: 28, mass: 0.55 },
  // Slight bounce — notifications, badges (restrained, never playful)
  bouncy: { type: 'spring', stiffness: 360, damping: 20, mass: 0.6 },
  // Smooth, confident — cards, panels, drawers
  smooth: { type: 'spring', stiffness: 120, damping: 22, mass: 1 },
  // Luxury reveals — hero, featured content
  luxury: { type: 'spring', stiffness: 90, damping: 24, mass: 1.1 },
  // Cinematic entrances — page transitions, editorial reveals
  cinematic: { type: 'spring', stiffness: 70, damping: 26, mass: 1.2 },
  // Subtle float — ambient motion, drifting accents
  float: { type: 'spring', stiffness: 50, damping: 26, mass: 1.4 },
  // Soft slide — sheets, drawers, bottom sheets
  sheet: { type: 'spring', stiffness: 160, damping: 26, mass: 1 },
} as const

// =============================================================================
// SSR-safe motion preference hooks
// =============================================================================

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

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    let t: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(t)
      t = setTimeout(check, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(t)
    }
  }, [])
  return isMobile
}

// Primary motion preference hook. Use this instead of Framer's experimental one.
export function useMotionPreferences() {
  const prefersReducedMotion = useReducedMotionSafe()
  const isMobile = useIsMobile()
  // Reduced motion always honors the user. Mobile gets lighter choreography
  // only when the user also asked for reduced motion, so we never degrade
  // the default experience on phones — we just trim the edges.
  const shouldReduceAnimations = prefersReducedMotion
  return {
    prefersReducedMotion,
    isMobile,
    shouldReduceAnimations,
    maybeVariants: (fullVariant: Variants, reducedVariant: Variants = fadeIn) =>
      shouldReduceAnimations ? reducedVariant : fullVariant,
  }
}

// =============================================================================
// FADE VARIANTS
// =============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.base, ease: easings.silk } },
  exit: { opacity: 0, transition: { duration: durations.quick, ease: easings.exit } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { opacity: 0, y: 10, transition: { duration: durations.quick, ease: easings.exit } },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { opacity: 0, y: -10, transition: { duration: durations.quick, ease: easings.exit } },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: durations.base, ease: easings.silk } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: durations.quick, ease: easings.exit } },
}

// Ambient fade for very subtle decorative elements.
export const fadeInSubtle: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.hero, ease: easings.quiet } },
  exit: { opacity: 0, transition: { duration: durations.base, ease: easings.exit } },
}

// =============================================================================
// CINEMATIC REVEALS — performance-safe (no blur filters)
// =============================================================================

export const cinematicFadeInUp: Variants = {
  initial: { opacity: 0, y: 22 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.silk },
  },
  exit: { opacity: 0, y: 12, transition: { duration: durations.quick, ease: easings.exit } },
}

export const cinematicScale: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: durations.quick, ease: easings.exit } },
}

// Luxury hero entrance — slightly longer travel and silk decay.
export const luxuryReveal: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.hero, ease: easings.silk },
  },
}

// Dramatic scale entrance for featured elements.
export const dramaticScale: Variants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
}

// Hero reveal — signature editorial entrance for top-of-page summaries.
export const heroReveal: Variants = {
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.hero, ease: easings.silk },
  },
}

// Container that choreographs hero children with premium delay.
export const heroStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: delays.staggerLuxury,
      delayChildren: delays.afterShell,
    },
  },
}

// Individual metric card reveal — gentle rise with a touch of scale.
export const metricReveal: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
}

// =============================================================================
// CARD INTERACTION — signature hover/press choreography
// =============================================================================

// Standard card lift — refined and calm.
export const cardLift: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -5,
    scale: 1.003,
    transition: { duration: durations.base, ease: easings.luxury },
  },
  tap: {
    y: -1,
    scale: 0.996,
    transition: { duration: 0.12, ease: easings.exit },
  },
}

// Premium card lift — for featured cards, slightly more pronounced.
export const cardLiftPremium: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -7,
    scale: 1.006,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
  tap: {
    y: -2,
    scale: 0.995,
    transition: { duration: 0.12, ease: easings.exit },
  },
}

// Subtle card interaction — dense lists, compact rows.
export const cardLiftSubtle: Variants = {
  initial: { y: 0 },
  hover: {
    y: -2,
    transition: { duration: durations.micro, ease: easings.gentle },
  },
  tap: {
    y: 0,
    scale: 0.992,
    transition: { duration: 0.1 },
  },
}

// Premium card hover — for hero-level cards.
export const premiumCardHover: Variants = {
  initial: { y: 0 },
  hover: {
    y: -6,
    transition: { duration: durations.base, ease: easings.luxury },
  },
  tap: {
    y: -2,
    scale: 0.995,
    transition: { duration: 0.12 },
  },
}

// =============================================================================
// SLIDE / SHEET VARIANTS
// =============================================================================

export const slideInRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { x: '100%', opacity: 0, transition: { duration: durations.base, ease: easings.exit } },
}

export const slideInLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { x: '-100%', opacity: 0, transition: { duration: durations.base, ease: easings.exit } },
}

export const slideInUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { y: '100%', opacity: 0, transition: { duration: durations.base, ease: easings.exit } },
}

// Luxury slide for sheets/modals — signature luxury curve + slightly longer travel.
export const luxurySlideUp: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: durations.base, ease: easings.exit },
  },
}

// Side panel slide — for sidebars / navigation drawers.
export const slideInPanel: Variants = {
  initial: { x: '-100%', opacity: 0.85 },
  animate: { x: 0, opacity: 1, transition: { duration: durations.reveal, ease: easings.luxury } },
  exit: { x: '-100%', opacity: 0.6, transition: { duration: durations.quick, ease: easings.exit } },
}

// Content stagger used inside sheets / modals after they open.
export const sheetContentStagger: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: delays.staggerTight,
      delayChildren: delays.afterShell,
    },
  },
}

export const sheetContentItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
}

// =============================================================================
// VIEWPORT-TRIGGERED CHOREOGRAPHY
// =============================================================================

export const viewportFadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.silk },
  },
}

export const viewportFadeInUpSlow: Variants = {
  initial: { opacity: 0, y: 32 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.hero, ease: easings.silk },
  },
}

export const viewportStaggerContainer: Variants = {
  whileInView: {
    transition: {
      staggerChildren: delays.stagger,
      delayChildren: delays.staggerLuxury,
    },
  },
}

export const viewportStaggerItem: Variants = {
  initial: { opacity: 0, y: 22 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.silk },
  },
}

// Viewport scale reveal — for metric / stats cards entering view.
export const viewportScaleReveal: Variants = {
  initial: { opacity: 0, scale: 0.94, y: 14 },
  whileInView: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
}

// Slower, more luxurious viewport reveal — editorial sections.
export const luxuryViewportReveal: Variants = {
  initial: { opacity: 0, y: 32 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.hero, ease: easings.silk },
  },
}

// =============================================================================
// PAGE TRANSITIONS — keep snappy enough for SPA feel, richer than before
// =============================================================================

export const premiumPageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easings.luxury },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: durations.quick, ease: easings.exit },
  },
}

// Pure opacity crossfade — no vertical motion.
export const crossfadeTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.base, ease: easings.silk } },
  exit: { opacity: 0, transition: { duration: durations.quick, ease: easings.exit } },
}

// =============================================================================
// STAGGER SYSTEM
// =============================================================================

// Standard stagger — lists, grids.
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: delays.staggerTight,
      delayChildren: delays.stagger,
    },
  },
}

// Slower stagger for hero / featured sections.
export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: delays.staggerLuxury,
      delayChildren: delays.afterShell,
    },
  },
}

// Standard stagger item — calm rise.
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easings.luxury },
  },
}

// Luxury stagger item — slightly richer travel.
export const luxuryStaggerItem: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.silk },
  },
}

// Scale stagger item — grid layouts and cards.
export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easings.luxury },
  },
}

// =============================================================================
// BUTTON / INTERACTION VARIANTS
// =============================================================================

export const buttonHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.015,
    transition: { duration: durations.micro, ease: easings.luxury },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1, ease: easings.exit },
  },
}

// Premium CTA — slightly more expressive.
export const magneticButtonVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.022,
    y: -1,
    transition: { duration: durations.quick, ease: easings.luxury },
  },
  tap: {
    scale: 0.965,
    y: 0,
    transition: { duration: 0.1, ease: easings.exit },
  },
}

// Icon button — compact, crisp.
export const iconButtonVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: durations.micro, ease: easings.gentle },
  },
  tap: {
    scale: 0.92,
    transition: { duration: 0.08, ease: easings.exit },
  },
}

// Ghost button — nearly invisible motion.
export const ghostButtonVariants: Variants = {
  initial: { scale: 1, opacity: 1 },
  hover: {
    scale: 1.008,
    opacity: 0.92,
    transition: { duration: durations.micro, ease: easings.gentle },
  },
  tap: {
    scale: 0.985,
    opacity: 0.85,
    transition: { duration: 0.08 },
  },
}

// =============================================================================
// NUMBER / METRIC EMPHASIS
// =============================================================================

export const numberReveal: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
}

// =============================================================================
// MODAL / BACKDROP
// =============================================================================

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.quick, ease: easings.silk } },
  exit: { opacity: 0, transition: { duration: durations.quick, ease: easings.exit } },
}

export const premiumBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.base, ease: easings.silk },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.quick, ease: easings.exit },
  },
}

// Bottom sheet — rich luxury slide.
export const bottomSheetVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: durations.base, ease: easings.exit },
  },
}

// =============================================================================
// CHIP / BADGE
// =============================================================================

export const chipVariants: Variants = {
  initial: { scale: 0.92, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springs.snappy,
  },
  tap: { scale: 0.95, transition: { duration: 0.08 } },
}

export const badgeEntrance: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: springs.snappy,
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.18 } },
}

// =============================================================================
// TOGGLE / SWITCH
// =============================================================================

export const toggleVariants: Variants = {
  off: { x: 0 },
  on: { x: 24 },
}

// =============================================================================
// LIST CASCADE
// =============================================================================

export const cascadingItem: Variants = {
  initial: { opacity: 0, x: -18 },
  animate: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * delays.staggerTight,
      duration: durations.base,
      ease: easings.luxury,
    },
  }),
  exit: { opacity: 0, x: 18, transition: { duration: durations.quick, ease: easings.exit } },
}

// =============================================================================
// SCREEN / SUCCESS / RIPPLE
// =============================================================================

export const screenTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.base, ease: easings.luxury },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.quick, ease: easings.exit },
  },
}

export const successCheckmark: Variants = {
  initial: { scale: 0, rotate: -45 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: springs.snappy,
  },
}

export const rippleVariants: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: { scale: 4, opacity: 0 },
}

// =============================================================================
// WRAPPER COMPONENTS
// =============================================================================

// Animated card wrapper — pairs stagger + hover lift.
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
        transition={{ ...springs.smooth, delay } as Transition}
        {...props}
      >
        <motion.div variants={cardLift}>{children}</motion.div>
      </motion.div>
    )
  }
)
AnimatedCard.displayName = 'AnimatedCard'

// Page transition wrapper — luxury default.
interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: durations.base, ease: easings.luxury }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Cinematic page transition — used at the app-shell level for route changes.
// Slightly longer and with a gentle y-rise for a premium route feel.
export function CinematicPageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: durations.base, ease: easings.silk }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger list wrapper — animates children in sequence.
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

// =============================================================================
// SKELETONS
// =============================================================================

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-muted', className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function PremiumSkeletonShimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('rounded-xl bg-muted', className)}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

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

// =============================================================================
// NUMBER TICKER — for dashboard metrics
// =============================================================================

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
      transition={{ duration: durations.reveal, ease: easings.luxury }}
      className={className}
    >
      {prefix}
      {value.toLocaleString('en-IN')}
    </motion.span>
  )
}

// =============================================================================
// PROGRESS RING — cinematic stroke sweep with silk ease
// =============================================================================

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
  className,
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
        transition={{ duration: durations.settle + 0.4, ease: easings.silk }}
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

// =============================================================================
// RE-EXPORT AnimatePresence for convenience
// =============================================================================

export { AnimatePresence }
