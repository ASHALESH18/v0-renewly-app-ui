'use client'

import React, { useMemo, useEffect, useState } from 'react'

// Generate random particles for the floating gold dust effect
function generateParticles(count: number, seed: number = 1): Array<{
  cx: number
  cy: number
  r: number
  delay: number
  duration: number
  drift: number
}> {
  const particles = []
  for (let i = 0; i < count; i++) {
    // Pseudo-random distribution using seed
    const hash = (seed * 9301 + i * 49297) % 233280
    const rand = () => {
      const next = (hash * 9301 + 49297) % 233280
      return next / 233280
    }
    
    particles.push({
      cx: (hash % 1600),
      cy: ((hash * 7) % 900) + 50,
      r: 0.8 + (hash % 100) / 50, // 0.8 to 2.8
      delay: (i % 20) * 0.8,
      duration: 16 + (hash % 12),
      drift: ((hash % 60) - 30), // -30 to 30
    })
  }
  return particles
}

// Particle group for the dust effect - optimized for mobile
function DustParticleGroup({
  particles,
  baseColor,
  glowColor,
  animationClass,
  disableAnimation = false,
}: {
  particles: Array<{ cx: number; cy: number; r: number; delay: number; duration: number; drift: number }>
  baseColor: string
  glowColor: string
  animationClass: string
  disableAnimation?: boolean
}) {
  return (
    <g className={animationClass}>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={baseColor}
          opacity={disableAnimation ? 0.35 : undefined}
          style={disableAnimation ? undefined : {
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {!disableAnimation && (
            <animate
              attributeName="opacity"
              values="0.1;0.6;0.1"
              dur={`${p.duration}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      ))}
    </g>
  )
}

// Mobile detection hook
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    // Debounced resize handler
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

export function AmbientBackground() {
  const isMobile = useIsMobile()
  
  // On mobile: minimal particles, no animations for 60fps scrolling
  // On desktop: moderate particles with subtle animation
  const particleCount = isMobile 
    ? { gold: 8, secondary: 5, accent: 3 } 
    : { gold: 25, secondary: 15, accent: 10 }
  
  // Generate particles - memoized to prevent re-renders
  const goldParticles = useMemo(() => generateParticles(particleCount.gold, 1), [particleCount.gold])
  const goldSecondary = useMemo(() => generateParticles(particleCount.secondary, 2), [particleCount.secondary])
  const goldAccent = useMemo(() => generateParticles(particleCount.accent, 3), [particleCount.accent])

  // On mobile: render only static base layers, no SVG particles
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* Static base layer only on mobile for max performance */}
        <div className="ambient-base" />
        <div className="ambient-soft-wash" />
        {/* Single static glow - no animation */}
        <div className="ambient-glow ambient-glow--center" />
        <div className="ambient-vignette" />
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Base layer - deep obsidian (dark) / warm ivory (light) */}
      <div className="ambient-base" />
      
      {/* Soft ambient wash for depth */}
      <div className="ambient-soft-wash" />

      {/* Soft glowing areas - only animate on desktop */}
      <div className="ambient-glow ambient-glow--top animate-ambient-breathe-top" />
      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--bottom animate-ambient-breathe-bottom" />

      {/* Primary flowing gold dust wave SVG */}
      <svg
        className="ambient-dust-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gold dust trail gradient - soft matte finish */}
          <linearGradient id="goldDustTrail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="15%" stopColor="rgba(199,163,106,0.06)" />
            <stop offset="50%" stopColor="rgba(212,184,122,0.35)" />
            <stop offset="85%" stopColor="rgba(199,163,106,0.06)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          {/* Gold dust core - brighter inner trail */}
          <linearGradient id="goldDustCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,248,230,0)" />
            <stop offset="30%" stopColor="rgba(229,212,184,0.12)" />
            <stop offset="50%" stopColor="rgba(245,235,210,0.28)" />
            <stop offset="70%" stopColor="rgba(229,212,184,0.12)" />
            <stop offset="100%" stopColor="rgba(255,248,230,0)" />
          </linearGradient>

          {/* Secondary warm trail */}
          <linearGradient id="warmDustTrail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(180,145,80,0)" />
            <stop offset="20%" stopColor="rgba(180,145,80,0.04)" />
            <stop offset="50%" stopColor="rgba(195,165,100,0.18)" />
            <stop offset="80%" stopColor="rgba(180,145,80,0.04)" />
            <stop offset="100%" stopColor="rgba(180,145,80,0)" />
          </linearGradient>

          {/* Soft blur for the outer glow */}
          <filter id="dustBlurSoft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="24" />
          </filter>

          {/* Medium blur for trails */}
          <filter id="dustBlurMedium" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>

          {/* Subtle blur for particles */}
          <filter id="dustBlurParticle" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>

          {/* Radial glow for individual particles */}
          <radialGradient id="particleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(229,212,184,0.9)" />
            <stop offset="40%" stopColor="rgba(199,163,106,0.5)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </radialGradient>
        </defs>

        {/* PRIMARY GOLD DUST WAVE - Main flowing ribbon */}
        <g className="ambient-wave ambient-wave--gold">
          {/* Outer soft glow */}
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -200 280 
               Q 100 380, 400 260 
               T 800 320 
               Q 1000 380, 1200 280 
               T 1800 340"
            stroke="url(#goldDustTrail)"
            strokeWidth="120"
            filter="url(#dustBlurSoft)"
          />
          
          {/* Inner bright core */}
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -200 280 
               Q 100 380, 400 260 
               T 800 320 
               Q 1000 380, 1200 280 
               T 1800 340"
            stroke="url(#goldDustCore)"
            strokeWidth="24"
            filter="url(#dustBlurMedium)"
          />

          {/* Floating gold dust particles along the wave */}
          <DustParticleGroup
            particles={goldParticles}
            baseColor="rgba(229, 212, 184, 0.7)"
            glowColor="rgba(199, 163, 106, 0.4)"
            animationClass="ambient-particles ambient-particles--gold"
            disableAnimation={isMobile}
          />
        </g>

        {/* SECONDARY WARM WAVE - Lower subtle ribbon */}
        <g className="ambient-wave ambient-wave--warm">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -150 620 
               Q 200 540, 500 650 
               T 900 580 
               Q 1100 520, 1400 640 
               T 1850 570"
            stroke="url(#warmDustTrail)"
            strokeWidth="80"
            filter="url(#dustBlurSoft)"
          />

          <DustParticleGroup
            particles={goldSecondary}
            baseColor="rgba(195, 165, 100, 0.5)"
            glowColor="rgba(180, 145, 80, 0.3)"
            animationClass="ambient-particles ambient-particles--warm"
            disableAnimation={isMobile}
          />
        </g>

        {/* ACCENT PARTICLES - Scattered floating dust */}
        <g className="ambient-wave ambient-wave--accent">
          <DustParticleGroup
            particles={goldAccent}
            baseColor="rgba(245, 235, 210, 0.6)"
            glowColor="rgba(229, 212, 184, 0.35)"
            animationClass="ambient-particles ambient-particles--accent"
            disableAnimation={isMobile}
          />
        </g>
      </svg>

      {/* Subtle texture overlay */}
      <div className="ambient-texture" />
      
      {/* Vignette for cinematic depth */}
      <div className="ambient-vignette" />
    </div>
  )
}
