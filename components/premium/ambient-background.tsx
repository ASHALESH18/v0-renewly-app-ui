'use client'

import { useEffect, useState } from 'react'

interface AmbientBackgroundProps {
  variant?: 'hero' | 'section' | 'card' | 'dashboard'
  intensity?: 'subtle' | 'medium' | 'dramatic'
  className?: string
  children?: React.ReactNode
}

// Mobile detection hook
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
    checkMobile()
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(checkMobile, 150)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return isMobile
}

export function AmbientBackground({
  variant = 'section',
  intensity = 'medium',
  className = '',
  children,
}: AmbientBackgroundProps) {
  const isMobile = useIsMobile()

  const intensityConfig = {
    subtle: { glow: 0.03, orb: 0.04, grain: 0.015 },
    medium: { glow: 0.06, orb: 0.08, grain: 0.02 },
    dramatic: { glow: 0.1, orb: 0.12, grain: 0.025 },
  }

  const config = intensityConfig[intensity]

  // On mobile: minimal static background for 60fps performance
  if (isMobile) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: variant === 'hero' 
              ? 'radial-gradient(ellipse 100% 70% at 50% 30%, rgba(199, 163, 106, 0.06) 0%, transparent 60%)'
              : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(199, 163, 106, 0.03) 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    )
  }

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

      {/* Static orbs on desktop - no animation for smoother scrolling */}
      <div
        className="absolute pointer-events-none rounded-full blur-[120px]"
        style={{
          width: variant === 'hero' ? '800px' : '500px',
          height: variant === 'hero' ? '800px' : '500px',
          top: variant === 'hero' ? '-20%' : '10%',
          left: variant === 'hero' ? '10%' : '20%',
          background: `radial-gradient(circle, rgba(199, 163, 106, ${config.orb}) 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <div
        className="absolute pointer-events-none rounded-full blur-[100px]"
        style={{
          width: variant === 'hero' ? '600px' : '400px',
          height: variant === 'hero' ? '600px' : '400px',
          bottom: variant === 'hero' ? '-10%' : '20%',
          right: variant === 'hero' ? '5%' : '10%',
          background: `radial-gradient(circle, rgba(188, 194, 204, ${config.orb * 0.6}) 0%, transparent 70%)`,
          opacity: 0.4,
        }}
      />

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
