'use client'

import { motion, type Variants } from 'framer-motion'
import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { viewportFadeInUp, viewportStaggerContainer, viewportStaggerItem } from './motion'

/**
 * MotionSection
 * 
 * Reusable wrapper for viewport-triggered section reveals.
 * Automatically triggers staggered animation when section enters viewport.
 * Perfect for Dashboard, Analytics, Calendar sections.
 * 
 * Features:
 * - Once: true prevents re-animation on scroll
 * - Staggered children reveal automatically
 * - Slower, premium timings for luxury feel
 * - Accessible with proper semantic markup
 */

interface MotionSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'stagger' | 'scale'
  delay?: number
  className?: string
  asChild?: boolean
}

export const MotionSection = forwardRef<HTMLDivElement, MotionSectionProps>(
  ({ children, variant = 'default', delay = 0, className, ...props }, ref) => {
    const variants: Record<string, Variants> = {
      default: viewportFadeInUp,
      stagger: viewportStaggerContainer,
      scale: viewportFadeInUp,
    }

    return (
      <motion.section
        ref={ref}
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        variants={variants[variant]}
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
 * Grid container with staggered item reveals.
 * Each child automatically gets staggered animation.
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
        viewport={{ once: true, margin: '0px 0px -50px 0px' }}
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
