'use client'

interface GlowOrbProps {
  color?: 'gold' | 'platinum' | 'emerald' | 'crimson'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  blur?: number
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

/**
 * Static glow orb - no animation for 60fps performance
 */
export function GlowOrb({
  color = 'gold',
  size = 'md',
  position = { top: '50%', left: '50%' },
  blur = 100,
  className = '',
}: GlowOrbProps) {
  const orbSize = sizeMap[size]
  const orbColor = colorMap[color]

  return (
    <div
      className={`absolute pointer-events-none rounded-full ${className}`}
      style={{
        width: orbSize,
        height: orbSize,
        filter: `blur(${blur}px)`,
        background: `radial-gradient(circle, ${orbColor} 0%, transparent 70%)`,
        opacity: 0.5,
        ...position,
        transform: 'translate(-50%, -50%)',
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
        <GlowOrb color="gold" size="xl" position={{ top: '20%', left: '15%' }} />
        <GlowOrb color="platinum" size="lg" position={{ top: '60%', right: '10%' }} />
        <GlowOrb color="emerald" size="md" position={{ bottom: '20%', left: '40%' }} />
      </div>
    )
  }

  if (variant === 'dashboard') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <GlowOrb color="gold" size="lg" position={{ top: '10%', right: '20%' }} blur={120} />
        <GlowOrb color="platinum" size="md" position={{ bottom: '30%', left: '10%' }} blur={80} />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <GlowOrb color="gold" size="md" position={{ top: '30%', left: '20%' }} blur={80} />
      <GlowOrb color="platinum" size="sm" position={{ bottom: '40%', right: '20%' }} blur={60} />
    </div>
  )
}
