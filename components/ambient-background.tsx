export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div className="ambient-base" />
      <div className="ambient-soft-wash" />

      <div className="ambient-glow ambient-glow--top animate-ambient-breathe-top" />
      <div className="ambient-glow ambient-glow--mid animate-ambient-breathe-mid" />
      <div className="ambient-glow ambient-glow--bottom-left animate-ambient-breathe-bottom-left" />
      <div className="ambient-glow ambient-glow--bottom-right animate-ambient-breathe-bottom-right" />

      <svg
        className="ambient-canvas-svg"
        viewBox="0 0 1600 1200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="bandGoldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="20%" stopColor="rgba(154,112,53,0.08)" />
            <stop offset="50%" stopColor="rgba(166,130,76,0.34)" />
            <stop offset="80%" stopColor="rgba(154,112,53,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandGoldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="34%" stopColor="rgba(221,198,160,0.08)" />
            <stop offset="50%" stopColor="rgba(221,198,160,0.22)" />
            <stop offset="66%" stopColor="rgba(221,198,160,0.08)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandEmeraldSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="24%" stopColor="rgba(74,115,96,0.04)" />
            <stop offset="50%" stopColor="rgba(74,115,96,0.16)" />
            <stop offset="76%" stopColor="rgba(74,115,96,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandEmeraldCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="34%" stopColor="rgba(178,206,196,0.04)" />
            <stop offset="50%" stopColor="rgba(178,206,196,0.12)" />
            <stop offset="66%" stopColor="rgba(178,206,196,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandPlatinumSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="24%" stopColor="rgba(140,145,156,0.025)" />
            <stop offset="50%" stopColor="rgba(140,145,156,0.1)" />
            <stop offset="76%" stopColor="rgba(140,145,156,0.025)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandPlatinumCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="34%" stopColor="rgba(235,237,240,0.03)" />
            <stop offset="50%" stopColor="rgba(235,237,240,0.08)" />
            <stop offset="66%" stopColor="rgba(235,237,240,0.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandTaupeSoft" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="24%" stopColor="rgba(154,132,108,0.035)" />
            <stop offset="50%" stopColor="rgba(154,132,108,0.14)" />
            <stop offset="76%" stopColor="rgba(154,132,108,0.035)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <linearGradient id="bandTaupeCore" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="34%" stopColor="rgba(230,220,205,0.035)" />
            <stop offset="50%" stopColor="rgba(230,220,205,0.09)" />
            <stop offset="66%" stopColor="rgba(230,220,205,0.035)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          <filter id="ambientBlurXL" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="20" />
          </filter>

          <filter id="ambientBlurLG" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* top gold sweep */}
        <g className="ambient-band ambient-band--1">
          <path
            className="ambient-path ambient-path--soft"
            d="M -220 220 C 120 320, 360 110, 720 180 S 1290 360, 1810 210"
            stroke="url(#bandGoldSoft)"
            strokeWidth="94"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--core"
            d="M -220 220 C 120 320, 360 110, 720 180 S 1290 360, 1810 210"
            stroke="url(#bandGoldCore)"
            strokeWidth="28"
            filter="url(#ambientBlurLG)"
          />
          <g className="ambient-specks ambient-specks--1" fill="rgba(220,200,165,0.42)">
            <circle cx="140" cy="238" r="2.1" />
            <circle cx="320" cy="196" r="2.5" />
            <circle cx="560" cy="150" r="2.7" />
            <circle cx="790" cy="134" r="2.1" />
            <circle cx="980" cy="168" r="2.4" />
            <circle cx="1210" cy="206" r="2.2" />
            <circle cx="1450" cy="192" r="2.5" />
            <circle cx="1710" cy="176" r="1.9" />
          </g>
        </g>

        {/* upper-mid matte sweep */}
        <g className="ambient-band ambient-band--2">
          <path
            className="ambient-path ambient-path--soft"
            d="M -180 410 C 180 340, 520 430, 860 390 S 1380 330, 1820 420"
            stroke="url(#bandTaupeSoft)"
            strokeWidth="84"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--core"
            d="M -180 410 C 180 340, 520 430, 860 390 S 1380 330, 1820 420"
            stroke="url(#bandTaupeCore)"
            strokeWidth="22"
            filter="url(#ambientBlurLG)"
          />
          <g className="ambient-specks ambient-specks--2" fill="rgba(210,195,175,0.28)">
            <circle cx="180" cy="388" r="1.8" />
            <circle cx="420" cy="360" r="2.3" />
            <circle cx="690" cy="382" r="2.1" />
            <circle cx="960" cy="364" r="2.2" />
            <circle cx="1240" cy="350" r="2.1" />
            <circle cx="1520" cy="390" r="1.8" />
          </g>
        </g>

        {/* middle green-gold drift */}
        <g className="ambient-band ambient-band--3">
          <path
            className="ambient-path ambient-path--soft"
            d="M -240 650 C 80 540, 360 710, 700 636 S 1280 540, 1820 670"
            stroke="url(#bandEmeraldSoft)"
            strokeWidth="96"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--core"
            d="M -240 650 C 80 540, 360 710, 700 636 S 1280 540, 1820 670"
            stroke="url(#bandEmeraldCore)"
            strokeWidth="24"
            filter="url(#ambientBlurLG)"
          />
          <g className="ambient-specks ambient-specks--3" fill="rgba(170,205,192,0.24)">
            <circle cx="130" cy="622" r="2.3" />
            <circle cx="300" cy="580" r="1.8" />
            <circle cx="510" cy="650" r="2.4" />
            <circle cx="760" cy="620" r="2.1" />
            <circle cx="1010" cy="592" r="2.2" />
            <circle cx="1280" cy="618" r="2.1" />
            <circle cx="1500" cy="668" r="1.9" />
          </g>
        </g>

        {/* lower platinum strip */}
        <g className="ambient-band ambient-band--4">
          <path
            className="ambient-path ambient-path--soft"
            d="M -180 910 C 170 850, 420 960, 760 910 S 1320 846, 1810 930"
            stroke="url(#bandPlatinumSoft)"
            strokeWidth="68"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--core"
            d="M -180 910 C 170 850, 420 960, 760 910 S 1320 846, 1810 930"
            stroke="url(#bandPlatinumCore)"
            strokeWidth="16"
            filter="url(#ambientBlurLG)"
          />
          <g className="ambient-specks ambient-specks--4" fill="rgba(226,228,232,0.16)">
            <circle cx="220" cy="888" r="1.6" />
            <circle cx="420" cy="930" r="1.9" />
            <circle cx="650" cy="896" r="1.8" />
            <circle cx="920" cy="912" r="1.7" />
            <circle cx="1180" cy="878" r="1.8" />
            <circle cx="1440" cy="926" r="1.6" />
          </g>
        </g>

        {/* bottom gold accent */}
        <g className="ambient-band ambient-band--5">
          <path
            className="ambient-path ambient-path--soft"
            d="M -260 1060 C 120 1000, 440 1120, 840 1062 S 1360 1000, 1840 1088"
            stroke="url(#bandGoldSoft)"
            strokeWidth="74"
            filter="url(#ambientBlurXL)"
          />
          <path
            className="ambient-path ambient-path--core"
            d="M -260 1060 C 120 1000, 440 1120, 840 1062 S 1360 1000, 1840 1088"
            stroke="url(#bandGoldCore)"
            strokeWidth="18"
            filter="url(#ambientBlurLG)"
          />
          <g className="ambient-specks ambient-specks--5" fill="rgba(220,196,156,0.24)">
            <circle cx="160" cy="1036" r="1.8" />
            <circle cx="360" cy="1080" r="2.1" />
            <circle cx="620" cy="1044" r="1.9" />
            <circle cx="900" cy="1068" r="2" />
            <circle cx="1180" cy="1036" r="1.9" />
            <circle cx="1490" cy="1082" r="2" />
          </g>
        </g>
      </svg>

      <div className="ambient-texture" />
      <div className="ambient-vignette" />
    </div>
  )
}