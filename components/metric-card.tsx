'use client'

import { motion } from 'framer-motion'
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { springs, staggerItem } from './motion'

// Consistent number formatter that works on server and client
function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

interface MetricCardProps {
  title: string
  value: string | number
  prefix?: string
  suffix?: string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  iconColor?: string
  index?: number
  variant?: 'default' | 'gold' | 'emerald' | 'crimson'
}

export function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  index = 0,
  variant = 'default',
}: MetricCardProps) {
  const isPositiveChange = change && change > 0
  const isNegativeChange = change && change < 0

  const variantStyles = {
    default: 'bg-card/80 border-border hover:border-gold/20',
    gold: 'bg-gradient-to-br from-gold/8 to-gold/3 border-gold/20 hover:border-gold/30',
    emerald: 'bg-gradient-to-br from-emerald/8 to-emerald/3 border-emerald/20 hover:border-emerald/30',
    crimson: 'bg-gradient-to-br from-crimson/8 to-crimson/3 border-crimson/20 hover:border-crimson/30',
  }

  return (
    <motion.div
      variants={staggerItem}
      initial="initial"
      animate="animate"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      custom={index}
      transition={{ ...springs.gentle, delay: index * 0.08 }}
      className={cn(
        'relative rounded-2xl border p-5 shadow-card backdrop-blur-sm transition-all duration-300 overflow-hidden group',
        variantStyles[variant]
      )}
    >
      {/* Subtle ambient glow on hover */}
      <motion.div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: iconColor 
            ? `radial-gradient(circle at top right, ${iconColor}15 0%, transparent 70%)`
            : 'radial-gradient(circle at top right, rgba(199,163,106,0.1) 0%, transparent 70%)'
        }}
      />
      
      {/* Top highlight line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <motion.p 
            className="mt-2 text-2xl font-semibold text-foreground tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 + 0.2 }}
          >
            {prefix}
            {typeof value === 'number' ? formatNumber(value) : value}
            {suffix && <span className="text-base text-muted-foreground ml-1">{suffix}</span>}
          </motion.p>
          
          {(change !== undefined || changeLabel) && (
            <motion.div 
              className="mt-3 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.08 + 0.3 }}
            >
              {change !== undefined && (
                <span className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  isPositiveChange && 'bg-emerald/10 text-emerald',
                  isNegativeChange && 'bg-crimson/10 text-crimson',
                  !isPositiveChange && !isNegativeChange && 'bg-muted text-muted-foreground'
                )}>
                  {isPositiveChange && <TrendingUp className="w-3 h-3" />}
                  {isNegativeChange && <TrendingDown className="w-3 h-3" />}
                  {!isPositiveChange && !isNegativeChange && <Minus className="w-3 h-3" />}
                  {Math.abs(change)}%
                </span>
              )}
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </motion.div>
          )}
        </div>

        {Icon && (
          <motion.div 
            className={cn(
              'relative w-11 h-11 rounded-xl flex items-center justify-center',
              iconColor ? '' : 'bg-muted'
            )}
            style={iconColor ? { backgroundColor: `${iconColor}15` } : undefined}
            whileHover={{ scale: 1.05 }}
          >
            {/* Icon glow effect */}
            <div 
              className="absolute inset-0 rounded-xl blur-lg opacity-40"
              style={iconColor ? { backgroundColor: `${iconColor}30` } : undefined}
            />
            <Icon 
              className="relative w-5 h-5" 
              style={iconColor ? { color: iconColor } : undefined}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Large feature metric for hero sections
interface HeroMetricProps {
  value: string | number
  prefix?: string
  label: string
  sublabel?: string
}

export function HeroMetric({ value, prefix = '', label, sublabel }: HeroMetricProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="text-center"
    >
      <motion.p 
        className="text-4xl md:text-5xl font-semibold text-gold tracking-tight"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, ...springs.gentle }}
      >
        {prefix}
        {typeof value === 'number' ? formatNumber(value) : value}
      </motion.p>
      <p className="mt-2 text-foreground font-medium">{label}</p>
      {sublabel && (
        <p className="text-sm text-muted-foreground">{sublabel}</p>
      )}
    </motion.div>
  )
}

// Inline mini metric for compact displays
interface MiniMetricProps {
  value: string | number
  label: string
  prefix?: string
}

export function MiniMetric({ value, label, prefix = '' }: MiniMetricProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-lg font-semibold text-foreground">
        {prefix}{typeof value === 'number' ? formatNumber(value) : value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
