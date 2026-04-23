'use client'

import { motion, type Variants } from 'framer-motion'
import { type ReactNode } from 'react'
import { durations, easings, springs } from '@/components/motion'

/**
 * Signature Leak Report score reveal.
 * Choreographed in four movements:
 *   1. The shell rises and fades in.
 *   2. The ambient glow blooms.
 *   3. The progress ring sweeps in with a silk-ease stroke.
 *   4. The score counts up and the inner accents settle.
 * No filter/blur animations — pure transform + opacity for 60fps on mobile.
 */
interface LeakScoreRevealProps {
  score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  isVisible?: boolean
}

export function LeakScoreReveal({ score, severity, isVisible = true }: LeakScoreRevealProps) {
  const getSeverityColor = (sev: typeof severity) => {
    switch (sev) {
      case 'critical':
        return '#FF6B6B'
      case 'high':
        return '#FFA500'
      case 'medium':
        return '#FFD700'
      case 'low':
        return '#90EE90'
      default:
        return '#C7A36A'
    }
  }

  const color = getSeverityColor(severity)
  const circumference = 2 * Math.PI * 75 // r = 75

  return (
    <motion.div
      className="relative w-48 h-48 mx-auto"
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: durations.hero, ease: easings.silk }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="leakGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer rule */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-muted"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 0.12 } : {}}
          transition={{ delay: 0.1, duration: durations.base, ease: easings.silk }}
        />

        {/* Ambient bloom — opacity + scale for a settled luminous feel */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="url(#leakGlow)"
          initial={{ opacity: 0, scale: 0.92 }}
          style={{ transformOrigin: '100px 100px' }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.18, duration: durations.cinematic, ease: easings.silk }}
        />

        {/* Track (muted ring behind the progress) */}
        <circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeOpacity="0.14"
        />

        {/* Progress ring — silk sweep */}
        <motion.circle
          cx="100"
          cy="100"
          r="75"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform="rotate(-90 100 100)"
          initial={{ strokeDashoffset: circumference, opacity: 0 }}
          animate={
            isVisible
              ? {
                  strokeDashoffset: circumference - (score / 100) * circumference,
                  opacity: 1,
                }
              : {}
          }
          transition={{
            strokeDashoffset: { delay: 0.32, duration: durations.settle + 0.3, ease: easings.silk },
            opacity: { delay: 0.24, duration: durations.base, ease: easings.silk },
          }}
        />

        {/* Inner accent ring settles after the sweep */}
        <motion.circle
          cx="100"
          cy="100"
          r="65"
          fill="none"
          stroke={color}
          strokeWidth="1"
          initial={{ opacity: 0, r: 58 }}
          animate={isVisible ? { opacity: 0.3, r: 65 } : {}}
          transition={{ delay: 0.7, duration: durations.cinematic, ease: easings.silk }}
        />

        {/* Pulsing center — restrained, not noisy */}
        <motion.circle
          cx="100"
          cy="100"
          r="4"
          fill={color}
          initial={{ opacity: 0, scale: 0 }}
          style={{ transformOrigin: '100px 100px' }}
          animate={
            isVisible
              ? { opacity: [0.35, 0.7, 0.35], scale: [0.6, 1.4, 0.6] }
              : {}
          }
          transition={{
            delay: 0.9,
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>

      {/* Score label + value */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 6 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.55, duration: durations.cinematic, ease: easings.silk }}
      >
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : {}}
          transition={{ delay: 0.55, duration: durations.base, ease: easings.silk }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-platinum mt-1">Leak Score</span>
      </motion.div>
    </motion.div>
  )
}

/**
 * Insight card reveal — calm cascading entrance with a luxury accent line.
 * Uses index-based stagger for a premium rhythm.
 */
interface InsightCardProps {
  icon: ReactNode
  title: string
  value: string | number
  description: string
  index: number
  isVisible?: boolean
}

export function InsightCardReveal({
  icon,
  title,
  value,
  description,
  index,
  isVisible = true,
}: InsightCardProps) {
  const base = index * 0.11

  return (
    <motion.div
      className="rounded-2xl bg-card border border-border p-6 relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: base,
        duration: durations.cinematic,
        ease: easings.silk,
      }}
    >
      {/* Signature accent line — sweeps in, stays subtle */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent origin-center"
        initial={{ opacity: 0, scaleX: 0.2 }}
        animate={isVisible ? { opacity: 1, scaleX: 1 } : {}}
        transition={{ delay: base + 0.24, duration: durations.cinematic, ease: easings.silk }}
      />

      <div className="flex items-start gap-3 mb-4">
        <motion.div
          className="text-gold text-2xl"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : {}}
          transition={{
            delay: base + 0.32,
            ...springs.snappy,
          }}
        >
          {icon}
        </motion.div>
        <div>
          <p className="text-sm text-platinum">{title}</p>
          <motion.p
            className="text-2xl font-semibold text-ivory"
            initial={{ opacity: 0, y: 6 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: base + 0.42, duration: durations.reveal, ease: easings.silk }}
          >
            {value}
          </motion.p>
        </div>
      </div>

      <motion.p
        className="text-sm text-platinum leading-relaxed"
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: base + 0.52, duration: durations.base, ease: easings.silk }}
      >
        {description}
      </motion.p>
    </motion.div>
  )
}

/**
 * Full-page Leak Report entrance — no blur filters, silk decay, premium rise.
 */
export const leakReportPageVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.hero,
      ease: easings.silk,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: durations.quick, ease: easings.exit },
  },
}
