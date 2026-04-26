"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Search, Plus, ChevronRight, Check,
  Tv, Music, Briefcase, Cloud, Dumbbell, Newspaper, Gamepad2, Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePopularServices } from '@/lib/hooks/use-remote-data'
import { Input } from '@/components/ui/input'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/date-picker-field'
import { SubscriptionLimitPaywall } from '@/components/subscription-limit-paywall'
import useStore from '@/lib/store'
import { currencies } from '@/lib/locale-utils'
import { validateSubscriptionForm, getFirstInvalidField, type SubscriptionValidationErrors } from '@/lib/validation'
import type { SubscriptionCategory, BillingCycle } from '@/lib/types'

interface AddSubscriptionSheetProps {
  open: boolean
  onClose: () => void
}

// Map lowercase categories to typed categories (unique mappings)
const categoryMap: Record<string, SubscriptionCategory> = {
  streaming: 'Streaming',
  music: 'Music',
  productivity: 'Productivity',
  cloud: 'Cloud & Storage',
  fitness: 'Fitness',
  news: 'News & Media',
  gaming: 'Gaming',
  other: 'Other',
  entertainment: 'Streaming', // Map entertainment services to Streaming
  ai: 'AI & Tools',
  utilities: 'Utilities',
  homeservices: 'Home Services',
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

type AddSubscriptionResult = {
  success: boolean
  error?: string
  code?: string
  current?: number
  limit?: number
}

export function AddSubscriptionSheet({ open, onClose }: AddSubscriptionSheetProps) {
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all')
  const { popularServices } = usePopularServices()
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [customName, setCustomName] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('other') // Store UI category id
  const [customCategory, setCustomCategory] = useState('') // Store custom category text
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [nextBilling, setNextBilling] = useState('')
  const [description, setDescription] = useState('')
  const [validationErrors, setValidationErrors] = useState<SubscriptionValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  // Refs for field focus on validation error
  const serviceNameRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const cycleRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)

  const addSubscriptionRemote = useStore((state) => state.addSubscriptionRemote)
  const addToast = useStore((state) => state.addToast)
  const openSubscriptionLimitPaywall = useStore((state) => state.openSubscriptionLimitPaywall)
  const closeSubscriptionLimitPaywall = useStore((state) => state.closeSubscriptionLimitPaywall)
  const subscriptionLimitPaywallOpen = useStore((state) => state.subscriptionLimitPaywallOpen)
  const subscriptionLimitPaywallData = useStore((state) => state.subscriptionLimitPaywallData)
  const notificationSettings = useStore((state) => state.notificationSettings)

  // Use user's preferred currency from settings, fallback to INR
  const defaultCurrency = notificationSettings?.currencyCode || 'INR'

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

  // Filter services by search and selected category
  const filteredServices = popularServices.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedFilterCategory === 'all' || 
      service.category.toLowerCase() === selectedFilterCategory ||
      (selectedFilterCategory === 'entertainment' &&
        (service.category === 'entertainment' ||
          service.category === 'streaming' ||
          service.category === 'gaming'))
    return matchesSearch && matchesCategory
  })

  const resetFormState = () => {
    setStep('select')
    setSearchQuery('')
    setSelectedFilterCategory('all')
    setSelectedService(null)
    setCustomName('')
    setSelectedCategoryId('other')
    setCustomCategory('')
    setSelectedCycle('monthly')
    setAmount('')
    setCurrency(defaultCurrency)
    setNextBilling('')
    setDescription('')
    setValidationErrors({})
  }

  const handleSelectService = (service: any) => {
    setSelectedService(service)
    // Find the category id that matches this service
    const categoryId = categories.find(c => categoryMap[c.id] === categoryMap[service.category.toLowerCase()])?.id || 'other'
    setSelectedCategoryId(categoryId)
    setCustomCategory('') // Clear custom category when selecting known service
    setAmount('')
    setCurrency(defaultCurrency)
    setDescription('')
    setStep('details')
  }

  const handleCreateCustom = () => {
    setSelectedService(null)
    setSelectedCategoryId('other')
    setCustomCategory('')
    setCurrency(defaultCurrency)
    setDescription('')
    setStep('details')
  }

  const handleSave = async () => {
    // Determine final category value
    const baseCategory = categoryMap[selectedCategoryId] || 'Other'
    const finalCategory = selectedCategoryId === 'other' && customCategory.trim() 
      ? customCategory.trim() 
      : baseCategory

    // Validate form
    const errors = validateSubscriptionForm({
      serviceName: !selectedService ? customName : undefined,
      amount,
      billingCycle: selectedCycle,
      renewalDate: nextBilling,
      category: finalCategory,
      isCustom: !selectedService,
    })

    // If there are errors, show them and focus first invalid field
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      
      // Focus the first invalid field
      const firstInvalidField = getFirstInvalidField(errors)
      if (firstInvalidField === 'serviceName' && serviceNameRef.current) {
        serviceNameRef.current.focus()
      } else if (firstInvalidField === 'amount' && amountRef.current) {
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

    const rawResult = await addSubscriptionRemote({
      name: selectedService?.name || customName || 'New Subscription',
      category: finalCategory,
      amount: parseFloat(amount),
      currency,
      billingCycle: selectedCycle,
      renewalDate: nextBilling,
      description: description.trim() || undefined,
      status: 'active',
      logo: selectedService?.logo || undefined,
      color: selectedService?.color || selectedService?.brandColor || undefined,
    })

    setIsSaving(false)

    const result = rawResult as AddSubscriptionResult

    if (result.success) {
      addToast({
        type: 'success',
        title: 'Subscription added',
        message: `${selectedService?.name || customName} has been added to your subscriptions`,
      })

      onClose()
      resetFormState()
    } else if (result.code === 'SUBSCRIPTION_LIMIT_REACHED') {
      onClose()

      if (result.current !== undefined && result.limit !== undefined) {
        openSubscriptionLimitPaywall({ current: result.current, limit: result.limit })
      } else {
        openSubscriptionLimitPaywall({ current: 2, limit: 2 })
      }
    } else {
      addToast({
        type: 'error',
        title: 'Failed to add subscription',
        message: result.error || 'Please try again',
      })
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      resetFormState()
    }, 300)
  }

  return (
    <>
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
                  {step === 'details' && (
                    <button
                      onClick={() => setStep('select')}
                      className="p-2 -ml-2 rounded-full hover:bg-secondary/50 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                    </button>
                  )}
                  <h2 className="text-xl font-semibold text-foreground">
                    {step === 'select'
                      ? 'Add Subscription'
                      : 'Subscription Details'}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-100px)] pb-safe">
                <AnimatePresence mode="wait">
                  {step === 'select' ? (
                    <motion.div
                      key="select"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="px-4 pb-8"
                    >
                      <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search subscriptions, apps, services…"
                          className="pl-12 h-12 bg-secondary border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* Compact Category Filter - Chips */}
                      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'entertainment', label: 'Entertainment' },
                          { id: 'music', label: 'Music' },
                          { id: 'productivity', label: 'Productivity' },
                          { id: 'cloud', label: 'Storage' },
                          { id: 'fitness', label: 'Fitness' },
                          { id: 'news', label: 'News' },
                          { id: 'other', label: 'Other' },
                        ].map((cat) => (
                          <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedFilterCategory(cat.id)}
                            className={cn(
                              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                              selectedFilterCategory === cat.id
                                ? 'bg-gold text-obsidian'
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                            )}
                          >
                            {cat.label}
                          </motion.button>
                        ))}
                      </div>

                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                          {selectedFilterCategory === 'all' ? 'Popular Services' : 'Services'}
                        </h3>
                        {filteredServices.length > 0 ? (
                          <div className="grid grid-cols-4 gap-3">
                            {filteredServices.slice(0, 12).map((service) => (
                              <motion.button
                                key={service.id}
                                whileTap={{ scale: 0.95 }}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleSelectService(service)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-background"
                              >
                                <SubscriptionIcon
                                  name={service.name}
                                  fallbackColor={service.color}
                                  size="lg"
                                />
                                <span className="text-xs text-foreground text-center truncate w-full">
                                  {service.name}
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground mb-3">
                              No services found in {selectedFilterCategory === 'all' ? 'this category' : categories.find(c => c.id === selectedFilterCategory)?.label}
                            </p>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              whileHover={{ scale: 1.02 }}
                              onClick={handleCreateCustom}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="text-sm font-medium">Add as custom</span>
                            </motion.button>
                          </div>
                        )}
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleCreateCustom}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-background"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Add Custom Subscription</span>
                      </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="px-4 pb-8 space-y-6"
                    >
                      {selectedService && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                          <SubscriptionIcon
                            name={selectedService.name}
                            fallbackColor={selectedService.color}
                            size="lg"
                          />
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{selectedService.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{selectedService.category}</p>
                          </div>
                        </div>
                      )}

                      {!selectedService && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Service Name
                          </label>
                          <Input
                            ref={serviceNameRef}
                            value={customName}
                            onChange={(e) => {
                              setCustomName(e.target.value)
                              if (validationErrors.serviceName) {
                                setValidationErrors({ ...validationErrors, serviceName: undefined })
                              }
                            }}
                            placeholder="e.g., My Subscription"
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
                      )}

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
                                "py-3 rounded-xl text-sm font-medium transition-all",
                                selectedCycle === cycle.id
                                  ? "bg-gold text-obsidian"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
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

                      {/* Category Field - Now for all subscriptions */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Category
                        </label>
                        <div ref={categoryRef} className="grid grid-cols-4 gap-2">
                          {categories.map((cat) => {
                            const IconComponent = cat.icon
                            return (
                              <button
                                key={cat.id}
                                onClick={() => {
                                  setSelectedCategoryId(cat.id)
                                  if (validationErrors.category) {
                                    setValidationErrors({ ...validationErrors, category: undefined })
                                  }
                                }}
                                className={cn(
                                  "py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1",
                                  selectedCategoryId === cat.id
                                    ? "bg-gold text-obsidian"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
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

                        {/* Custom Category Input - Show only when Other is selected */}
                        {selectedCategoryId === 'other' && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="space-y-2 mt-4"
                          >
                            <label className="text-sm font-medium text-muted-foreground block">
                              Custom Category
                            </label>
                            <Input
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="e.g., Rent, RO Service, Appliance AMC"
                              className="h-12 bg-secondary border-transparent rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-gold/50 transition-colors"
                            />
                            <p className="text-xs text-muted-foreground">
                              Optional. Leave blank to save as "Other".
                            </p>
                          </motion.div>
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
                            Save Subscription
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SubscriptionLimitPaywall
        isOpen={subscriptionLimitPaywallOpen}
        onClose={closeSubscriptionLimitPaywall}
        current={subscriptionLimitPaywallData?.current}
        limit={subscriptionLimitPaywallData?.limit}
      />
    </>
  )
}
