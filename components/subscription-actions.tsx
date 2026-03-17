'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal, Trash2, Eye, EyeOff, Edit2, Copy, ExternalLink } from 'lucide-react'
import useStore from '@/lib/store'
import type { Subscription } from '@/lib/types'

interface SubscriptionActionsProps {
  subscription: Subscription
  onEdit?: () => void
}

export function SubscriptionActions({ subscription, onEdit }: SubscriptionActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const deleteSubscription = useStore((state) => state.deleteSubscription)
  const updateSubscription = useStore((state) => state.updateSubscription)
  const addToast = useStore((state) => state.addToast)

  const handleDelete = () => {
    deleteSubscription(subscription.id)
    addToast({
      type: 'success',
      title: `${subscription.name} removed`,
      message: 'Subscription deleted successfully.'
    })
    setShowMenu(false)
  }

  const handleMarkUnused = () => {
    updateSubscription(subscription.id, { status: 'unused' })
    addToast({
      type: 'info',
      title: 'Marked as unused',
      message: `${subscription.name} marked for review.`
    })
    setShowMenu(false)
  }

  const handleCopyDetails = () => {
    const text = `${subscription.name}: ${subscription.currency}${subscription.amount}/${subscription.billingCycle}`
    navigator.clipboard.writeText(text)
    addToast({
      type: 'success',
      title: 'Copied to clipboard',
      message: 'Subscription details copied.'
    })
    setShowMenu(false)
  }

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
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
              className="absolute right-0 top-full mt-2 z-50 w-48 glass rounded-xl p-2 space-y-1 shadow-luxury"
            >
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Details
                </button>
              )}
              
              <button
                onClick={handleCopyDetails}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy Details
              </button>
              
              <button
                onClick={handleMarkUnused}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground text-sm"
              >
                <Eye className="w-4 h-4" />
                Mark Unused
              </button>
              
              <div className="h-px bg-border my-1" />
              
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-crimson/10 transition-colors text-crimson text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
