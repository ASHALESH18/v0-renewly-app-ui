'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import useStore from '@/lib/store'
import { springs } from '@/components/motion'

/**
 * Browser Push Onboarding Popup
 * Shows once after first successful signup when browser permission is default state
 * Reconciles browser permission with DB settings automatically
 */
export function BrowserPushOnboarding() {
  const [showPopup, setShowPopup] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reconciliationDone, setReconciliationDone] = useState(false)

  const notificationSettings = useStore((state) => state.notificationSettings)
  const updateNotificationSettings = useStore((state) => state.updateNotificationSettings)
  const addToast = useStore((state) => state.addToast)

  // Check browser permission and reconcile on mount
  useEffect(() => {
    reconcileBrowserPermission()
  }, [])

  const reconcileBrowserPermission = async () => {
    // Check if browser supports Notification API
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setReconciliationDone(true)
      return
    }

    const permission = Notification.permission

    // If permission already granted, sync to DB without popup
    if (permission === 'granted') {
      await callBrowserPushAPI(true, true)
      setReconciliationDone(true)
      return
    }

    // If permission already denied, sync to DB without popup
    if (permission === 'denied') {
      await callBrowserPushAPI(false, true)
      setReconciliationDone(true)
      return
    }

    // Permission is 'default' - determine if we should show popup
    checkShouldShowPopup()
  }

  const checkShouldShowPopup = async () => {
    // Only show if prompt hasn't been seen yet
    if (notificationSettings.pushPromptSeenAt) {
      setReconciliationDone(true)
      return
    }

    // Show popup since permission is default and prompt not seen
    setShowPopup(true)
    setReconciliationDone(true)
  }

  const callBrowserPushAPI = async (pushEnabled: boolean, markSeen: boolean) => {
    try {
      const response = await fetch('/api/notifications/browser-push-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pushNotifications: pushEnabled,
          markPromptSeen: markSeen,
        }),
      })

      if (!response.ok) {
        console.warn('[v0] Failed to update push preference:', response.status)
        return
      }

      const data = await response.json()
      if (data.success) {
        updateNotificationSettings({
          pushNotifications: data.pushNotifications,
          pushPromptSeenAt: data.pushPromptSeenAt,
        })
      }
    } catch (err) {
      console.error('[v0] Error calling browser push API:', err)
    }
  }

  const handleEnablePush = async () => {
    setIsLoading(true)

    try {
      // Request permission from browser
      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        // Permission granted - save to DB
        await callBrowserPushAPI(true, true)
        addToast({
          type: 'success',
          title: 'Browser push enabled',
          message: 'You will receive renewal reminders on this browser.',
        })
      } else {
        // Permission denied or default after request - save as disabled
        await callBrowserPushAPI(false, true)
        addToast({
          type: 'info',
          title: 'Permission not granted',
          message: 'You can enable push notifications anytime in Settings.',
        })
      }

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
    setIsLoading(true)

    try {
      // Mark prompt as seen without requesting permission
      await callBrowserPushAPI(false, true)
      setShowPopup(false)
    } catch (err) {
      console.error('[v0] Error marking prompt seen:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render until reconciliation is complete
  if (!reconciliationDone) {
    return null
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={springs.smooth}
            className="relative w-full max-w-sm mx-4 rounded-2xl bg-card border border-border shadow-2xl p-6"
          >
            {/* Close button */}
            <button
              onClick={handleNotNow}
              className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Stay on top of your subscriptions
                </h2>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6">
              Get browser notifications before your subscriptions renew so you never miss a charge.
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnablePush}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Processing...' : 'Enable Browser Push'}
              </button>
              <button
                onClick={handleNotNow}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-border text-foreground font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Not now
              </button>
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              You can change this anytime in Settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
