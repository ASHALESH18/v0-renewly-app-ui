'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check,
  Tv, Music, Briefcase, Cloud, Dumbbell, Newspaper, Gamepad2, Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/date-picker-field'
import useStore from '@/lib/store'
import { currencies } from '@/lib/locale-utils'
import { validateSubscriptionForm, getFirstInvalidField, type SubscriptionValidationErrors } from '@/lib/validation'
import type { Subscription, SubscriptionCategory, BillingCycle } from '@/lib/types'

interface EditSubscriptionModalProps {
  open: boolean
  onClose: () => void
  subscription: Subscription | null
}

// Map lowercase categories to typed categories
const categoryMap: Record<string, SubscriptionCategory> = {
  streaming: 'Entertainment',
  music: 'Music',
  productivity: 'Productivity',
  cloud: 'Storage',
  fitness: 'Fitness',
  news: 'News & Magazines',
  gaming: 'Entertainment',
  other: 'Other',
  entertainment: 'Entertainment',
  ai: 'AI & Tools',
}

const categories = [
  { id: 'streaming', label: 'Streaming', icon: Tv },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'productivity', label: 'Productivity', icon: Briefcase },
  { id: 'cloud', label: 'Cloud & Storage', icon: Cloud },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'news', label: 'News & Media', icon: Newspaper },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'other', label: 'Other', icon: Package },
]

const billingCycles: { id: BillingCycle; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

type EditSubscriptionResult = {
  success: boolean
  error?: string
}

export function EditSubscriptionModal({ open, onClose, subscription }: EditSubscriptionModalProps) {
  const [name, setName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Other')
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [nextBilling, setNextBilling] = useState('')
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState<SubscriptionValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Refs for field focus on validation error
  const amountRef = useRef<HTMLInputElement>(null)
  const cycleRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  const updateSubscriptionRemote = useStore((state) => state.updateSubscriptionRemote)
  const addToast = useStore((state) => state.addToast)
  const notificationSettings = useStore((state) => state.notificationSettings)

  // Initialize form when subscription changes
  React.useEffect(() => {
    if (subscription && open) {
      setName(subscription.name || '')
      setSelectedCategory(subscription.category as SubscriptionCategory)
      setSelectedCycle(subscription.billingCycle as BillingCycle)
      setAmount(subscription.amount.toString())
      setCurrency(subscription.currency || 'INR')
      setNextBilling(subscription.renewalDate || '')
      setDescription(subscription.description || '')
      setValidationErrors({})
    }
  }, [subscription, open])

  const currencySymbolMap: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
  }

  const currencySymbol = currencySymbolMap[currency] || currency

  const handleSave = async () => {
    if (!subscription) return

    // Validate form
    const errors = validateSubscriptionForm({
      serviceName: name,
      amount,
      billingCycle: selectedCycle,
      renewalDate: nextBilling,
      category: selectedCategory,
      isCustom: true, // Treat as custom since name is editable
    })

    // If there are errors, show them and focus first invalid field
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)

      // Focus the first invalid field
      const firstInvalidField = getFirstInvalidField(errors)
      if (firstInvalidField === 'amount' && amountRef.current) {
        amountRef.current.focus()
      } else if (firstInvalidField === 'renewalDate' && dateRef.current) {
        dateRef.current.focus()
      } else if (firstInvalidField === 'category' && categoryRef.current) {
        categoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      return
    }

    // Clear validation errors on successful validation
    setValidationErrors({})
    setIsSaving(true)

    const rawResult = await updateSubscriptionRemote(subscription.id, {
      name,
      category: selectedCategory,
      amount: parseFloat(amount),
      currency,
      billingCycle: selectedCycle,
      renewalDate: nextBilling,
      description: description.trim() || undefined,
    })

    setIsSaving(false)

    const result = rawResult as EditSubscriptionResult

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Subscription updated',
        message: `${name} has been updated`,
      })

      onClose()
    } else {
      addToast({
        type: 'error',
        title: 'Failed to update subscription',
        message: result.error || 'Please try again',
      })
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setValidationErrors({})
    }, 300)
  }

  if (!subscription) return null

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
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-card"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Edit Subscription
                </h2>
              </div>

              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-4 pb-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                <SubscriptionIcon
                  name={subscription.name}
                  fallbackColor={subscription.color}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{subscription.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{subscription.category}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Service Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (validationErrors.serviceName) {
                      setValidationErrors({ ...validationErrors, serviceName: undefined })
                    }
                  }}
                  placeholder="Service name"
                  className={cn(
                    'h-12 bg-secondary border rounded-xl text-foreground transition-colors',
                    validationErrors.serviceName
                      ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/50'
                      : 'border-transparent focus:ring-gold/50'
                  )}
                />
                {validationErrors.serviceName && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {validationErrors.serviceName}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Amount & Currency
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground pointer-events-none">
                      {currencySymbol}
                    </span>
                    <Input
                      ref={amountRef}
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value)
                        if (validationErrors.amount) {
                          setValidationErrors({ ...validationErrors, amount: undefined })
                        }
                      }}
                      placeholder="0.00"
                      className={cn(
                        'pl-12 h-12 bg-secondary border rounded-xl text-foreground text-lg font-semibold transition-colors',
                        validationErrors.amount
                          ? 'border-red-500/50 bg-red-500/5 focus:ring-red-500/50'
                          : 'border-transparent focus:ring-gold/50'
                      )}
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-12 px-3 bg-secondary border border-transparent rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code}
                      </option>
                    ))}
                  </select>
                </div>
                {validationErrors.amount && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {validationErrors.amount}
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground">
                  Selected: {currencies.find((c) => c.code === currency)?.name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Billing Cycle
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {billingCycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => {
                        setSelectedCycle(cycle.id)
                        if (validationErrors.billingCycle) {
                          setValidationErrors({ ...validationErrors, billingCycle: undefined })
                        }
                      }}
                      className={cn(
                        'py-3 rounded-xl text-sm font-medium transition-all',
                        selectedCycle === cycle.id
                          ? 'bg-gold text-obsidian'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {cycle.label}
                    </button>
                  ))}
                </div>
                {validationErrors.billingCycle && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {validationErrors.billingCycle}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <DatePickerField
                  label="Next Billing Date"
                  value={nextBilling}
                  onChange={(date) => {
                    setNextBilling(date)
                    if (validationErrors.renewalDate) {
                      setValidationErrors({ ...validationErrors, renewalDate: undefined })
                    }
                  }}
                  locale={
                    notificationSettings?.language === 'es'
                      ? 'es-ES'
                      : notificationSettings?.language === 'fr'
                        ? 'fr-FR'
                        : 'en-IN'
                  }
                  placeholder="Select renewal date"
                />
                {validationErrors.renewalDate && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {validationErrors.renewalDate}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Category
                </label>
                <div ref={categoryRef} className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const mappedCategory = categoryMap[cat.id] || 'Other'
                    const IconComponent = cat.icon
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(mappedCategory as SubscriptionCategory)
                          if (validationErrors.category) {
                            setValidationErrors({ ...validationErrors, category: undefined })
                          }
                        }}
                        className={cn(
                          'py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1',
                          selectedCategory === mappedCategory
                            ? 'bg-gold text-obsidian'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-xs text-center leading-tight">{cat.label}</span>
                      </button>
                    )
                  })}
                </div>
                {validationErrors.category && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    {validationErrors.category}
                  </motion.p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add comments, account details, billing notes, or reminder context"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 transition-colors resize-none"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-14 rounded-xl bg-gold hover:bg-gold/90 text-obsidian font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 mr-2 border-2 border-obsidian/30 border-t-obsidian rounded-full"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
