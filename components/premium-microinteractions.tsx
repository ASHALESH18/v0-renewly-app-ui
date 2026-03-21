'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { springs, toggleVariants } from '@/components/motion'

/**
 * Premium Toggle Switch with luxury motion
 */
interface PremiumToggleProps extends HTMLMotionProps<'button'> {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export const PremiumToggle = forwardRef<HTMLButtonElement, PremiumToggleProps>(
  ({ checked, onChange, label, disabled = false, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center gap-3 p-2 rounded-lg',
          'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* Toggle track */}
        <motion.div
          className={cn(
            'relative w-14 h-8 rounded-full transition-colors',
            checked ? 'bg-gold' : 'bg-muted'
          )}
          animate={{ backgroundColor: checked ? '#C7A36A' : '#3a3a3a' }}
        >
          {/* Toggle thumb */}
          <motion.div
            className="absolute top-1 w-6 h-6 rounded-full bg-obsidian shadow-md"
            variants={toggleVariants}
            animate={checked ? 'on' : 'off'}
            transition={springs.gentle}
          />

          {/* Glow effect when active */}
          {checked && (
            <motion.div
              className="absolute inset-0 rounded-full bg-gold/20 blur-md"
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>

        {label && <span className="text-sm text-platinum">{label}</span>}
      </motion.button>
    )
  }
)
PremiumToggle.displayName = 'PremiumToggle'

/**
 * Premium Chip/Badge with luxury entrance
 */
interface PremiumChipProps extends HTMLMotionProps<'div'> {
  label: string
  onRemove?: () => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export const PremiumChip = forwardRef<HTMLDivElement, PremiumChipProps>(
  ({ label, onRemove, variant = 'default', className, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-glass text-ivory border border-glass-border',
      success: 'bg-emerald/10 text-emerald border border-emerald/20',
      warning: 'bg-amber/10 text-amber border border-amber/20',
      danger: 'bg-red/10 text-red border border-red/20',
    }

    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
          'transition-all',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {label}
        {onRemove && (
          <motion.button
            onClick={onRemove}
            className="ml-1 hover:text-gold transition-colors"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            ×
          </motion.button>
        )}
      </motion.div>
    )
  }
)
PremiumChip.displayName = 'PremiumChip'

/**
 * Premium Input with focus animation
 */
interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const PremiumInput = forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <motion.div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-platinum mb-2">{label}</label>
        )}

        <motion.input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl bg-glass border border-glass-border',
            'text-ivory placeholder-platinum/50',
            'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50',
            'transition-colors',
            error && 'border-red focus:ring-red/50',
            className
          )}
          whileFocus={{
            boxShadow: '0 0 0 3px rgba(199, 163, 106, 0.1)',
          }}
          {...props}
        />

        {error && (
          <motion.p
            className="text-sm text-red mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    )
  }
)
PremiumInput.displayName = 'PremiumInput'

/**
 * Premium Spinner for loading states
 */
export function PremiumSpinner() {
  return (
    <motion.div
      className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

/**
 * Premium Notification/Toast motion
 */
interface PremiumNotificationProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
}

export function PremiumNotification({
  message,
  type = 'info',
  onClose,
}: PremiumNotificationProps) {
  const typeClasses = {
    success: 'bg-emerald/10 border-emerald/20 text-emerald',
    error: 'bg-red/10 border-red/20 text-red',
    info: 'bg-blue/10 border-blue/20 text-blue',
    warning: 'bg-amber/10 border-amber/20 text-amber',
  }

  return (
    <motion.div
      className={cn(
        'rounded-xl p-4 border backdrop-blur-sm',
        typeClasses[type]
      )}
      initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <motion.button
          onClick={onClose}
          className="ml-4 opacity-70 hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ×
        </motion.button>
      </div>
    </motion.div>
  )
}

/**
 * Premium Accordion item with luxury animation
 */
interface PremiumAccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function PremiumAccordionItem({
  title,
  children,
  defaultOpen = false,
}: PremiumAccordionItemProps) {
  const [isOpen, setIsOpen] = motion.useState(defaultOpen)

  return (
    <motion.div className="border-b border-border">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left"
        whileHover={{ paddingLeft: 8 }}
        transition={springs.gentle}
      >
        <span className="font-medium text-ivory">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={springs.gentle}
          className="text-gold"
        >
          ▼
        </motion.div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={springs.gentle}
        className="overflow-hidden"
      >
        <div className="pb-4 text-platinum text-sm leading-relaxed">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * Premium Slider/Range input
 */
interface PremiumSliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}

export function PremiumSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
}: PremiumSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <motion.div>
      {label && <label className="block text-sm font-medium text-platinum mb-2">{label}</label>}

      <motion.div className="relative h-1 rounded-full bg-glass">
        {/* Progress fill */}
        <motion.div
          className="absolute h-full rounded-full bg-gradient-to-r from-gold to-gold/80"
          style={{ width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={springs.smooth}
        />

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />

        {/* Thumb indicator */}
        <motion.div
          className="absolute top-1/2 w-5 h-5 -translate-y-1/2 rounded-full bg-gold shadow-lg"
          style={{ left: `${percentage}%` }}
          animate={{ left: `${percentage}%` }}
          transition={springs.smooth}
          whileHover={{ scale: 1.2 }}
        />
      </motion.div>
    </motion.div>
  )
}

// Fix for useState being used in non-hook context
import { useState } from 'react'
