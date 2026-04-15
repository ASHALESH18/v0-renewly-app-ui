export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="ambient-base" />

      <div className="ambient-glow ambient-glow--center animate-ambient-breathe-center" />
      <div className="ambient-glow ambient-glow--edge animate-ambient-breathe-edge" />

      <svg
        className="ambient-ribbons-svg"
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ambientGoldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(199,163,106,0)" />
            <stop offset="20%" stopColor="rgba(199,163,106,0.18)" />
            <stop offset="50%" stopColor="rgba(212,184,122,0.85)" />
            <stop offset="80%" stopColor="rgba(199,163,106,0.18)" />
            <stop offset="100%" stopColor="rgba(199,163,106,0)" />
          </linearGradient>

          <linearGradient id="ambientGoldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(229,212,184,0)" />
            <stop offset="30%" stopColor="rgba(229,212,184,0.4)" />
            <stop offset="50%" stopColor="rgba(229,212,184,0.95)" />
            <stop offset="70%" stopColor="rgba(229,212,184,0.4)" />
            <stop offset="100%" stopColor="rgba(229,212,184,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(46,94,82,0)" />
            <stop offset="24%" stopColor="rgba(46,94,82,0.12)" />
            <stop offset="50%" stopColor="rgba(82,126,110,0.7)" />
            <stop offset="76%" stopColor="rgba(46,94,82,0.12)" />
            <stop offset="100%" stopColor="rgba(46,94,82,0)" />
          </linearGradient>

          <linearGradient id="ambientEmeraldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(188,194,204,0)" />
            <stop offset="32%" stopColor="rgba(120,158,145,0.18)" />
            <stop offset="50%" stopColor="rgba(120,158,145,0.45)" />
            <stop offset="68%" stopColor="rgba(120,158,145,0.18)" />
            <stop offset="100%" stopColor="rgba(188,194,204,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(188,194,204,0)" />
            <stop offset="28%" stopColor="rgba(188,194,204,0.08)" />
            <stop offset="50%" stopColor="rgba(210,214,220,0.42)" />
            <stop offset="72%" stopColor="rgba(188,194,204,0.08)" />
            <stop offset="100%" stopColor="rgba(188,194,204,0)" />
          </linearGradient>

          <linearGradient id="ambientPlatinumCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.24)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <filter id="ambientBlurXL" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="18" />
          </filter>

          <filter id="ambientBlurLG" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <g className="ambient-wave ambient-wave--gold">
          <path
            className="ambient-path ambient-path--gold-soft"
            d="M -180 270 C 120 360, 360 140, 690 220 S 1260 420, 1780 250"
            stroke="url(#ambientGoldSoft)"
            strokeWidth="118"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--gold-core"
            d="M -180 270 C 120 360, 360 140, 690 220 S 1260 420, 1780 250"
            stroke="url(#ambientGoldCore)"
            strokeWidth="34"
            filter="url(#ambientBlurLG)"
          />
        </g>

        <g className="ambient-wave ambient-wave--emerald">
          <path
            className="ambient-path ambient-path--emerald-soft"
            d="M -220 560 C 90 470, 320 680, 640 585 S 1220 450, 1820 620"
            stroke="url(#ambientEmeraldSoft)"
            strokeWidth="104"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--emerald-core"
            d="M -220 560 C 90 470, 320 680, 640 585 S 1220 450, 1820 620"
            stroke="url(#ambientEmeraldCore)"
            strokeWidth="28"
            filter="url(#ambientBlurLG)"
          />
        </g>

        <g className="ambient-wave ambient-wave--platinum">
          <path
            className="ambient-path ambient-path--platinum-soft"
            d="M -160 760 C 180 690, 420 830, 760 760 S 1310 660, 1780 780"
            stroke="url(#ambientPlatinumSoft)"
            strokeWidth="84"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--platinum-core"
            d="M -160 760 C 180 690, 420 830, 760 760 S 1310 660, 1780 780"
            stroke="url(#ambientPlatinumCore)"
            strokeWidth="18"
            filter="url(#ambientBlurLG)"
          />
        </g>
      </svg>

      <div className="ambient-texture" />
      <div className="ambient-vignette" />
    </div>
  )
}