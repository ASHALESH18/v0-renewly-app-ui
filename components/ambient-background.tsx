'use client'

/**
 * AmbientBackground - Premium flowing light ribbon background
 * 
 * Visual direction:
 * - Slow river-like motion with flowing silk light bands
 * - Dark matte obsidian base with champagne gold + muted amber + cool slate-blue ribbons
 * - Soft blur, feathered edges, luminous centers
 * - Subtle cinematic depth
 * 
 * NOT: neon, sparkly, particles, gaming UI, flashy
 */

import { useEffect, useState } from 'react'

export function AmbientBackground() {
  const [mounted, setMounted] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (!mounted) return null

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* ============================================ */}
      {/* LAYER 1: Deep Base Surface */}
      {/* Rich obsidian with subtle tonal variation */}
      {/* ============================================ */}
      <div className="ambient-base" />

      {/* ============================================ */}
      {/* LAYER 2: Flowing Ribbon Bands */}
      {/* Large, visible, softly glowing silk ribbons */}
      {/* ============================================ */}
      
      {/* Primary Gold Ribbon - horizontal drift from left */}
      <div 
        className={`ambient-ribbon ambient-ribbon--gold-primary ${prefersReducedMotion ? '' : 'animate-ribbon-flow-1'}`}
      />
      
      {/* Secondary Amber Ribbon - diagonal drift */}
      <div 
        className={`ambient-ribbon ambient-ribbon--amber ${prefersReducedMotion ? '' : 'animate-ribbon-flow-2'}`}
      />
      
      {/* Steel Blue Ribbon - horizontal drift from right */}
      <div 
        className={`ambient-ribbon ambient-ribbon--blue ${prefersReducedMotion ? '' : 'animate-ribbon-flow-3'}`}
      />
      
      {/* Soft Gold Accent Ribbon - subtle top accent */}
      <div 
        className={`ambient-ribbon ambient-ribbon--gold-soft ${prefersReducedMotion ? '' : 'animate-ribbon-flow-4'}`}
      />

      {/* ============================================ */}
      {/* LAYER 3: Depth Glows */}
      {/* Large soft glows behind content for depth */}
      {/* ============================================ */}
      
      {/* Central warm glow */}
      <div 
        className={`ambient-glow ambient-glow--center ${prefersReducedMotion ? '' : 'animate-glow-breathe-slow'}`}
      />
      
      {/* Lower cool glow for contrast */}
      <div 
        className={`ambient-glow ambient-glow--lower ${prefersReducedMotion ? '' : 'animate-glow-breathe-slow-delayed'}`}
      />

      {/* ============================================ */}
      {/* LAYER 4: Fine Texture (optional) */}
      {/* Extremely subtle premium grid */}
      {/* ============================================ */}
      <div className="ambient-texture" />

      {/* ============================================ */}
      {/* LAYER 5: Vignette */}
      {/* Soft edge darkening for cinematic depth */}
      {/* ============================================ */}
      <div className="ambient-vignette" />
    </div>
  )
}
