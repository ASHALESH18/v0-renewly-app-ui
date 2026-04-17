import React from 'react'

type Particle = { cx: number; cy: number; r: number; opacity?: number }

const goldDust: Particle[] = [
  { cx: 180, cy: 255, r: 2.4 },
  { cx: 260, cy: 238, r: 1.9, opacity: 0.8 },
  { cx: 340, cy: 224, r: 2.2 },
  { cx: 425, cy: 212, r: 1.8 },
  { cx: 510, cy: 206, r: 2.8 },
  { cx: 620, cy: 202, r: 1.7 },
  { cx: 710, cy: 208, r: 2.5 },
  { cx: 820, cy: 224, r: 1.8 },
  { cx: 930, cy: 248, r: 2.4 },
  { cx: 1040, cy: 272, r: 1.8 },
  { cx: 1160, cy: 288, r: 2.5 },
  { cx: 1280, cy: 290, r: 2.1 },
  { cx: 1390, cy: 280, r: 1.7 },
  { cx: 1460, cy: 262, r: 2.3 },
]

const emeraldDust: Particle[] = [
  { cx: 120, cy: 585, r: 1.9 },
  { cx: 230, cy: 565, r: 2.4 },
  { cx: 345, cy: 548, r: 1.8 },
  { cx: 470, cy: 538, r: 2.1 },
  { cx: 610, cy: 534, r: 1.7 },
  { cx: 760, cy: 538, r: 2.5 },
  { cx: 905, cy: 555, r: 1.9 },
  { cx: 1040, cy: 575, r: 2.4 },
  { cx: 1170, cy: 592, r: 1.8 },
  { cx: 1295, cy: 604, r: 2.2 },
  { cx: 1410, cy: 610, r: 1.7 },
]

const platinumDust: Particle[] = [
  { cx: 210, cy: 785, r: 1.6 },
  { cx: 360, cy: 764, r: 2.1 },
  { cx: 515, cy: 748, r: 1.8 },
  { cx: 690, cy: 742, r: 1.5 },
  { cx: 860, cy: 748, r: 2.1 },
  { cx: 1040, cy: 764, r: 1.7 },
  { cx: 1210, cy: 780, r: 1.9 },
  { cx: 1385, cy: 792, r: 1.5 },
]

function DustParticles({
  particles,
  className,
  fill,
}: {
  particles: Particle[]
  className: string
  fill: string
}) {
  return (
    <g className={`ambient-particles ${className}`}>
      {particles.map((particle, index) => (
        <circle
          key={`${className}-${index}`}
          cx={particle.cx}
          cy={particle.cy}
          r={particle.r}
          fill={fill}
          opacity={particle.opacity ?? 1}
        />
      ))}
    </g>
  )
}

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="ambient-base" />
      <div className="ambient-soft-wash" />

      <div className="ambient-glow ambient-glow--top animate-ambient-breathe-top" />
      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--bottom animate-ambient-breathe-bottom" />

      <svg
        className="ambient-dust-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ambientGoldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="18%" stopColor="rgba(199,163,106,0.08)" />
            <stop offset="50%" stopColor="rgba(212,184,122,0.45)" />
            <stop offset="82%" stopColor="rgba(199,163,106,0.08)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          <linearGradient id="ambientGoldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="36%" stopColor="rgba(229,212,184,0.14)" />
            <stop offset="50%" stopColor="rgba(229,212,184,0.32)" />
            <stop offset="64%" stopColor="rgba(229,212,184,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(46,94,82,0)" />
            <stop offset="20%" stopColor="rgba(46,94,82,0.05)" />
            <stop offset="50%" stopColor="rgba(88,126,112,0.24)" />
            <stop offset="80%" stopColor="rgba(46,94,82,0.05)" />
            <stop offset="100%" stopColor="rgba(46,94,82,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="36%" stopColor="rgba(120,158,145,0.08)" />
            <stop offset="50%" stopColor="rgba(120,158,145,0.2)" />
            <stop offset="64%" stopColor="rgba(120,158,145,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(188,194,204,0)" />
            <stop offset="24%" stopColor="rgba(188,194,204,0.03)" />
            <stop offset="50%" stopColor="rgba(210,214,220,0.14)" />
            <stop offset="76%" stopColor="rgba(188,194,204,0.03)" />
            <stop offset="100%" stopColor="rgba(188,194,204,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="36%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="64%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <filter id="ambientDustBlurXL" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>

          <filter id="ambientDustBlurLG" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <g className="ambient-wave ambient-wave--gold">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -180 270 C 100 350, 355 140, 685 220 S 1265 418, 1780 258"
            stroke="url(#ambientGoldSoft)"
            strokeWidth="92"
            filter="url(#ambientDustBlurXL)"
          />
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -180 270 C 100 350, 355 140, 685 220 S 1265 418, 1780 258"
            stroke="url(#ambientGoldCore)"
            strokeWidth="26"
            filter="url(#ambientDustBlurLG)"
          />
          <DustParticles particles={goldDust} className="ambient-particles--gold" fill="rgba(229, 212, 184, 0.75)" />
        </g>

        <g className="ambient-wave ambient-wave--emerald">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -220 560 C 90 482, 320 678, 642 588 S 1218 454, 1820 618"
            stroke="url(#ambientEmeraldSoft)"
            strokeWidth="84"
            filter="url(#ambientDustBlurXL)"
          />
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -220 560 C 90 482, 320 678, 642 588 S 1218 454, 1820 618"
            stroke="url(#ambientEmeraldCore)"
            strokeWidth="22"
            filter="url(#ambientDustBlurLG)"
          />
          <DustParticles particles={emeraldDust} className="ambient-particles--emerald" fill="rgba(163, 201, 189, 0.48)" />
        </g>

        <g className="ambient-wave ambient-wave--platinum">
          <path
            className="ambient-dust-path ambient-dust-soft"
            d="M -160 782 C 185 706, 430 830, 770 762 S 1310 666, 1780 790"
            stroke="url(#ambientPlatinumSoft)"
            strokeWidth="62"
            filter="url(#ambientDustBlurXL)"
          />
          <path
            className="ambient-dust-path ambient-dust-core"
            d="M -160 782 C 185 706, 430 830, 770 762 S 1310 666, 1780 790"
            stroke="url(#ambientPlatinumCore)"
            strokeWidth="14"
            filter="url(#ambientDustBlurLG)"
          />
          <DustParticles particles={platinumDust} className="ambient-particles--platinum" fill="rgba(229, 233, 238, 0.34)" />
        </g>
      </svg>

      <div className="ambient-texture" />
      <div className="ambient-vignette" />
    </div>
  )
}