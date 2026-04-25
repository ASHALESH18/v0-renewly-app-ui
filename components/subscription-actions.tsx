'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import useStore from '@/lib/store'
import type { Subscription } from '@/lib/types'

interface SubscriptionActionsProps {
  subscription: Subscription
  onEdit?: () => void
}

export function SubscriptionActions({ subscription, onEdit }: SubscriptionActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteSubscription = useStore((state) => state.deleteSubscription)
  const deleteSubscriptionRemote = useStore((state) => state.deleteSubscriptionRemote)
  const addToast = useStore((state) => state.addToast)

  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteSubscriptionRemote(subscription.id)

    if (result.success) {
      // Immediately remove from store for instant UI update
      deleteSubscription(subscription.id)
      
      addToast({
        type: 'success',
        title: `${subscription.name} removed`,
        message: 'Subscription deleted successfully.',
      })
      setShowMenu(false)
    } else {
      addToast({
        type: 'error',
        title: 'Failed to delete',
        message: result.error || 'Could not delete subscription. Please try again.',
      })
    }

    setIsDeleting(false)
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu((prev) => !prev)}
        className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        type="button"
        disabled={isDeleting}
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 z-40"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="absolute right-0 top-full mt-2 z-50 w-64 glass rounded-xl p-2 space-y-1 shadow-luxury border border-border/50"
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary/70 transition-colors text-foreground text-sm cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 shrink-0" />
                  <span>Edit Subscription</span>
                </button>
              )}

              <div className="h-px bg-border/60 my-1" />

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-destructive/20 transition-colors text-destructive font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>{isDeleting ? 'Removing...' : 'Remove Subscription'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
