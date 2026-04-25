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

  const deleteSubscriptionRemote = useStore((state) => state.deleteSubscriptionRemote)
  const addToast = useStore((state) => state.addToast)

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)

    const result = await deleteSubscriptionRemote(subscription.id)

    if (result.success) {
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
        onClick={(e) => {
          e.stopPropagation()
          setShowMenu((prev) => !prev)
        }}
        className="rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer"
        type="button"
        disabled={isDeleting}
      >
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="subscription-action-menu absolute right-0 top-full mt-2 z-50 min-w-[272px] overflow-hidden rounded-2xl border border-border/60 bg-card/95 p-1.5 shadow-elevated backdrop-blur-xl"
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-secondary/70 cursor-pointer"
                >
                  <Edit2 className="h-4 w-4 shrink-0" />
                  <span>Edit Subscription</span>
                </button>
              )}

              <div className="my-1 h-px bg-border/60" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  void handleDelete()
                }}
                disabled={isDeleting}
                className="subscription-action-remove flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>{isDeleting ? 'Removing...' : 'Remove Subscription'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}