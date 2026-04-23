'use client'

import { motion, type Variants } from 'framer-motion'
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import {
  viewportFadeInUp,
  viewportFadeInUpSlow,
  viewportStaggerContainer,
  viewportStaggerItem,
  viewportScaleReveal,
  luxuryViewportReveal,
  heroReveal,
  heroStagger,
  metricReveal,
  durations,
  easings,
} from './motion'

/**
 * MotionSection
 *
 * Reusable wrapper for viewport-triggered section reveals.
 * Uses the shared motion primitives so every screen benefits from the
 * same luxury timing hierarchy and easing curves.
 *
 * Variants:
 *  - default  — standard cinematic section reveal
 *  - stagger  — container; children reveal in sequence
 *  - scale    — subtle scale + rise for metric / stat regions
 *  - luxury   — slower, more editorial reveal for lower / detail sections
 *  - hero     — signature hero-level reveal (top of page)
 */

type MotionSectionVariant = 'default' | 'stagger' | 'scale' | 'luxury' | 'hero'

interface MotionSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: MotionSectionVariant
  delay?: number
  className?: string
  /**
   * When true, the reveal runs a little earlier so the animation completes
   * shortly after the user scrolls the section into view.
   */
  eager?: boolean
}

const variantMap: Record<MotionSectionVariant, Variants> = {
  default: viewportFadeInUp,
  stagger: viewportStaggerContainer,
  scale: viewportScaleReveal,
  luxury: luxuryViewportReveal,
  hero: viewportFadeInUpSlow,
}

export const MotionSection = forwardRef<HTMLDivElement, MotionSectionProps>(
  ({ children, variant = 'default', delay = 0, eager = false, className, ...props }, ref) => {
    const margin = eager ? '0px 0px -40px 0px' : '0px 0px -120px 0px'
    return (
      <motion.section
        ref={ref}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin }}
        variants={variantMap[variant]}
        transition={{ delay }}
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </motion.section>
    )
  }
)
MotionSection.displayName = 'MotionSection'

/**
 * MotionSectionItem
 *
 * Wrapper for individual items within a staggered MotionSection.
 * Use inside a MotionSection with variant="stagger".
 */

interface MotionSectionItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  index?: number
}

export const MotionSectionItem = forwardRef<HTMLDivElement, MotionSectionItemProps>(
  ({ children, className, index = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
        variants={viewportStaggerItem}
        custom={index}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionSectionItem.displayName = 'MotionSectionItem'

/**
 * MotionGrid
 *
 * Grid container with staggered item reveals triggered on viewport enter.
 * Each child automatically gets cascading motion.
 */

interface MotionGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  columns?: number
  gap?: string
  className?: string
}

export const MotionGrid = forwardRef<HTMLDivElement, MotionGridProps>(
  ({ children, columns = 3, gap = 'gap-6', className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        variants={viewportStaggerContainer}
        className={cn(`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`, gap, className)}
      >
        {children}
      </motion.div>
    )
  }
)
MotionGrid.displayName = 'MotionGrid'

/**
 * MotionGridItem
 *
 * Individual item in MotionGrid with automatic stagger.
 */

interface MotionGridItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  index?: number
  className?: string
}

export const MotionGridItem = forwardRef<HTMLDivElement, MotionGridItemProps>(
  ({ children, index = 0, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
        variants={viewportStaggerItem}
        custom={index}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionGridItem.displayName = 'MotionGridItem'

/**
 * MotionHero
 *
 * Signature page-top entrance — runs on mount rather than on viewport.
 * Uses the luxury hero reveal curve with a slightly longer delay before
 * children cascade in. Pair with MotionHeroItem for staggered content.
 */

interface MotionHeroProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  delay?: number
  /** When true, acts as a stagger container for MotionHeroItem children. */
  stagger?: boolean
}

export const MotionHero = forwardRef<HTMLDivElement, MotionHeroProps>(
  ({ children, className, delay = 0, stagger = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="initial"
        animate="animate"
        variants={stagger ? heroStagger : heroReveal}
        transition={{ delay }}
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionHero.displayName = 'MotionHero'

/**
 * MotionHeroItem
 *
 * Child item inside MotionHero (when stagger={true}).
 * Uses the metric-reveal curve for a calm, confident rise.
 */

interface MotionHeroItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  /** Optional explicit delay on top of the parent stagger. */
  delay?: number
}

export const MotionHeroItem = forwardRef<HTMLDivElement, MotionHeroItemProps>(
  ({ children, className, delay, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={metricReveal}
        transition={delay !== undefined ? { delay } : undefined}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionHeroItem.displayName = 'MotionHeroItem'

/**
 * MotionCascade
 *
 * Lightweight cascade wrapper — animates children with a predictable
 * delay pattern on mount. Useful for settings rows, inbox cards, notification
 * rows, integration groups, and anywhere you want a premium "list cascade"
 * without writing bespoke variants.
 */

interface MotionCascadeProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  /** Delay in seconds between siblings. Defaults to 0.08. */
  stagger?: number
  /** Delay in seconds before the cascade begins. Defaults to 0.1. */
  startDelay?: number
  /** When true, triggers when entering viewport instead of on mount. */
  inView?: boolean
}

export const MotionCascade = forwardRef<HTMLDivElement, MotionCascadeProps>(
  ({ children, className, stagger = 0.08, startDelay = 0.1, inView = false, ...props }, ref) => {
    const container: Variants = {
      initial: {},
      animate: {
        transition: {
          staggerChildren: stagger,
          delayChildren: startDelay,
        },
      },
      whileInView: {
        transition: {
          staggerChildren: stagger,
          delayChildren: startDelay,
        },
      },
    }

    const trigger = inView
      ? {
          initial: 'initial' as const,
          whileInView: 'whileInView' as const,
          viewport: { once: true, margin: '0px 0px -100px 0px' },
        }
      : {
          initial: 'initial' as const,
          animate: 'animate' as const,
        }

    return (
      <motion.div
        ref={ref}
        variants={container}
        {...trigger}
        className={cn('relative', className)}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionCascade.displayName = 'MotionCascade'

/**
 * MotionCascadeItem
 *
 * Child for MotionCascade. Uses the luxury silk reveal with a short travel
 * so groups feel intentional rather than busy.
 */

interface MotionCascadeItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

const cascadeItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
}

export const MotionCascadeItem = forwardRef<HTMLDivElement, MotionCascadeItemProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={cascadeItemVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionCascadeItem.displayName = 'MotionCascadeItem'
