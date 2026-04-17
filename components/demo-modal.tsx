'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
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

// Fast, minimal animation config - no blur filters
const fastTransition = { duration: 0.15, ease: [0.32, 0.72, 0, 1] }

/**
 * Optimized demo modal - instant appearance with minimal animation overhead
 * Uses CSS transitions where possible, avoids expensive blur filters
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

  // Handle ESC key to close modal - memoized for performance
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleEscape])

  const handlePlayClick = useCallback(() => {
    setIsVideoReady(true)
    setHasPlayedVideo(true)
  }, [])

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          {/* Backdrop - simple opacity, no blur animation */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal - instant scale + opacity, no blur filter */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={fastTransition}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className={cn(
                'relative rounded-3xl bg-gradient-to-br from-slate/90 via-graphite to-slate/90',
                'border border-gold/20 backdrop-blur-xl shadow-2xl pointer-events-auto',
                'max-h-[90vh] overflow-hidden',
                'w-full max-w-4xl'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors active:scale-95"
                aria-label="Close demo modal"
              >
                <X className="w-5 h-5 text-platinum" />
              </button>

              {/* Video area - render immediately, no staggered delay */}
              <div
                className="relative bg-obsidian overflow-hidden"
                style={{ aspectRatio: '16 / 9' }}
              >
                {!isVideoReady ? (
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-obsidian via-graphite to-obsidian flex flex-col items-center justify-center cursor-pointer group"
                    onClick={handlePlayClick}
                  >
                    {/* Static radial glow - no animation */}
                    <div className="absolute inset-0 bg-gradient-radial from-gold/8 to-transparent" />

                    {/* Play button - instant render */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center group-hover:shadow-[0_0_40px_rgba(199,163,106,0.4)] transition-shadow active:scale-95">
                        <Play className="w-8 h-8 text-obsidian fill-obsidian ml-1" />
                      </div>

                      <div className="text-center">
                        <p className="text-ivory font-semibold mb-1">
                          {videoUrl ? 'Click to play demo' : 'Demo video'}
                        </p>
                        <p className="text-platinum text-sm">
                          {videoUrl ? 'Premium 3-minute walkthrough' : 'Coming soon'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : videoUrl ? (
                  <div className="absolute inset-0">
                    <iframe
                      className="w-full h-full"
                      src={`${videoUrl}?autoplay=1&modestbranding=1`}
                      title="Renewly Demo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-gold" />
                      </div>
                      <h3 className="text-ivory font-semibold text-lg mb-2">Demo video coming soon</h3>
                      <p className="text-platinum text-sm mb-6">We&apos;re preparing an exclusive walkthrough of Renewly&apos;s premium features.</p>
                      <p className="text-gold text-xs font-medium">Stay tuned for the full experience</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content area - instant render */}
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-ivory mb-2">{title}</h2>
                  <p className="text-platinum text-sm leading-relaxed">{subtitle}</p>
                </div>

                {/* Capability chips - static, no staggered animation */}
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-wider text-platinum/60 mb-3">
                    Features included
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {capabilityChips.map((chip) => (
                      <div
                        key={chip.label}
                        className="px-4 py-2 rounded-full bg-gold/10 border border-gold/20 flex items-center gap-2"
                      >
                        <span className="text-lg">{chip.icon}</span>
                        <span className="text-sm text-gold font-medium">{chip.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl border border-glass-border text-platinum hover:text-ivory transition-colors hover:bg-white/5 active:scale-[0.98]"
                  >
                    Close
                  </button>

                  {videoUrl && hasPlayedVideo && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-medium hover:bg-gold/20 transition-colors flex items-center gap-2 active:scale-[0.98]"
                    >
                      Watch on YouTube
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
