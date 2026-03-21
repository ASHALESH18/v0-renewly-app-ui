'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { premiumBackdropVariants, luxurySlideUp, springs } from '@/components/motion'
import { cn } from '@/lib/utils'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  showCloseButton?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

/**
 * Premium modal with luxury backdrop blur and smooth animations
 */
export function PremiumModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: PremiumModalProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Premium backdrop with blur */}
          <motion.div
            key="backdrop"
            variants={premiumBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal content */}
          <motion.div
            key="modal"
            variants={luxurySlideUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className={cn(
                'relative rounded-2xl bg-card border border-border shadow-luxury pointer-events-auto',
                'max-h-[90vh] overflow-y-auto',
                sizeClasses[size],
                'w-full',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              {title && (
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl">
                  <motion.h2
                    className="text-xl font-semibold text-ivory"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    {title}
                  </motion.h2>

                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-platinum" />
                    </motion.button>
                  )}
                </div>
              )}

              {/* Modal content */}
              <motion.div
                className="p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Premium bottom sheet with luxury slide animation
 */
interface PremiumBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  showCloseButton?: boolean
  className?: string
}

export function PremiumBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  className,
}: PremiumBottomSheetProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Premium backdrop with blur */}
          <motion.div
            key="backdrop"
            variants={premiumBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet content */}
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ ...springs.luxury, duration: 0.5 }}
            className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
          >
            <motion.div
              className={cn(
                'relative rounded-t-3xl bg-card border-t border-border',
                'max-h-[90vh] overflow-y-auto',
                'pointer-events-auto',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card rounded-t-3xl">
                {title && (
                  <motion.h2
                    className="text-xl font-semibold text-ivory"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    {title}
                  </motion.h2>
                )}

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5 text-platinum" />
                  </motion.button>
                )}
              </div>

              {/* Sheet content */}
              <motion.div
                className="p-6 pb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
