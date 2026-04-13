'use client'

import { motion } from 'framer-motion'

interface DramaticAmbientProps {
  variant?: 'hero' | 'section' | 'card'
  intensity?: 'subtle' | 'medium' | 'high'
  showGrid?: boolean
  showOrbs?: boolean
}

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
      
      {/* Dramatic orb effects */}
      {showOrbs && (
        <>
          {/* Large gold orb - top right */}
          <motion.div
            className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(199, 163, 106, ${opacity.orb}) 0%, rgba(199, 163, 106, ${opacity.orb * 0.3}) 40%, transparent 70%)`,
              filter: 'blur(80px)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
              y: [0, 20, 0],
              opacity: [opacity.orb, opacity.orb * 1.5, opacity.orb]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Emerald orb - bottom left */}
          <motion.div
            className="absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(46, 94, 82, ${opacity.orb * 0.8}) 0%, rgba(46, 94, 82, ${opacity.orb * 0.2}) 40%, transparent 70%)`,
              filter: 'blur(100px)'
            }}
            animate={{
              scale: [1, 1.15, 1],
              x: [0, -20, 0],
              y: [0, -30, 0],
              opacity: [opacity.orb * 0.6, opacity.orb, opacity.orb * 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2
            }}
          />
          
          {/* Tertiary accent orb - center */}
          {variant === 'hero' && (
            <motion.div
              className="absolute top-[40%] left-[50%] w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
              style={{
                background: `radial-gradient(ellipse at center, rgba(199, 163, 106, ${opacity.orb * 0.5}) 0%, transparent 60%)`,
                filter: 'blur(120px)'
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut'
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
      
      {/* Spotlight effect for hero */}
      {variant === 'hero' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent"
          style={{ width: '200%', left: '-100%' }}
          animate={{
            x: ['0%', '100%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 4
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

// Standalone orb component for manual placement
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
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[color]} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`
      }}
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.4, 0.7, 0.4]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  )
}
