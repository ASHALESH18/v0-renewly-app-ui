'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import {
  premiumBackdropVariants,
  sheetContentStagger,
  sheetContentItem,
  durations,
  easings,
  iconButtonVariants,
} from '@/components/motion'
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

// Signature modal entrance — scales in slightly, rises, then settles with luxury ease.
const modalContainerVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.975 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.985,
    transition: { duration: durations.base, ease: easings.exit },
  },
}

/**
 * Premium modal with luxury backdrop and silk-smooth choreography.
 * Content reveals in sequence: shell → title → body.
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
          <motion.div
            key="backdrop"
            variants={premiumBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/45 z-50"
          />

          <motion.div
            key="modal"
            variants={modalContainerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              variants={sheetContentStagger}
              initial="initial"
              animate="animate"
              className={cn(
                'relative rounded-2xl bg-card border border-border shadow-luxury pointer-events-auto',
                'max-h-[90vh] overflow-y-auto',
                sizeClasses[size],
                'w-full',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <motion.div
                  variants={sheetContentItem}
                  className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card rounded-t-2xl"
                >
                  <h2 className="text-xl font-semibold text-ivory">{title}</h2>

                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      variants={iconButtonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      aria-label="Close dialog"
                    >
                      <X className="w-5 h-5 text-platinum" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              <motion.div variants={sheetContentItem} className="p-6">
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
 * Premium bottom sheet — luxury slide with choreographed content.
 */
interface PremiumBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  showCloseButton?: boolean
  className?: string
}

const bottomSheetVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: durations.cinematic, ease: easings.luxury },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: durations.base, ease: easings.exit },
  },
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
          <motion.div
            key="backdrop"
            variants={premiumBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/45 z-40"
          />

          <motion.div
            key="sheet"
            variants={bottomSheetVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
          >
            <motion.div
              variants={sheetContentStagger}
              initial="initial"
              animate="animate"
              className={cn(
                'relative rounded-t-3xl bg-card border-t border-border shadow-luxury',
                'max-h-[90vh] overflow-y-auto',
                'pointer-events-auto',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Grabber */}
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <motion.div
                variants={sheetContentItem}
                className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card rounded-t-3xl"
              >
                {title && (
                  <h2 className="text-xl font-semibold text-ivory">{title}</h2>
                )}

                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-muted rounded-lg transition-colors ml-auto"
                    variants={iconButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    aria-label="Close sheet"
                  >
                    <X className="w-5 h-5 text-platinum" />
                  </motion.button>
                )}
              </motion.div>

              <motion.div variants={sheetContentItem} className="p-6 pb-8">
                {children}
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
