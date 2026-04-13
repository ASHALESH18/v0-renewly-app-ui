'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface LuxuryDividerProps {
  variant?: 'line' | 'fade' | 'glow' | 'diamond'
  className?: string
}

export function LuxuryDivider({ variant = 'line', className = '' }: LuxuryDividerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  if (variant === 'diamond') {
    return (
      <div ref={ref} className={cn('flex items-center justify-center py-12', className)}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-px w-32 bg-gradient-to-r from-transparent to-border"
        />
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          animate={isInView ? { scale: 1, rotate: 45 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-2 h-2 bg-gold/60 mx-4"
        />
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isInView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-px w-32 bg-gradient-to-l from-transparent to-border"
        />
      </div>
    )
  }

  if (variant === 'glow') {
    return (
      <div ref={ref} className={cn('relative h-px my-16', className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent" />
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: [0, 0.6, 0] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute -top-4 -bottom-4 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent"
        />
      </div>
    )
  }

  if (variant === 'fade') {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className={cn('h-24 relative', className)}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent" />
      </motion.div>
    )
  }

  // Default line variant
  return (
    <motion.div
      ref={ref}
      initial={{ scaleX: 0 }}
      animate={isInView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn('h-px bg-gradient-to-r from-transparent via-border to-transparent my-12', className)}
    />
  )
}

interface FloatingAccentProps {
  position?: 'left' | 'right' | 'center'
  className?: string
}

export function FloatingAccent({ position = 'right', className = '' }: FloatingAccentProps) {
  const positionStyles = {
    left: 'left-0 -translate-x-1/2',
    right: 'right-0 translate-x-1/2',
    center: 'left-1/2 -translate-x-1/2',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none',
        positionStyles[position],
        className
      )}
    >
      <motion.div
        className="w-full h-full rounded-full bg-gold/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
