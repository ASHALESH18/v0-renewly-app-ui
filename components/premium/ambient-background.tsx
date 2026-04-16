'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AmbientBackgroundProps {
  variant?: 'hero' | 'section' | 'card' | 'dashboard'
  intensity?: 'subtle' | 'medium' | 'dramatic'
  className?: string
  children?: React.ReactNode
}

export function AmbientBackground({
  variant = 'section',
  intensity = 'medium',
  className = '',
  children,
}: AmbientBackgroundProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const intensityConfig = {
    subtle: { glow: 0.03, orb: 0.04, grain: 0.015 },
    medium: { glow: 0.06, orb: 0.08, grain: 0.02 },
    dramatic: { glow: 0.1, orb: 0.12, grain: 0.025 },
  }

  const config = intensityConfig[intensity]

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base gradient layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: variant === 'hero'
            ? 'radial-gradient(ellipse 100% 70% at 50% 30%, rgba(199, 163, 106, 0.08) 0%, transparent 60%)'
            : variant === 'dashboard'
              ? 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(199, 163, 106, 0.04) 0%, transparent 50%)'
              : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(199, 163, 106, 0.03) 0%, transparent 50%)'
        }}
      />

      {/* Animated mesh gradient orbs */}
      {mounted && (
        <>
          {/* Primary gold orb */}
          <motion.div
            className="absolute pointer-events-none rounded-full blur-[120px]"
            style={{
              width: variant === 'hero' ? '800px' : '500px',
              height: variant === 'hero' ? '800px' : '500px',
              top: variant === 'hero' ? '-20%' : '10%',
              left: variant === 'hero' ? '10%' : '20%',
              background: `radial-gradient(circle, rgba(199, 163, 106, ${config.orb}) 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.4, 0.7, 0.4],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Secondary platinum orb */}
          <motion.div
            className="absolute pointer-events-none rounded-full blur-[100px]"
            style={{
              width: variant === 'hero' ? '600px' : '400px',
              height: variant === 'hero' ? '600px' : '400px',
              bottom: variant === 'hero' ? '-10%' : '20%',
              right: variant === 'hero' ? '5%' : '10%',
              background: `radial-gradient(circle, rgba(188, 194, 204, ${config.orb * 0.6}) 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, -25, 0],
              y: [0, 15, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />

          {/* Accent emerald orb */}
          {(variant === 'hero' || variant === 'dashboard') && (
            <motion.div
              className="absolute pointer-events-none rounded-full blur-[80px]"
              style={{
                width: '300px',
                height: '300px',
                top: '60%',
                left: '60%',
                background: `radial-gradient(circle, rgba(46, 94, 82, ${config.orb * 0.5}) 0%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 4,
              }}
            />
          )}
        </>
      )}

      {/* Animated light sweep */}
      {mounted && variant === 'hero' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(115deg, transparent 40%, rgba(199, 163, 106, 0.03) 50%, transparent 60%)',
          }}
          animate={{
            opacity: [0, 0.8, 0],
            x: ['-100%', '200%', '200%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatDelay: 12,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(199, 163, 106, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(199, 163, 106, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: config.grain,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, var(--hero-vignette) 100%)',
          opacity: variant === 'hero' ? 0.6 : 0.3,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

