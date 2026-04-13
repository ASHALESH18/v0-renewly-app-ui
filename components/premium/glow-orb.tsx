'use client'

import { motion } from 'framer-motion'

interface GlowOrbProps {
  color?: 'gold' | 'platinum' | 'emerald' | 'crimson'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  blur?: number
  animate?: boolean
  delay?: number
  className?: string
}

const colorMap = {
  gold: 'rgba(199, 163, 106, 0.12)',
  platinum: 'rgba(188, 194, 204, 0.1)',
  emerald: 'rgba(46, 94, 82, 0.1)',
  crimson: 'rgba(122, 57, 64, 0.08)',
}

const sizeMap = {
  sm: 150,
  md: 300,
  lg: 500,
  xl: 800,
}

export function GlowOrb({
  color = 'gold',
  size = 'md',
  position = { top: '50%', left: '50%' },
  blur = 100,
  animate = true,
  delay = 0,
  className = '',
}: GlowOrbProps) {
  const orbSize = sizeMap[size]
  const orbColor = colorMap[color]

  return (
    <motion.div
      className={`absolute pointer-events-none rounded-full ${className}`}
      style={{
        width: orbSize,
        height: orbSize,
        filter: `blur(${blur}px)`,
        background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)`,
        ...position,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={animate ? {
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.15, 1],
      } : { opacity: 0.5, scale: 1 }}
      transition={{
        duration: 12 + delay,
        repeat: animate ? Infinity : 0,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}

interface FloatingGlowsProps {
  variant?: 'hero' | 'section' | 'dashboard'
}

export function FloatingGlows({ variant = 'section' }: FloatingGlowsProps) {
  if (variant === 'hero') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <GlowOrb color="gold" size="xl" position={{ top: '20%', left: '15%' }} delay={0} />
        <GlowOrb color="platinum" size="lg" position={{ top: '60%', right: '10%' }} delay={3} />
        <GlowOrb color="emerald" size="md" position={{ bottom: '20%', left: '40%' }} delay={6} />
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <GlowOrb color="gold" size="lg" position={{ top: '10%', right: '20%' }} blur={120} delay={0} />
        <GlowOrb color="platinum" size="md" position={{ bottom: '30%', left: '10%' }} blur={80} delay={4} />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <GlowOrb color="gold" size="md" position={{ top: '30%', left: '20%' }} blur={80} delay={0} />
      <GlowOrb color="platinum" size="sm" position={{ bottom: '40%', right: '20%' }} blur={60} delay={2} />
    </div>
  )
}
