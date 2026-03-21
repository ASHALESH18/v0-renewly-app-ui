'use client'

import { motion } from 'framer-motion'
import { springs } from '@/components/motion'

interface LeakScoreRevealProps {
  score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  isVisible?: boolean
}

/**
 * Signature Leak Report animation
 * Premium score reveal with radial sweep and luxury feel
 */
export function LeakScoreReveal({ score, severity, isVisible = true }: LeakScoreRevealProps) {
  const getSeverityColor = (sev: typeof severity) => {
    switch (sev) {
      case 'critical': return '#FF6B6B'
      case 'high': return '#FFA500'
      case 'medium': return '#FFD700'
      case 'low': return '#90EE90'
      default: return '#C7A36A'
    }
  }

  const color = getSeverityColor(severity)

  return (
    <motion.div
      className="relative w-48 h-48 mx-auto"
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
      animate={isVisible ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        {/* Outer glow */}
        <defs>
          <radialGradient id="leakGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
          
          <filter id="dropshadow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted opacity-10" />

        {/* Animated radial gradient sweep */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#leakGlow)"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        />

        {/* Progress ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 471} 471`}
          strokeDashoffset="0"
          transform="rotate(-90 100 100)"
          initial={{ strokeDasharray: '0 471', opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{
            strokeDasharray: { delay: 0.4, duration: 1.2, ease: 'easeOut' },
            opacity: { delay: 0.3, duration: 0.5 },
          }}
        />

        {/* Inner accent circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="65"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.3"
          initial={{ opacity: 0, r: 55 }}
          animate={isVisible ? { opacity: 0.3, r: 65 } : {}}
          transition={{ delay: 0.6, duration: 0.8 }}
        />

        {/* Pulsing center accent */}
        <motion.circle
          cx="100"
          cy="100"
          r="5"
          fill={color}
          initial={{ opacity: 0, r: 0 }}
          animate={isVisible ? { opacity: [0.4, 0.8, 0.4], r: [0, 8, 0] } : {}}
          transition={{
            opacity: { delay: 0.8, duration: 2, repeat: Infinity },
            r: { delay: 0.8, duration: 2, repeat: Infinity },
          }}
        />
      </svg>

      {/* Score text - count up animation */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <motion.span
          className="text-4xl font-bold"
          style={{ color }}
          initial={0}
          animate={isVisible ? score : 0}
          transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
        >
          {/* @ts-expect-error motion number animation */}
          {(val) => Math.round(val as number)}
        </motion.span>
        <span className="text-sm text-platinum mt-1">Leak Score</span>
      </motion.div>
    </motion.div>
  )
}

/**
 * Insight card reveal animation - cascade effect
 */
interface InsightCardProps {
  icon: ReactNode
  title: string
  value: string | number
  description: string
  index: number
  isVisible?: boolean
}

import { type ReactNode } from 'react'

export function InsightCardReveal({
  icon,
  title,
  value,
  description,
  index,
  isVisible = true,
}: InsightCardProps) {
  return (
    <motion.div
      className="rounded-2xl bg-card border border-border p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={isVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{
        delay: index * 0.12,
        duration: 0.6,
        ease: 'easeOut',
      }}
    >
      {/* Luxury accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isVisible ? { opacity: 1, scaleX: 1 } : {}}
        transition={{ delay: index * 0.12 + 0.3, duration: 0.6 }}
      />

      <div className="flex items-start gap-3 mb-4">
        <motion.div
          className="text-gold text-2xl"
          initial={{ scale: 0, rotate: -45 }}
          animate={isVisible ? { scale: 1, rotate: 0 } : {}}
          transition={{
            delay: index * 0.12 + 0.4,
            ...springs.gentle,
          }}
        >
          {icon}
        </motion.div>
        <div>
          <p className="text-sm text-platinum">{title}</p>
          <motion.p
            className="text-2xl font-semibold text-ivory"
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ delay: index * 0.12 + 0.5, duration: 0.5 }}
          >
            {value}
          </motion.p>
        </div>
      </div>

      <motion.p
        className="text-sm text-platinum leading-relaxed"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: index * 0.12 + 0.6, duration: 0.5 }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

/**
 * Full page Leak Report entrance animation
 */
export const leakReportPageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(8px)',
    transition: { duration: 0.3 },
  },
}
