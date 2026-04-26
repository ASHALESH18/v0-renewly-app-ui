'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Pause,
  Play,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import useStore from '@/lib/store'
import type {
  Subscription,
  SubscriptionStatus,
  SubscriptionCategory,
  BillingCycle,
} from '@/lib/types'
import { SubscriptionIcon } from '@/lib/brand-icons'

interface SubscriptionDetailSheetProps {
  subscription: Subscription | null
  open: boolean
  onClose: () => void
}

const statusOptions: { value: SubscriptionStatus; label: string; icon: ReactNode }[] = [
  { value: 'active', label: 'Active', icon: <Play className="w-4 h-4" /> },
  { value: 'paused', label: 'Paused', icon: <Pause className="w-4 h-4" /> },
  { value: 'unused', label: 'Unused', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <X className="w-4 h-4" /> },
]

const billingCycles: { id: BillingCycle; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

const categories: { id: SubscriptionCategory; label: string }[] = [
  { id: 'Streaming', label: 'Streaming' },
  { id: 'Music', label: 'Music' },
  { id: 'AI & Tools', label: 'AI & Tools' },
  { id: 'Productivity', label: 'Productivity' },
  { id: 'Cloud & Storage', label: 'Cloud & Storage' },
  { id: 'Fitness', label: 'Fitness' },
  { id: 'News & Media', label: 'News & Media' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Utilities', label: 'Utilities' },
  { id: 'Services', label: 'Services' },
  { id: 'Finance', label: 'Finance' },
  { id: 'Shopping', label: 'Shopping' },
  { id: 'Education', label: 'Education' },
  { id: 'Security', label: 'Security' },
  { id: 'Other', label: 'Other' },
]
export function SubscriptionDetailSheet({
  subscription,
  open,
  onClose,
}: SubscriptionDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<Subscription | null>(subscription)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const updateSubscriptionRemote = useStore((state) => state.updateSubscriptionRemote)
  const deleteSubscriptionRemote = useStore((state) => state.deleteSubscriptionRemote)
  const addToast = useStore((state) => state.addToast)

  useEffect(() => {
    if (open) {
      setIsEditing(false)
      setShowDeleteConfirm(false)
      setFormData(subscription)
    } else {
      setIsEditing(false)
      setShowDeleteConfirm(false)
      setFormData(null)
      setIsSaving(false)
      setIsDeleting(false)
    }
  }, [subscription, open])

  const displaySubscription = formData || subscription

  const handleSave = async () => {
    if (!subscription || !formData || isSaving) return

    const trimmedName = formData.name.trim()

    if (!trimmedName || !formData.amount || !formData.renewalDate) {
      addToast({
        type: 'error',
        title: 'Missing information',
        message: 'Please fill in all required fields',
      })
      return
    }

    try {
      setIsSaving(true)

      const result = await updateSubscriptionRemote(subscription.id, {
        name: trimmedName,
        amount: formData.amount,
        billingCycle: formData.billingCycle,
        renewalDate: formData.renewalDate,
        category: formData.category,
        status: formData.status,
        currency: formData.currency,
        description: formData.description,
      })

      if (!result.success) {
        addToast({
          type: 'error',
          title: 'Update failed',
          message: result.error || 'Could not update subscription',
        })
        return
      }

      setFormData((prev) =>
        prev
          ? {
            ...prev,
            name: trimmedName,
          }
          : prev
      )

      addToast({
        type: 'success',
        title: 'Subscription updated',
        message: `${trimmedName} has been updated`,
      })

      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!subscription || isDeleting) return

    try {
      setIsDeleting(true)

      const result = await deleteSubscriptionRemote(subscription.id)

      if (!result.success) {
        addToast({
          type: 'error',
          title: 'Delete failed',
          message: result.error || 'Could not delete subscription',
        })
        return
      }

      addToast({
        type: 'success',
        title: 'Subscription deleted',
        message: `${subscription.name} has been removed`,
      })

      handleClose()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setShowDeleteConfirm(false)
    setFormData(null)
    onClose()
  }

  if (!displaySubscription) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-card"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                {isEditing ? 'Edit Subscription' : 'Subscription Details'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-secondary/50 transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-100px)] pb-safe">
              <div className="px-4 py-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                  <SubscriptionIcon
                    name={displaySubscription.name}
                    fallbackColor={displaySubscription.color}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {displaySubscription.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {displaySubscription.category}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Service Name
                        </label>
                        <Input
                          value={formData?.name || ''}
                          onChange={(e) =>
                            setFormData(formData ? { ...formData, name: e.target.value } : null)
                          }
                          className="h-12 bg-secondary border-0 rounded-xl text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Amount ({displaySubscription.currency || '₹'})
                        </label>
                        <Input
                          type="number"
                          value={formData?.amount || ''}
                          onChange={(e) =>
                            setFormData(
                              formData
                                ? { ...formData, amount: parseFloat(e.target.value) || 0 }
                                : null
                            )
                          }
                          className="h-12 bg-secondary border-0 rounded-xl text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Billing Cycle
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {billingCycles.map((cycle) => (
                            <button
                              key={cycle.id}
                              onClick={() =>
                                setFormData(
                                  formData ? { ...formData, billingCycle: cycle.id } : null
                                )
                              }
                              className={cn(
                                'py-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
                                formData?.billingCycle === cycle.id
                                  ? 'bg-gold text-obsidian'
                                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                              )}
                              type="button"
                            >
                              {cycle.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Next Renewal Date
                        </label>
                        <Input
                          type="date"
                          value={formData?.renewalDate || ''}
                          onChange={(e) =>
                            setFormData(
                              formData ? { ...formData, renewalDate: e.target.value } : null
                            )
                          }
                          className="h-12 bg-secondary border-0 rounded-xl text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Category
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() =>
                                setFormData(formData ? { ...formData, category: cat.id } : null)
                              }
                              className={cn(
                                'py-3 rounded-xl text-sm font-medium transition-all truncate cursor-pointer',
                                formData?.category === cat.id
                                  ? 'bg-gold text-obsidian'
                                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                              )}
                              type="button"
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {statusOptions.map((status) => (
                            <button
                              key={status.value}
                              onClick={() =>
                                setFormData(formData ? { ...formData, status: status.value } : null)
                              }
                              className={cn(
                                'flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer',
                                formData?.status === status.value
                                  ? 'bg-gold text-obsidian'
                                  : 'bg-secondary text-muted-foreground hover:text-foreground'
                              )}
                              type="button"
                            >
                              {status.icon}
                              {status.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => void handleSave()}
                        disabled={isSaving || isDeleting}
                        className="flex-1 h-14 rounded-xl bg-gold hover:bg-gold/90 text-obsidian font-semibold"
                      >
                        {isSaving ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false)
                          setFormData(subscription)
                        }}
                        disabled={isSaving || isDeleting}
                        className="flex-1 h-14 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-secondary/50">
                          <p className="text-sm text-muted-foreground mb-1">Amount</p>
                          <p className="text-2xl font-semibold text-gold">
                            {(displaySubscription.currency || '₹')}
                            {Number(displaySubscription.amount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/50">
                          <p className="text-sm text-muted-foreground mb-1">Billing</p>
                          <p className="text-2xl font-semibold text-foreground capitalize">
                            {displaySubscription.billingCycle}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-secondary/50">
                        <p className="text-sm text-muted-foreground mb-1">Next Renewal</p>
                        <p className="text-lg font-semibold text-foreground">
                          {displaySubscription.renewalDate
                            ? new Date(displaySubscription.renewalDate).toLocaleDateString('en-IN')
                            : 'Not set'}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-secondary/50">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <p className="text-lg font-semibold capitalize">
                          <span
                            className={cn(
                              'inline-block px-3 py-1 rounded-full text-sm font-medium',
                              displaySubscription.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : displaySubscription.status === 'paused'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : displaySubscription.status === 'unused'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-red-500/20 text-red-400'
                            )}
                          >
                            {displaySubscription.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsEditing(true)}
                        disabled={isSaving || isDeleting}
                        className="flex-1 h-14 rounded-xl bg-gold hover:bg-gold/90 text-obsidian font-semibold"
                      >
                        <Edit2 className="w-5 h-5 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isSaving || isDeleting}
                        className="flex-1 h-14 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold"
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}

                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <p className="text-foreground font-semibold mb-3">
                      Delete {displaySubscription.name}?
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void handleDelete()}
                        disabled={isDeleting || isSaving}
                        className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Delete'
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting || isSaving}
                        className="flex-1 h-12 rounded-xl bg-secondary hover:bg-secondary/70 text-foreground font-semibold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}