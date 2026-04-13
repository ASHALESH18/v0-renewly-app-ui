'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PremiumSurfaceProps {
  children: React.ReactNode
  variant?: 'glass' | 'elevated' | 'inset' | 'highlight'
  glow?: boolean
  hover?: boolean
  className?: string
  onClick?: () => void
}

export function PremiumSurface({
  children,
  variant = 'glass',
  glow = false,
  hover = true,
  className = '',
  onClick,
}: PremiumSurfaceProps) {
  const variantStyles = {
    glass: 'bg-card/60 backdrop-blur-2xl border border-glass-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]',
    elevated: 'bg-card border border-glass-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(199,163,106,0.05)]',
    inset: 'bg-secondary/30 border border-border shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]',
    highlight: 'bg-gradient-to-br from-gold/5 via-card to-card border border-gold/20 shadow-[0_16px_40px_-8px_rgba(199,163,106,0.12)]',
  }

  return (
    <motion.div
      whileHover={hover ? { 
        y: -2, 
        boxShadow: variant === 'highlight' 
          ? '0 24px 48px -12px rgba(199, 163, 106, 0.2), 0 0 0 1px rgba(199, 163, 106, 0.1)'
          : '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(199, 163, 106, 0.08)',
      } : undefined}
      whileTap={onClick ? { scale: 0.995 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl transition-all duration-300 relative overflow-hidden',
        variantStyles[variant],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Shimmer effect on hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0"
          whileHover={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
        </motion.div>
      )}

      {/* Ambient glow */}
      {glow && (
        <motion.div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(199,163,106,0.15) 0%, transparent 50%, rgba(199,163,106,0.1) 100%)',
            opacity: 0,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Top highlight line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      {children}
    </motion.div>
  )
}

interface PremiumCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  variant?: 'default' | 'gold' | 'emerald'
  className?: string
}

export function PremiumCard({
  children,
  title,
  subtitle,
  icon,
  action,
  variant = 'default',
  className = '',
}: PremiumCardProps) {
  const accentColor = {
    default: 'gold',
    gold: 'gold',
    emerald: 'emerald',
  }[variant]

  return (
    <PremiumSurface variant="elevated" glow={variant !== 'default'} className={cn('p-6', className)}>
      {/* Header */}
      {(title || icon || action) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                `bg-${accentColor}/10`
              )}
              style={{ backgroundColor: variant === 'emerald' ? 'rgba(46,94,82,0.1)' : 'rgba(199,163,106,0.1)' }}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}

      {children}
    </PremiumSurface>
  )
}
