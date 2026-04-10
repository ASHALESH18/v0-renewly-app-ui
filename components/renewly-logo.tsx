'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RenewlyLogoProps {
  /** Show the text wordmark alongside the logo icon */
  showWordmark?: boolean
  /** Size variant - xl and 2xl added for prominent branding */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Additional CSS classes */
  className?: string
  /** Make the logo a clickable link to home */
  linkToHome?: boolean
  /** Theme override (auto-detects by default via CSS) */
  theme?: 'light' | 'dark' | 'auto'
}

// Refined size map for premium visual harmony across devices
// Gap values tightened for cohesive icon-text pairing
const sizeMap = {
  sm: { icon: 20, text: 'text-sm', gap: 'gap-1', tracking: 'tracking-tight' },
  md: { icon: 26, text: 'text-base', gap: 'gap-1.5', tracking: 'tracking-normal' },
  lg: { icon: 32, text: 'text-lg', gap: 'gap-1.5', tracking: 'tracking-wide' },
  xl: { icon: 38, text: 'text-xl', gap: 'gap-2', tracking: 'tracking-wide' },
  '2xl': { icon: 44, text: 'text-2xl', gap: 'gap-2', tracking: 'tracking-wide' },
}

/**
 * SVG Calendar-R Icon - The Renewly brand mark
 * Premium calendar outline with elegant serif R inside
 */
function RenewlyIconSVG({ 
  size, 
  className,
  theme = 'auto'
}: { 
  size: number
  className?: string 
  theme?: 'light' | 'dark' | 'auto'
}) {
  // Gold color for dark mode, bronze for light mode
  const darkModeClass = theme === 'light' ? 'hidden' : theme === 'dark' ? 'block' : 'hidden dark:block'
  const lightModeClass = theme === 'light' ? 'block' : theme === 'dark' ? 'hidden' : 'block dark:hidden'

  return (
    <div className={cn('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      {/* Dark mode version - Gold on transparent */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('absolute inset-0 w-full h-full', darkModeClass)}
        aria-hidden="true"
      >
        {/* Calendar outline */}
        <rect
          x="6"
          y="10"
          width="36"
          height="32"
          rx="4"
          stroke="#C7A36A"
          strokeWidth="2"
          fill="none"
        />
        {/* Calendar header line */}
        <line x1="6" y1="18" x2="42" y2="18" stroke="#C7A36A" strokeWidth="1.5" />
        {/* Calendar binding tabs */}
        <rect x="14" y="6" width="4" height="8" rx="1" fill="#C7A36A" />
        <rect x="30" y="6" width="4" height="8" rx="1" fill="#C7A36A" />
        {/* Elegant serif R */}
        <text
          x="24"
          y="35"
          textAnchor="middle"
          fill="#C7A36A"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="18"
          fontWeight="600"
        >
          R
        </text>
      </svg>

      {/* Light mode version - Bronze on transparent */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('absolute inset-0 w-full h-full', lightModeClass)}
        aria-hidden="true"
      >
        {/* Calendar outline */}
        <rect
          x="6"
          y="10"
          width="36"
          height="32"
          rx="4"
          stroke="#8B6914"
          strokeWidth="2"
          fill="none"
        />
        {/* Calendar header line */}
        <line x1="6" y1="18" x2="42" y2="18" stroke="#8B6914" strokeWidth="1.5" />
        {/* Calendar binding tabs */}
        <rect x="14" y="6" width="4" height="8" rx="1" fill="#8B6914" />
        <rect x="30" y="6" width="4" height="8" rx="1" fill="#8B6914" />
        {/* Elegant serif R */}
        <text
          x="24"
          y="35"
          textAnchor="middle"
          fill="#8B6914"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="18"
          fontWeight="600"
        >
          R
        </text>
      </svg>
    </div>
  )
}

export function RenewlyLogo({
  showWordmark = true,
  size = 'md',
  className,
  linkToHome = true,
  theme = 'auto',
}: RenewlyLogoProps) {
  const { icon, text, gap, tracking } = sizeMap[size]

  const content = (
    <div className={cn('flex items-center group', gap, className)}>
      {/* SVG Logo Icon */}
      <RenewlyIconSVG size={icon} theme={theme} />

      {/* Wordmark - Premium serif with refined letter-spacing */}
      {showWordmark && (
        <span
          className={cn(
            'font-serif font-semibold text-foreground group-hover:text-gold transition-colors',
            text,
            tracking
          )}
        >
          Renewly
        </span>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" className="inline-flex">
        {content}
      </Link>
    )
  }

  return content
}

/**
 * Simplified logo icon only (no wordmark)
 * Useful for favicons, app icons, and compact spaces
 */
export function RenewlyIcon({
  size = 'md',
  className,
  theme = 'auto',
}: Omit<RenewlyLogoProps, 'showWordmark' | 'linkToHome'>) {
  return (
    <RenewlyLogo
      showWordmark={false}
      size={size}
      className={className}
      linkToHome={false}
      theme={theme}
    />
  )
}

/**
 * Export the raw SVG icon component for special use cases
 */
export { RenewlyIconSVG }
