'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { springs } from './motion'

interface SuccessAnimationProps {
  message?: string
  onComplete?: () => void
  autoCloseDuration?: number
}

export function SuccessAnimation({
  message = 'Success!',
  onComplete,
  autoCloseDuration = 2000,
}: SuccessAnimationProps) {
  motion.useMotionValueEvent
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={springs.gentle}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        onAnimationComplete={() => {
          if (autoCloseDuration > 0) {
            setTimeout(onComplete, autoCloseDuration)
          }
        }}
      >
        {/* Animated circle background */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...springs.gentle }}
          className="relative w-20 h-20"
        >
          {/* Outer ring */}
          <motion.svg
            className="absolute inset-0"
            viewBox="0 0 100 100"
            initial={{ rotate: -90 }}
            animate={{ rotate: 270 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="2"
              strokeDasharray={`${Math.PI * 90} ${Math.PI * 90}`}
            />
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C7A36A" />
                <stop offset="100%" stopColor="#D4B87A" />
              </linearGradient>
            </defs>
          </motion.svg>

          {/* Center circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, ...springs.gentle }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <Check className="w-10 h-10 text-gold" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springs.gentle }}
          className="text-lg font-semibold text-foreground"
        >
          {message}
        </motion.p>

        {/* Pulse effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gold/20"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ pointerEvents: 'none' }}
        />
      </motion.div>
    </motion.div>
  )
}

// Toast notification for smaller messages
export function Toast({
  message,
  type = 'success',
  duration = 3000,
}: {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}) {
  const colors = {
    success: 'bg-emerald/10 text-emerald border-emerald/20',
    error: 'bg-crimson/10 text-crimson border-crimson/20',
    info: 'bg-gold/10 text-gold border-gold/20',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={springs.gentle}
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl border backdrop-blur-sm ${colors[type]} z-50`}
    >
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  )
}
