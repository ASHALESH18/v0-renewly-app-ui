'use client'

import React, { useMemo } from 'react'

// Generate random particles for the floating gold dust effect
function generateParticles(count: number, seed: number = 1, yRange: [number, number] = [50, 950]): Array<{
  cx: number
  cy: number
  r: number
  delay: number
  duration: number
}> {
  const particles = []
  for (let i = 0; i < count; i++) {
    const hash = (seed * 9301 + i * 49297) % 233280
    
    particles.push({
      cx: (hash % 1800) - 100, // Spread across full width with overflow
      cy: yRange[0] + ((hash * 7) % (yRange[1] - yRange[0])), // Distribute across y range
      r: 0.6 + (hash % 100) / 40, // 0.6 to 3.1
      delay: (i % 25) * 0.6,
      duration: 14 + (hash % 16),
    })
  }
  return particles
}

// Particle group component
function DustParticleGroup({
  particles,
  baseColor,
  animationClass,
}: {
  particles: Array<{ cx: number; cy: number; r: number; delay: number; duration: number }>
  baseColor: string
  animationClass: string
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
          style={{
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          <animate
            attributeName="opacity"
            values="0.05;0.5;0.05"
            dur={`${p.duration}s`}
            begin={`${p.delay}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  )
}

export function AmbientBackground() {
  // Generate multiple layers of particles that span the entire viewport seamlessly
  const particlesLayer1 = useMemo(() => generateParticles(60, 1, [0, 1000]), [])
  const particlesLayer2 = useMemo(() => generateParticles(45, 2, [100, 900]), [])
  const particlesLayer3 = useMemo(() => generateParticles(35, 3, [200, 800]), [])

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Base layer - deep obsidian (dark) / warm ivory (light) */}
      <div className="ambient-base" />
      
      {/* Soft ambient wash for seamless depth */}
      <div className="ambient-soft-wash" />

      {/* Soft glowing areas - creates gentle warmth zones without hard edges */}
      <div className="ambient-glow ambient-glow--top animate-ambient-breathe-top" />
      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--bottom animate-ambient-breathe-bottom" />

      {/* Primary flowing gold dust wave SVG - seamless, merging dust */}
      <svg
        className="ambient-dust-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Seamless flowing dust gradient - no hard edges */}
          <linearGradient id="dustFlowPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="8%" stopColor="rgba(199,163,106,0.12)" />
            <stop offset="35%" stopColor="rgba(212,184,122,0.4)" />
            <stop offset="65%" stopColor="rgba(212,184,122,0.4)" />
            <stop offset="92%" stopColor="rgba(199,163,106,0.12)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          {/* Core glow gradient - brighter center */}
          <linearGradient id="dustFlowCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,248,230,0)" />
            <stop offset="20%" stopColor="rgba(229,212,184,0.2)" />
            <stop offset="50%" stopColor="rgba(245,235,210,0.45)" />
            <stop offset="80%" stopColor="rgba(229,212,184,0.2)" />
            <stop offset="100%" stopColor="rgba(255,248,230,0)" />
          </linearGradient>

          {/* Secondary flowing dust - warmer tone */}
          <linearGradient id="dustFlowSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(180,145,80,0)" />
            <stop offset="12%" stopColor="rgba(180,145,80,0.08)" />
            <stop offset="50%" stopColor="rgba(195,165,100,0.28)" />
            <stop offset="88%" stopColor="rgba(180,145,80,0.08)" />
            <stop offset="100%" stopColor="rgba(180,145,80,0)" />
          </linearGradient>

          {/* Tertiary flowing dust - subtle accent */}
          <linearGradient id="dustFlowTertiary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="15%" stopColor="rgba(199,163,106,0.06)" />
            <stop offset="50%" stopColor="rgba(212,184,122,0.2)" />
            <stop offset="85%" stopColor="rgba(199,163,106,0.06)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          {/* Very soft blur for outer glow - creates seamless merging */}
          <filter id="dustBlurSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="32" />
          </filter>

          {/* Medium blur for intermediate layers */}
          <filter id="dustBlurMedium" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="16" />
          </filter>

          {/* Subtle blur for core paths */}
          <filter id="dustBlurCore" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* LAYER 1: Upper flowing dust wave */}
        <g className="ambient-wave ambient-wave--gold">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -300 180 
               C 100 280, 300 120, 600 220 
               S 900 320, 1100 200 
               S 1400 280, 1900 160"
            stroke="url(#dustFlowPrimary)"
            strokeWidth="220"
            filter="url(#dustBlurSoft)"
          />
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -300 180 
               C 100 280, 300 120, 600 220 
               S 900 320, 1100 200 
               S 1400 280, 1900 160"
            stroke="url(#dustFlowCore)"
            strokeWidth="50"
            filter="url(#dustBlurCore)"
          />
        </g>

        {/* LAYER 2: Middle flowing dust - fills the gap seamlessly */}
        <g className="ambient-wave ambient-wave--warm">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -200 420 
               C 150 350, 400 500, 700 400 
               S 1000 320, 1300 450 
               S 1600 380, 1900 440"
            stroke="url(#dustFlowSecondary)"
            strokeWidth="200"
            filter="url(#dustBlurSoft)"
          />
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -200 420 
               C 150 350, 400 500, 700 400 
               S 1000 320, 1300 450 
               S 1600 380, 1900 440"
            stroke="url(#dustFlowCore)"
            strokeWidth="35"
            filter="url(#dustBlurMedium)"
          />
        </g>

        {/* LAYER 3: Lower flowing dust wave */}
        <g className="ambient-wave ambient-wave--accent">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -250 680 
               C 100 600, 350 750, 650 650 
               S 950 580, 1200 700 
               S 1500 620, 1900 720"
            stroke="url(#dustFlowTertiary)"
            strokeWidth="180"
            filter="url(#dustBlurSoft)"
          />
        </g>

        {/* LAYER 4: Connective dust - bridges the waves for seamless merging */}
        <g className="ambient-wave ambient-wave--warm" style={{ opacity: 0.6 }}>
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -100 300 
               C 200 450, 500 280, 800 420 
               S 1100 550, 1400 400 
               S 1700 500, 1950 350"
            stroke="url(#dustFlowTertiary)"
            strokeWidth="160"
            filter="url(#dustBlurSoft)"
          />
        </g>

        {/* Floating gold dust particles - spread across entire viewport */}
        <DustParticleGroup
          particles={particlesLayer1}
          baseColor="rgba(229, 212, 184, 0.8)"
          animationClass="ambient-particles ambient-particles--gold"
        />
        <DustParticleGroup
          particles={particlesLayer2}
          baseColor="rgba(199, 163, 106, 0.7)"
          animationClass="ambient-particles ambient-particles--warm"
        />
        <DustParticleGroup
          particles={particlesLayer3}
          baseColor="rgba(245, 235, 210, 0.6)"
          animationClass="ambient-particles ambient-particles--accent"
        />
      </svg>

      {/* Vignette for cinematic depth - no texture grid */}
      <div className="ambient-vignette" />
    </div>
  )
}
