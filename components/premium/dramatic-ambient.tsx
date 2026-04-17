'use client'

interface DramaticAmbientProps {
  variant?: 'hero' | 'section' | 'card'
  intensity?: 'subtle' | 'medium' | 'high'
  showGrid?: boolean
  showOrbs?: boolean
}

/**
 * Performance-optimized ambient background
 * No animations - static orbs and gradients for 60fps scrolling
 */
export function DramaticAmbient({ 
  variant = 'section', 
  intensity = 'medium',
  showGrid = true,
  showOrbs = true
}: DramaticAmbientProps) {
  const opacityMap = {
    subtle: { orb: 0.15, grid: 0.01 },
    medium: { orb: 0.25, grid: 0.02 },
    high: { orb: 0.4, grid: 0.03 }
  }
  
  const opacity = opacityMap[intensity]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary atmospheric gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
      
      {/* Static orb effects - no animation for performance */}
      {showOrbs && (
        <>
          {/* Large gold orb - top right */}
          <div
            className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(199, 163, 106, ${opacity.orb}) 0%, rgba(199, 163, 106, ${opacity.orb * 0.3}) 40%, transparent 70%)`,
              filter: 'blur(80px)',
              opacity: opacity.orb,
            }}
          />
          
          {/* Emerald orb - bottom left */}
          <div
            className="absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(46, 94, 82, ${opacity.orb * 0.8}) 0%, rgba(46, 94, 82, ${opacity.orb * 0.2}) 40%, transparent 70%)`,
              filter: 'blur(100px)',
              opacity: opacity.orb * 0.6,
            }}
          />
          
          {/* Tertiary accent orb - center (hero only) */}
          {variant === 'hero' && (
            <div
              className="absolute top-[40%] left-[50%] w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background: `radial-gradient(ellipse at center, rgba(199, 163, 106, ${opacity.orb * 0.5}) 0%, transparent 60%)`,
                filter: 'blur(120px)',
                opacity: 0.4,
              }}
            />
          )}
        </>
      )}
      
      {/* Subtle grid pattern */}
      {showGrid && (
        <div 
          className="absolute inset-0"
          style={{
            opacity: opacity.grid,
            backgroundImage: `
              linear-gradient(rgba(199, 163, 106, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(199, 163, 106, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: variant === 'hero' ? '100px 100px' : '60px 60px'
          }}
        />
      )}
      
      {/* Top edge highlight */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      
      {/* Vignette for depth */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, rgba(10, 10, 13, 0.15) 100%)'
        }}
      />
    </div>
  )
}

// Standalone static orb component - no animation for performance
export function GlowOrb({ 
  color = 'gold', 
  size = 400, 
  blur = 80,
  className = ''
}: { 
  color?: 'gold' | 'emerald' | 'crimson'
  size?: number
  blur?: number
  className?: string
}) {
  const colors = {
    gold: 'rgba(199, 163, 106, 0.3)',
    emerald: 'rgba(46, 94, 82, 0.25)',
    crimson: 'rgba(122, 57, 64, 0.2)'
  }

  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity: 0.5,
      }}
    />
  )
}
