'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import useStore from '@/lib/store'
import { springs } from '@/components/motion'
import { createClient } from '@/lib/supabase/client'

/**
 * Browser Push Onboarding Popup
 * Shows once after first successful signup when Notification API is available
 */
export function BrowserPushOnboarding() {
  const [showPopup, setShowPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  const addToast = useStore((state) => state.addToast)

  useEffect(() => {
    checkShouldShowPopup()
  }, [])

  const checkShouldShowPopup = async () => {
    // Check if browser supports Notification API
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return
    }

    // Only show if permission is default (not yet requested)
    if (Notification.permission !== 'default') {
      return
    }

    // Check if user has already seen the popup
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('push_prompt_seen_at')
      .eq('user_id', user.id)
      .single()

    if (error || !settings || settings.push_prompt_seen_at === null) {
      setShowPopup(true)
    }
  }

  const handleEnablePush = async () => {
    setIsLoading(true)

    try {
      // Request permission
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        // Update store
        await updateNotificationSettings({ pushNotifications: true })
        addToast({
          type: 'success',
          title: 'Browser push enabled',
          message: 'You will receive renewal reminders on this browser.',
        })
      } else {
        // Permission denied or default
        await updateNotificationSettings({ pushNotifications: false })
        addToast({
          type: 'info',
          title: 'Permission not granted',
          message: 'You can enable push notifications anytime in Settings.',
        })
      }

      // Mark prompt as seen
      await markPromptAsSeen()
      setShowPopup(false)
    } catch (err) {
      console.error('[v0] Error requesting push permission:', err)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to request permission.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotNow = async () => {
    // Mark prompt as seen without requesting permission
    await markPromptAsSeen()
    setShowPopup(false)
  }

  const markPromptAsSeen = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_settings')
        .update({ push_prompt_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('[v0] Error marking push prompt as seen:', err)
    }
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleNotNow}
            className="absolute inset-0 bg-black/50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springs.smooth}
            className="relative w-full max-w-sm rounded-2xl bg-background border border-border p-6 shadow-luxury"
          >
            {/* Close button */}
            <button
              onClick={handleNotNow}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-gold" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-xl font-semibold text-foreground mb-2">
              Enable renewal reminders?
            </h2>

            {/* Body */}
            <p className="text-center text-sm text-muted-foreground mb-6">
              Renewly can remind you about upcoming subscription renewals on this browser.
            </p>

            {/* Helper text */}
            <p className="text-center text-xs text-muted-foreground/70 mb-6">
              You can change this anytime in Settings.
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleNotNow}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Not now
              </button>
              <button
                onClick={handleEnablePush}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enabling...' : 'Enable Browser Push'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
