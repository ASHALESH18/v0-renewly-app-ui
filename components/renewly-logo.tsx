'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RenewlyLogoProps {
  /** Show the text wordmark alongside the logo icon */
  showWordmark?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Make the logo a clickable link to home */
  linkToHome?: boolean
  /** Theme override (auto-detects by default) */
  theme?: 'light' | 'dark' | 'auto'
}

const sizeMap = {
  sm: { icon: 24, text: 'text-sm' },
  md: { icon: 32, text: 'text-base' },
  lg: { icon: 40, text: 'text-xl' },
}

export function RenewlyLogo({
  showWordmark = true,
  size = 'md',
  className,
  linkToHome = true,
  theme = 'auto',
}: RenewlyLogoProps) {
  const { icon, text } = sizeMap[size]

  const content = (
    <div className={cn('flex items-center gap-2 group', className)}>
      {/* Logo icon - uses CSS to swap based on theme */}
      <div className="relative flex-shrink-0" style={{ width: icon, height: icon }}>
        {/* Dark mode icon (gold calendar-R on black) */}
        <Image
          src="/images/renewly-icon-dark.jpg"
          alt="Renewly"
          width={icon}
          height={icon}
          className={cn(
            'rounded-lg object-cover',
            theme === 'light' ? 'hidden' : theme === 'dark' ? 'block' : 'hidden dark:block'
          )}
          priority
        />
        {/* Light mode icon (bronze calendar-R on cream) */}
        <Image
          src="/images/renewly-icon-light.jpg"
          alt="Renewly"
          width={icon}
          height={icon}
          className={cn(
            'rounded-lg object-cover',
            theme === 'light' ? 'block' : theme === 'dark' ? 'hidden' : 'block dark:hidden'
          )}
          priority
        />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className={cn(
            'font-serif font-semibold text-foreground group-hover:text-gold transition-colors',
            text
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
