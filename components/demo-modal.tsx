'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { premiumBackdropVariants, luxurySlideUp, springs } from '@/components/motion'
import { cn } from '@/lib/utils'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
  title?: string
  subtitle?: string
}

const capabilityChips = [
  { icon: '📊', label: 'Leak Report' },
  { icon: '🔔', label: 'Renewal Reminders' },
  { icon: '💱', label: 'Multi-Currency Support' },
]

/**
 * Premium cinematic demo modal with lazy-loaded YouTube video
 * Stays in-site while providing option to watch on YouTube
 */
export function DemoModal({
  isOpen,
  onClose,
  videoUrl = '',
  title = 'Renewly Demo',
  subtitle = 'A quick look at how Renewly helps you own every renewal.',
}: DemoModalProps) {
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [hasPlayedVideo, setHasPlayedVideo] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsVideoReady(false)
    }
  }, [isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handlePlayClick = () => {
    setIsVideoReady(true)
    setHasPlayedVideo(true)
  }

  const handleWatchOnYouTube = () => {
    if (videoUrl) {
      window.open(videoUrl, '_blank')
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Premium backdrop */}
          <motion.div
            key="backdrop"
            variants={premiumBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal container - responsive layout */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(12px)', y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)', y: 20 }}
            transition={{ ...springs.cinematic, duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className={cn(
                'relative rounded-3xl bg-gradient-to-br from-slate/80 via-graphite to-slate/80',
                'border border-gold/20 backdrop-blur-xl shadow-2xl pointer-events-auto',
                'max-h-[90vh] overflow-hidden',
                'w-full max-w-4xl'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button - premium positioning */}
              <motion.button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close demo modal"
              >
                <X className="w-5 h-5 text-platinum" />
              </motion.button>

              {/* Video area */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative bg-obsidian overflow-hidden"
                style={{ aspectRatio: '16 / 9' }}
              >
                {!isVideoReady ? (
                  <>
                    {/* Placeholder poster */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-obsidian via-graphite to-obsidian flex flex-col items-center justify-center cursor-pointer group"
                      onClick={handlePlayClick}
                    >
                      {/* Radial glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-radial from-gold/10 to-transparent"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      {/* Play button indicator */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, ...springs.gentle }}
                        className="relative z-10 flex flex-col items-center gap-4"
                      >
                        <motion.div
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(199,163,106,0.4)] transition-all"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Play className="w-8 h-8 text-obsidian fill-obsidian ml-1" />
                        </motion.div>

                        <motion.div
                          className="text-center"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <p className="text-ivory font-semibold mb-1">
                            {videoUrl ? 'Click to play demo' : 'Demo video'}
                          </p>
                          <p className="text-platinum text-sm">
                            {videoUrl ? 'Premium 3-minute walkthrough' : 'Coming soon'}
                          </p>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </>
                ) : videoUrl ? (
                  <>
                    {/* YouTube embed - lazy loaded */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <iframe
                        className="w-full h-full"
                        src={`${videoUrl}?autoplay=1&modestbranding=1`}
                        title="Renewly Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Coming soon state */}
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.div
                        className="text-center"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, ...springs.gentle }}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                          <Play className="w-8 h-8 text-gold" />
                        </div>
                        <h3 className="text-ivory font-semibold text-lg mb-2">Demo video coming soon</h3>
                        <p className="text-platinum text-sm mb-6">We're preparing an exclusive walkthrough of Renewly's premium features.</p>
                        <p className="text-gold text-xs font-medium">Stay tuned for the full experience</p>
                      </motion.div>
                    </motion.div>
                  </>
                )}
              </motion.div>

              {/* Content area with title, subtitle, and actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="p-8"
              >
                {/* Title and subtitle */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-ivory mb-2">{title}</h2>
                  <p className="text-platinum text-sm leading-relaxed">{subtitle}</p>
                </div>

                {/* Capability chips */}
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-wider text-platinum/60 mb-3">
                    Features included
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {capabilityChips.map((chip, index) => (
                      <motion.div
                        key={chip.label}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                          delay: 0.4 + index * 0.1,
                          ...springs.gentle,
                        }}
                        className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 flex items-center gap-2"
                      >
                        <span className="text-lg">{chip.icon}</span>
                        <span className="text-sm text-gold font-medium">{chip.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <motion.button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl border border-glass-border text-platinum hover:text-ivory transition-colors hover:bg-white/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Close
                  </motion.button>

                  {videoUrl && hasPlayedVideo && (
                    <motion.a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleWatchOnYouTube}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-medium hover:bg-gold/20 transition-colors flex items-center gap-2 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Watch on YouTube
                      <ExternalLink className="w-4 h-4" />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
