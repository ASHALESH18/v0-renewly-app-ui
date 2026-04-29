'use client'

import { type Variants } from 'framer-motion'
import { durations, easings } from '@/components/motion'

/**
 * Logo Animation Variants
 * Subtle, premium animations for the Renewly logo across all instances
 * Responsive and optimized for different screen sizes
 */

// Gentle pulse effect - a subtle, continuous, breathing animation
export const logoPulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.95, 1],
    transition: {
      duration: 3,
      ease: easings.quiet,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
}

// Elegant entrance fade-in with subtle scale
export const logoFadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.base, ease: easings.silk },
  },
}

// Smooth fade-in (for minimal animation contexts)
export const logoFadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: durations.base, ease: easings.silk },
  },
}

// Hover interaction - gentle lift and glow-like scale
export const logoHover: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -2,
    scale: 1.08,
    transition: { duration: durations.micro, ease: easings.premium },
  },
  tap: {
    y: 0,
    scale: 0.98,
    transition: { duration: durations.quick, ease: easings.exit },
  },
}

// Subtle floating motion - ambient and non-intrusive
export const logoFloat: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 4,
      ease: easings.quiet,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
}

// Glow effect container - for icon glow animations
export const logoGlow: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2.5,
      ease: easings.quiet,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
}

// Combined entrance with subtle pulse - best for prominent placements
export const logoEntranceWithPulse: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.reveal, ease: easings.silk },
  },
}

// Icon-only animations (for the Calendar-R icon specifically)
export const logoIconSpinHover: Variants = {
  initial: { rotate: 0 },
  hover: {
    rotate: 5,
    transition: { duration: durations.micro, ease: easings.premium },
  },
}

/**
 * Responsive animation configuration
 * Automatically adjusts animation intensity based on screen size and user preferences
 */
export type LogoAnimationType = 
  | 'pulse' 
  | 'fade-in' 
  | 'fade-in-scale' 
  | 'float' 
  | 'glow' 
  | 'entrance-with-pulse'
  | 'none'

export const logoAnimationMap: Record<LogoAnimationType, Variants> = {
  'pulse': logoPulse,
  'fade-in': logoFadeIn,
  'fade-in-scale': logoFadeInScale,
  'float': logoFloat,
  'glow': logoGlow,
  'entrance-with-pulse': logoEntranceWithPulse,
  'none': {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  },
}

/**
 * Hook to get responsive animation type based on screen size
 * Heavier animations on desktop, lighter on mobile
 */
export function getResponsiveLogoAnimation(
  type: LogoAnimationType,
  isMobile: boolean,
  prefersReducedMotion: boolean
): LogoAnimationType {
  if (prefersReducedMotion) return 'fade-in'
  
  // Mobile: lighter animations
  if (isMobile) {
    if (type === 'pulse') return 'fade-in'
    if (type === 'float') return 'fade-in'
    if (type === 'entrance-with-pulse') return 'fade-in-scale'
  }
  
  return type
}
