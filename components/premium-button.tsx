'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { magneticButtonVariants, durations, easings } from '@/components/motion'

interface PremiumButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

/**
 * PremiumButton — restrained luxury feedback.
 * Uses the shared magneticButtonVariants for consistent hover/press across the app.
 * Transitions favor the `luxury` curve for a confident, expensive feel.
 */
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    { children, className, variant = 'primary', size = 'md', isLoading = false, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }

    const variantClasses = {
      primary: 'gold-gradient text-obsidian font-semibold shadow-luxury',
      secondary: 'border border-glass-border text-ivory hover:bg-glass/50',
      ghost: 'text-platinum hover:text-ivory',
      danger: 'bg-red/10 border border-red/20 text-red hover:bg-red/20',
    }

    return (
      <motion.button
        ref={ref}
        variants={magneticButtonVariants}
        initial="initial"
        whileHover={!isLoading ? 'hover' : undefined}
        whileTap={!isLoading ? 'tap' : undefined}
        disabled={isLoading}
        className={cn(
          'relative rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-[background-color,color,box-shadow] duration-200 ease-out',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        style={{ transformOrigin: 'center' }}
        {...props}
      >
        {isLoading ? (
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: durations.quick, ease: easings.silk }}
          >
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-current border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            Loading...
          </motion.div>
        ) : (
          children
        )}
      </motion.button>
    )
  }
)

PremiumButton.displayName = 'PremiumButton'
