"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Search, Plus, Calendar, DollarSign, Tag, 
  Bell, Camera, Link2, ChevronRight, Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePopularServices } from '@/lib/hooks/use-remote-data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DatePickerField } from '@/components/date-picker-field'
import useStore from '@/lib/store'
import { currencies } from '@/lib/locale-utils'
import type { SubscriptionCategory, BillingCycle } from '@/lib/types'

interface AddSubscriptionSheetProps {
  open: boolean
  onClose: () => void
}

// Map lowercase categories to typed categories
const categoryMap: Record<string, SubscriptionCategory> = {
  'streaming': 'Entertainment',
  'music': 'Music',
  'productivity': 'Productivity',
  'cloud': 'Storage',
  'fitness': 'Fitness',
  'news': 'News & Magazines',
  'gaming': 'Entertainment',
  'other': 'Other',
  'entertainment': 'Entertainment',
  'ai': 'AI & Tools',
}

const categories = [
  { id: 'streaming', label: 'Streaming', icon: '🎬' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'productivity', label: 'Productivity', icon: '💼' },
  { id: 'cloud', label: 'Cloud & Storage', icon: '☁️' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'news', label: 'News & Media', icon: '📰' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'other', label: 'Other', icon: '📦' },
]

const billingCycles: { id: BillingCycle; label: string }[] = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]

export function AddSubscriptionSheet({ open, onClose }: AddSubscriptionSheetProps) {
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [searchQuery, setSearchQuery] = useState('')
  const { popularServices, isLoading } = usePopularServices()
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [customName, setCustomName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SubscriptionCategory>('Entertainment')
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [nextBilling, setNextBilling] = useState('')
  
  const addSubscription = useStore((state) => state.addSubscription)
  const addToast = useStore((state) => state.addToast)
  const notificationSettings = useStore((state) => state.notificationSettings)
  
  // Use user's preferred currency from settings, fallback to INR
  const defaultCurrency = notificationSettings?.currencyCode || 'INR'
  
  const filteredServices = popularServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleSelectService = (service: any) => {
    setSelectedService(service)
    const mappedCategory = categoryMap[service.category.toLowerCase()] || 'Other'
    setSelectedCategory(mappedCategory as SubscriptionCategory)
    setAmount('')
    setCurrency(defaultCurrency)
    setStep('details')
  }
  
  const handleCreateCustom = () => {
    setSelectedService(null)
    setCurrency(defaultCurrency)
    setStep('details')
  }
  
  const handleSave = () => {
    if (!amount || !nextBilling) {
      addToast({
        type: 'error',
        title: 'Missing information',
        message: 'Please fill in amount and renewal date'
      })
      return
    }

    const subscription = addSubscription({
      name: selectedService?.name || customName || 'New Subscription',
      category: selectedCategory,
      amount: parseFloat(amount),
      currency: currency,
      billingCycle: selectedCycle,
      status: 'active',
      renewalDate: nextBilling,
      color: selectedService?.color,
      logo: selectedService?.logo,
    })

    addToast({
      type: 'success',
      title: 'Subscription added',
      message: `${selectedService?.name || customName} has been added to your subscriptions`
    })

    onClose()
    // Reset state
    setStep('select')
    setSearchQuery('')
    setSelectedService(null)
    setCustomName('')
    setSelectedCategory('Entertainment')
    setSelectedCycle('monthly')
    setAmount('')
    setCurrency(defaultCurrency)
    setNextBilling('')
  }
  
  const handleClose = () => {
    onClose()
    // Reset state after animation
    setTimeout(() => {
      setStep('select')
      setSearchQuery('')
      setSelectedService(null)
      setCustomName('')
    }, 300)
  }
  
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-card"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
            
            {/* Header */}
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
                  {step === 'select' ? 'Add Subscription' : 'Subscription Details'}
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
                    {/* Search */}
                    <div className="relative mb-6">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search services..."
                        className="pl-12 h-12 bg-secondary border-0 rounded-xl text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    
                    {/* Popular Services */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Popular Services
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {filteredServices.slice(0, 8).map((service) => (
                          <motion.button
                            key={service.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectService(service)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                          >
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                            style={{ backgroundColor: service.color + '20', color: service.color }}
                          >
                            {service.logo}
                          </div>
                            <span className="text-xs text-foreground text-center truncate w-full">
                              {service.name}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Categories */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Browse by Category
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => (
                          <motion.button
                            key={category.id}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <span className="text-2xl">{category.icon}</span>
                            <span className="text-foreground font-medium">{category.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Entry */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateCustom}
                      className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-gold/30 text-gold hover:bg-gold/5 transition-colors"
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
                    {/* Service Preview */}
                    {selectedService && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                          style={{ backgroundColor: selectedService.color + '20', color: selectedService.color }}
                        >
                          {selectedService.logo}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{selectedService.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{selectedService.category}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Custom Name Input (only for custom) */}
                    {!selectedService && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Service Name
                        </label>
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder="e.g., My Subscription"
                          className="h-12 bg-secondary border-0 rounded-xl text-foreground"
                        />
                      </div>
                    )}
                    
                    {/* Amount and Currency */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Amount & Currency
                      </label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="pl-12 h-12 bg-secondary border-0 rounded-xl text-foreground text-lg font-semibold"
                          />
                        </div>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="h-12 px-3 bg-secondary border-0 rounded-xl text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
                        >
                          {currencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Selected: {currencies.find(c => c.code === currency)?.name}
                      </p>
                    </div>
                    
                    {/* Billing Cycle */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Billing Cycle
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {billingCycles.map((cycle) => (
                          <button
                            key={cycle.id}
                            onClick={() => setSelectedCycle(cycle.id)}
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
                    </div>
                    
                    {/* Next Billing Date */}
                    <DatePickerField
                      label="Next Billing Date"
                      value={nextBilling}
                      onChange={setNextBilling}
                      locale={notificationSettings?.language === 'es' ? 'es-ES' : notificationSettings?.language === 'fr' ? 'fr-FR' : 'en-IN'}
                      placeholder="Select renewal date"
                    />
                    
                    {/* Category (only for custom) */}
                    {!selectedService && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Category
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {categories.slice(0, 4).map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={cn(
                                "py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1",
                                selectedCategory === cat.id
                                  ? "bg-gold text-obsidian"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span>{cat.icon}</span>
                              <span className="text-xs">{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Optional Features */}
                    <div className="flex flex-wrap gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Bell className="w-4 h-4" />
                        <span className="text-sm">Set Reminder</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Link2 className="w-4 h-4" />
                        <span className="text-sm">Add Link</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Tag className="w-4 h-4" />
                        <span className="text-sm">Add Tags</span>
                      </button>
                    </div>
                    
                    {/* Save Button */}
                    <Button
                      onClick={handleSave}
                      className="w-full h-14 rounded-xl bg-gold hover:bg-gold/90 text-obsidian font-semibold text-lg"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Save Subscription
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
