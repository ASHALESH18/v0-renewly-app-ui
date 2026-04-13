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
  const deleteSubscription = useStore((state) => state.deleteSubscription)
  const addToast = useStore((state) => state.addToast)

  const handleDelete = () => {
    deleteSubscription(subscription.id)
    addToast({
      type: 'success',
      title: `${subscription.name} removed`,
      message: 'Subscription deleted successfully.',
    })
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu((prev) => !prev)}
        className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        type="button"
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
              className="absolute right-0 top-full mt-2 z-50 w-52 glass rounded-xl p-2 space-y-1 shadow-luxury"
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground text-sm cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Subscription
                </button>
              )}

              <div className="h-px bg-border my-1" />

              <button
                type="button"
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-crimson/10 transition-colors text-crimson text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Remove Subscription
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}