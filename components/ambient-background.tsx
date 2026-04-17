import React from 'react'

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="ambient-base" />

      <div className="ambient-glow ambient-glow--top animate-ambient-breathe-top" />
      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--bottom animate-ambient-breathe-bottom" />

      <svg
        className="ambient-silk-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ambientGoldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="20%" stopColor="rgba(199,163,106,0.12)" />
            <stop offset="50%" stopColor="rgba(212,184,122,0.55)" />
            <stop offset="80%" stopColor="rgba(199,163,106,0.12)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          <linearGradient id="ambientGoldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="32%" stopColor="rgba(229,212,184,0.18)" />
            <stop offset="50%" stopColor="rgba(229,212,184,0.5)" />
            <stop offset="68%" stopColor="rgba(229,212,184,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(46,94,82,0)" />
            <stop offset="24%" stopColor="rgba(46,94,82,0.08)" />
            <stop offset="50%" stopColor="rgba(82,126,110,0.35)" />
            <stop offset="76%" stopColor="rgba(46,94,82,0.08)" />
            <stop offset="100%" stopColor="rgba(46,94,82,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="32%" stopColor="rgba(120,158,145,0.12)" />
            <stop offset="50%" stopColor="rgba(120,158,145,0.28)" />
            <stop offset="68%" stopColor="rgba(120,158,145,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(188,194,204,0)" />
            <stop offset="28%" stopColor="rgba(188,194,204,0.05)" />
            <stop offset="50%" stopColor="rgba(210,214,220,0.2)" />
            <stop offset="72%" stopColor="rgba(188,194,204,0.05)" />
            <stop offset="100%" stopColor="rgba(188,194,204,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <filter id="ambientBlurXL" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="22" />
          </filter>

          <filter id="ambientBlurLG" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <g className="ambient-wave ambient-wave--gold">
          <path
            className="ambient-path ambient-path--gold-soft"
            d="M -180 250 C 120 150, 360 360, 730 250 S 1290 90, 1820 170"
            stroke="url(#ambientGoldSoft)"
            strokeWidth="112"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--gold-core"
            d="M -180 250 C 120 150, 360 360, 730 250 S 1290 90, 1820 170"
            stroke="url(#ambientGoldCore)"
            strokeWidth="28"
            filter="url(#ambientBlurLG)"
          />
        </g>

        <g className="ambient-wave ambient-wave--emerald">
          <path
            className="ambient-path ambient-path--emerald-soft"
            d="M -220 560 C 120 450, 360 720, 720 610 S 1280 470, 1820 610"
            stroke="url(#ambientEmeraldSoft)"
            strokeWidth="98"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--emerald-core"
            d="M -220 560 C 120 450, 360 720, 720 610 S 1280 470, 1820 610"
            stroke="url(#ambientEmeraldCore)"
            strokeWidth="24"
            filter="url(#ambientBlurLG)"
          />
        </g>

        <g className="ambient-wave ambient-wave--platinum">
          <path
            className="ambient-path ambient-path--platinum-soft"
            d="M -180 790 C 180 710, 440 880, 820 810 S 1370 690, 1820 760"
            stroke="url(#ambientPlatinumSoft)"
            strokeWidth="78"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--platinum-core"
            d="M -180 790 C 180 710, 440 880, 820 810 S 1370 690, 1820 760"
            stroke="url(#ambientPlatinumCore)"
            strokeWidth="16"
            filter="url(#ambientBlurLG)"
          />
        </g>
      </svg>

      <div className="ambient-texture" />
      <div className="ambient-vignette" />
    </div>
  )
}
