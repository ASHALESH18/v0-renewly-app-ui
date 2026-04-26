'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Mail,
  Smartphone,
  Edit3,
  ChevronDown,
  Bookmark,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubscriptionIcon } from '@/lib/brand-icons'
import type {
  SubscriptionCandidate,
  CandidateEvidence,
  DetectedBillingCycle,
  CaptureSource,
} from '@/lib/smart-capture/types'
import type { SubscriptionCategory, BillingCycle } from '@/lib/types'

// Fast transition
const fastTransition = { duration: 0.25, ease: [0.32, 0.72, 0, 1] }

// Billing cycle options
const billingCycleOptions: { value: BillingCycle | 'unknown'; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

// Category options
const categoryOptions: SubscriptionCategory[] = [
  'Streaming',
  'Music',
  'Productivity',
  'Cloud & Storage',
  'AI & Tools',
  'Fitness',
  'News & Media',
  'Gaming',
  'Utilities',
  'Services',
  'Finance',
  'Shopping',
  'Education',
  'Security',
  'Other',
]

// Currency options
const currencyOptions = [
  { code: 'INR', symbol: 'Rs', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
]

// Evidence item component
function EvidenceItem({ evidence }: { evidence: CandidateEvidence }) {
  const icons = {
    subject: Mail,
    body: FileText,
    sender: Mail,
    amount: DollarSign,
    date: Calendar,
    notification: Smartphone,
  }
  const Icon = icons[evidence.type] || FileText

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{evidence.label}</p>
        <p className="text-sm text-foreground break-words">{evidence.value}</p>
      </div>
      <div className="flex-shrink-0">
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          evidence.confidence >= 90 ? 'bg-emerald/15 text-emerald' :
            evidence.confidence >= 70 ? 'bg-gold/15 text-gold' :
              'bg-crimson/15 text-crimson'
        )}>
          {evidence.confidence}%
        </span>
      </div>
    </div>
  )
}

// Source badge component
function SourceBadge({ source }: { source: CaptureSource }) {
  const config = {
    gmail: { label: 'Gmail', icon: Mail, bg: 'bg-red-500/10', text: 'text-red-400' },
    outlook: { label: 'Outlook', icon: Mail, bg: 'bg-blue-500/10', text: 'text-blue-400' },
    notification_lab: { label: 'Notification Lab', icon: Smartphone, bg: 'bg-purple-500/10', text: 'text-purple-400' },
    manual: { label: 'Manual', icon: Edit3, bg: 'bg-gray-500/10', text: 'text-gray-400' },
  }
  const { label, icon: Icon, bg, text } = config[source]

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium', bg, text)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}

// Modifications type
interface CandidateModifications {
  providerName: string
  planName: string
  amount: string
  currency: string
  billingCycle: BillingCycle
  category: SubscriptionCategory
  paymentMethod: string
  notes: string
}

// Props
interface CandidateReviewSheetProps {
  candidate: SubscriptionCandidate | null
  open: boolean
  onClose: () => void
  onConfirm: (candidate: SubscriptionCandidate, modifications: CandidateModifications) => void
  onIgnore: (candidate: SubscriptionCandidate) => void
  onAlreadyTracked?: (candidate: SubscriptionCandidate) => void
  onSaveForLater?: (candidate: SubscriptionCandidate) => void
}

export function CandidateReviewSheet({
  candidate,
  open,
  onClose,
  onConfirm,
  onIgnore,
  onAlreadyTracked,
  onSaveForLater,
}: CandidateReviewSheetProps) {
  const [portalReady, setPortalReady] = useState(false)
  const [modifications, setModifications] = useState<CandidateModifications>({
    providerName: '',
    planName: '',
    amount: '',
    currency: 'INR',
    billingCycle: 'monthly',
    category: 'Other',
    paymentMethod: '',
    notes: '',
  })

  // Initialize modifications from candidate
  useEffect(() => {
    if (candidate) {
      setModifications({
        providerName: candidate.providerName,
        planName: candidate.planName || '',
        amount: candidate.amount?.toString() || '',
        currency: candidate.currency || 'INR',
        billingCycle: (candidate.billingCycle === 'unknown' ? 'monthly' : candidate.billingCycle) as BillingCycle,
        category: 'Other',
        paymentMethod: '',
        notes: '',
      })
    }
  }, [candidate])

  // Portal setup
  useEffect(() => {
    setPortalReady(true)
  }, [])

  // Handle escape and body scroll
  useEffect(() => {
    if (!open || !portalReady) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose, portalReady])

  if (!portalReady || !candidate) return null

  const handleConfirm = () => {
    onConfirm(candidate, modifications)
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-full flex items-end lg:items-center justify-center p-0 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={fastTransition}
              onClick={(e) => e.stopPropagation()}
              className="w-full lg:max-w-2xl max-h-[95dvh] lg:max-h-[90dvh] overflow-hidden rounded-t-3xl lg:rounded-3xl border border-border bg-card shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
                    <SubscriptionIcon name={candidate.providerName} size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Review Candidate</h2>
                    <p className="text-sm text-muted-foreground">{candidate.providerName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl border border-border bg-muted hover:bg-secondary transition-all flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(95dvh-160px)] lg:max-h-[calc(90dvh-160px)] overscroll-contain">
                <div className="p-4 lg:p-6 space-y-6">
                  {/* Detection summary */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Detection Confidence</p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.confidenceLevel === 'high' ? 'High confidence detection' :
                            candidate.confidenceLevel === 'medium' ? 'Medium confidence - review recommended' :
                              'Low confidence - manual review required'}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      'px-3 py-1.5 rounded-xl text-sm font-semibold',
                      candidate.confidenceLevel === 'high' ? 'bg-emerald/15 text-emerald' :
                        candidate.confidenceLevel === 'medium' ? 'bg-gold/15 text-gold' :
                          'bg-crimson/15 text-crimson'
                    )}>
                      {candidate.confidenceScore}%
                    </div>
                  </div>

                  {/* Duplicate warning */}
                  {candidate.possibleDuplicateId && (
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                      <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Possible Duplicate Detected</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This may be a duplicate of <span className="text-foreground font-medium">{candidate.possibleDuplicateName}</span>.
                          Review carefully before adding.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Source and metadata */}
                  <div className="flex items-center gap-3">
                    <SourceBadge source={candidate.source} />
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Detected {formatDate(candidate.detectedAt)}
                    </span>
                  </div>

                  {/* Trial info */}
                  {candidate.trialInfo && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-foreground">Trial Detected</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {candidate.trialInfo.endDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Trial Ends</p>
                            <p className="text-foreground">{formatDate(candidate.trialInfo.endDate)}</p>
                          </div>
                        )}
                        {candidate.trialInfo.daysRemaining !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Days Remaining</p>
                            <p className="text-foreground">{candidate.trialInfo.daysRemaining} days</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Renewal info */}
                  {candidate.renewalInfo && (
                    <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-emerald" />
                        <span className="text-sm font-medium text-foreground">Renewal Information</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {candidate.renewalInfo.nextRenewalDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Next Renewal</p>
                            <p className="text-foreground">{formatDate(candidate.renewalInfo.nextRenewalDate)}</p>
                          </div>
                        )}
                        {candidate.renewalInfo.lastRenewalDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Last Renewed</p>
                            <p className="text-foreground">{formatDate(candidate.renewalInfo.lastRenewalDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evidence */}
                  {candidate.evidenceDetails && candidate.evidenceDetails.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">Detection Evidence</h3>
                      <div className="space-y-2">
                        {candidate.evidenceDetails.map((evidence, index) => (
                          <EvidenceItem key={index} evidence={evidence} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editable fields */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-medium text-foreground mb-4">Subscription Details</h3>
                    <div className="space-y-4">
                      {/* Provider name */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Provider Name</label>
                        <input
                          type="text"
                          value={modifications.providerName}
                          onChange={(e) => setModifications({ ...modifications, providerName: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                      </div>

                      {/* Plan name */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Plan Name</label>
                        <input
                          type="text"
                          value={modifications.planName}
                          onChange={(e) => setModifications({ ...modifications, planName: e.target.value })}
                          placeholder="e.g. Premium, Basic, Pro"
                          className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                      </div>

                      {/* Amount and currency */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
                          <input
                            type="number"
                            value={modifications.amount}
                            onChange={(e) => setModifications({ ...modifications, amount: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Currency</label>
                          <select
                            value={modifications.currency}
                            onChange={(e) => setModifications({ ...modifications, currency: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                          >
                            {currencyOptions.map((c) => (
                              <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Billing cycle and category */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Billing Cycle</label>
                          <select
                            value={modifications.billingCycle}
                            onChange={(e) => setModifications({ ...modifications, billingCycle: e.target.value as BillingCycle })}
                            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                          >
                            {billingCycleOptions.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                          <select
                            value={modifications.category}
                            onChange={(e) => setModifications({ ...modifications, category: e.target.value as SubscriptionCategory })}
                            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all appearance-none cursor-pointer"
                          >
                            {categoryOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Notes (optional)</label>
                        <textarea
                          value={modifications.notes}
                          onChange={(e) => setModifications({ ...modifications, notes: e.target.value })}
                          placeholder="Add any notes about this subscription..."
                          rows={2}
                          className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="border-t border-border p-4 lg:px-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Secondary actions */}
                  <div className="flex gap-2 sm:flex-1">
                    <button
                      onClick={() => onIgnore(candidate)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                    >
                      <XCircle className="w-4 h-4" />
                      Ignore
                    </button>
                    {onAlreadyTracked && (
                      <button
                        onClick={() => onAlreadyTracked(candidate)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Already Tracked
                      </button>
                    )}
                    {onSaveForLater && (
                      <button
                        onClick={() => onSaveForLater(candidate)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                      >
                        <Bookmark className="w-4 h-4" />
                        Save
                      </button>
                    )}
                  </div>

                  {/* Primary action */}
                  <button
                    onClick={handleConfirm}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gold text-obsidian hover:bg-gold/90 transition-all shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Add
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
