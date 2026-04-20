'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  FileText,
  ChevronRight,
  RefreshCw,
  Info,
  DollarSign,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import {
  mockNotificationLabEvents,
  notificationTemplates,
} from '@/lib/smart-capture/mock-data'
import type { NotificationLabEvent } from '@/lib/smart-capture/types'

// Fast transition
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] }

// Status badge component
function StatusBadge({ status }: { status: NotificationLabEvent['status'] }) {
  const config = {
    queued: { label: 'Queued', icon: Clock, bg: 'bg-muted', text: 'text-muted-foreground' },
    processing: { label: 'Processing', icon: Loader2, bg: 'bg-blue-500/15', text: 'text-blue-400', spin: true },
    candidate_created: { label: 'Candidate Created', icon: CheckCircle2, bg: 'bg-emerald/15', text: 'text-emerald' },
    failed: { label: 'Failed', icon: AlertCircle, bg: 'bg-crimson/15', text: 'text-crimson' },
  }
  const { label, icon: Icon, bg, text, spin } = config[status] as typeof config.queued & { spin?: boolean }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', bg, text)}>
      <Icon className={cn('w-3.5 h-3.5', spin && 'animate-spin')} />
      {label}
    </span>
  )
}

// Template card component
interface TemplateCardProps {
  template: typeof notificationTemplates[0]
  onUse: () => void
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onUse}
      className="w-full p-4 rounded-xl bg-card border border-border hover:border-gold/30 transition-all text-left group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground mb-1">{template.name}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{template.body}</p>
          {template.amount && (
            <p className="text-xs text-gold mt-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {template.currency === 'INR' ? 'Rs' : '$'} {template.amount}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0" />
      </div>
    </motion.button>
  )
}

// Event row component
function EventRow({ event }: { event: NotificationLabEvent }) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-purple-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-foreground truncate">{event.appName}</p>
          <span className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{event.title}</p>
      </div>

      <StatusBadge status={event.status} />
    </motion.div>
  )
}

// Main Notification Lab Screen
export function NotificationLabScreen() {
  const [formData, setFormData] = useState({
    appName: '',
    title: '',
    body: '',
    amount: '',
    currency: 'INR',
    merchant: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recentEvents, setRecentEvents] = useState<NotificationLabEvent[]>(mockNotificationLabEvents)

  // Handle template use
  const handleUseTemplate = (template: typeof notificationTemplates[0]) => {
    setFormData({
      appName: template.appName,
      title: template.title,
      body: template.body,
      amount: template.amount?.toString() || '',
      currency: template.currency || 'INR',
      merchant: '',
    })
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.appName || !formData.title || !formData.body) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newEvent: NotificationLabEvent = {
      id: `lab_${Date.now()}`,
      userId: 'user_1',
      appName: formData.appName,
      title: formData.title,
      body: formData.body,
      timestamp: new Date(),
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      currency: formData.currency,
      merchant: formData.merchant || undefined,
      status: 'processing',
      createdAt: new Date(),
    }

    setRecentEvents((prev) => [newEvent, ...prev])

    // Simulate processing completion
    setTimeout(() => {
      setRecentEvents((prev) =>
        prev.map((e) =>
          e.id === newEvent.id ? { ...e, status: 'candidate_created' as const } : e
        )
      )
    }, 2000)

    // Reset form
    setFormData({
      appName: '',
      title: '',
      body: '',
      amount: '',
      currency: 'INR',
      merchant: '',
    })
    setIsSubmitting(false)
  }

  return (
    <PageTransition>
      <Header title="Notification Lab" />

      <div className="px-4 lg:px-6 pb-8 space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
        >
          <h1 className="text-2xl font-semibold text-foreground">Notification Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Test subscription detection with simulated notifications
          </p>
        </motion.div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.05 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Testing Environment</p>
            <p className="text-sm text-muted-foreground mt-1">
              This is a simulation lab for testing notification parsing. Submit mock notification payloads to see how our AI detects subscription information. Events are processed locally and do not affect your real subscriptions.
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left column: Form and templates */}
          <div className="space-y-6">
            {/* Submission form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fastTransition, delay: 0.1 }}
              className="rounded-2xl bg-card border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Submit Test Notification</h2>
                  <p className="text-xs text-muted-foreground">Fill in notification details</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* App name */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">App / Source Name *</label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                    placeholder="e.g. Netflix, PhonePe, Google Play"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Notification Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Payment successful"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Notification Body *</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="e.g. Your Netflix subscription renewed for Rs 649"
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all resize-none"
                  />
                </div>

                {/* Amount and currency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Amount (optional)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="INR">Rs INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                    </select>
                  </div>
                </div>

                {/* Merchant hint */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Merchant Hint (optional)</label>
                  <input
                    type="text"
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    placeholder="e.g. Netflix, Spotify"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.appName || !formData.title || !formData.body}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                    'bg-gold text-obsidian hover:bg-gold/90 shadow-lg',
                    (isSubmitting || !formData.appName || !formData.title || !formData.body) &&
                      'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send to Pipeline
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Sample templates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fastTransition, delay: 0.15 }}
              className="rounded-2xl bg-card border border-border p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald/20 to-emerald/5 border border-emerald/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Sample Templates</h2>
                  <p className="text-xs text-muted-foreground">Click to use as starting point</p>
                </div>
              </div>

              <div className="space-y-2">
                {notificationTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column: Recent events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastTransition, delay: 0.2 }}
            className="rounded-2xl bg-card border border-border p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Recent Events</h2>
                  <p className="text-xs text-muted-foreground">Live processing status</p>
                </div>
              </div>
              <button
                onClick={() => setRecentEvents(mockNotificationLabEvents)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                      <Smartphone className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No events yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submit a test notification to see it here
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
