'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR, { mutate } from 'swr'
import {
  Inbox,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Smartphone,
  Edit3,
  ChevronRight,
  Sparkles,
  Eye,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { SubscriptionIcon } from '@/lib/brand-icons'
import type {
  CandidateStatus,
  CaptureSource,
  ConfidenceLevel,
  CandidateTag,
} from '@/lib/smart-capture/types'

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// API response types
interface Candidate {
  id: string
  provider_name: string
  plan_name?: string
  amount?: number
  currency: string
  billing_cycle: string
  confidence_score: number
  status: CandidateStatus
  source?: CaptureSource
  tags: CandidateTag[]
  evidence_snippet?: string
  is_trial?: boolean
  possible_duplicate_id?: string
  created_at: string
}

interface CandidatesResponse {
  candidates: Candidate[]
  total: number
}

interface CountsResponse {
  counts: {
    new: number
    review_needed: number
    confirmed: number
    ignored: number
    error: number
    total: number
  }
}

// Fast transition for responsive feel
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] }

// Tab configuration
const statusTabs = [
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'review_needed', label: 'Review', icon: Eye },
  { id: 'added', label: 'Added', icon: CheckCircle2 },
  { id: 'ignored', label: 'Ignored', icon: XCircle },
  { id: 'error', label: 'Errors', icon: AlertCircle },
]

// Source filter options
const sourceOptions = [
  { id: 'all', label: 'All Sources' },
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'outlook', label: 'Outlook', icon: Mail },
  { id: 'notification_lab', label: 'Notification Lab', icon: Smartphone },
  { id: 'manual', label: 'Manual', icon: Edit3 },
]

// Confidence badge component
function ConfidenceBadge({ level, score }: { level: ConfidenceLevel; score: number }) {
  const config = {
    high: { bg: 'bg-emerald/15', text: 'text-emerald', border: 'border-emerald/30' },
    medium: { bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/30' },
    low: { bg: 'bg-crimson/15', text: 'text-crimson', border: 'border-crimson/30' },
  }[level]

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', config.bg, config.text, config.border)}>
      {score}% confidence
    </span>
  )
}

// Tag badge component
function TagBadge({ tag }: { tag: CandidateTag }) {
  const config: Record<CandidateTag, { label: string; bg: string; text: string }> = {
    trial: { label: 'Trial', bg: 'bg-blue-500/15', text: 'text-blue-400' },
    renewal: { label: 'Renewal', bg: 'bg-emerald/15', text: 'text-emerald' },
    cancellation: { label: 'Cancelled', bg: 'bg-crimson/15', text: 'text-crimson' },
    price_change: { label: 'Price Change', bg: 'bg-gold/15', text: 'text-gold' },
    duplicate: { label: 'Duplicate', bg: 'bg-orange-500/15', text: 'text-orange-400' },
    first_payment: { label: 'First Payment', bg: 'bg-purple-500/15', text: 'text-purple-400' },
  }

  const c = config[tag]
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      {c.label}
    </span>
  )
}

// Source icon component
function SourceIcon({ source }: { source: CaptureSource }) {
  const icons = {
    gmail: <Mail className="w-3.5 h-3.5" />,
    outlook: <Mail className="w-3.5 h-3.5" />,
    notification_lab: <Smartphone className="w-3.5 h-3.5" />,
    manual: <Edit3 className="w-3.5 h-3.5" />,
  }
  return icons[source]
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Candidate card component
interface CandidateCardProps {
  candidate: Candidate
  onReview: () => void
  onAdd: () => void
  onIgnore: () => void
}

function CandidateCard({ candidate, onReview, onAdd, onIgnore }: CandidateCardProps) {
  const formatAmount = (amount?: number, currency?: string) => {
    if (!amount) return 'Amount unknown'
    const symbol = currency === 'INR' ? 'Rs' : currency === 'USD' ? '$' : currency || ''
    return `${symbol} ${amount.toLocaleString()}`
  }

  const billingLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    unknown: 'Unknown cycle',
  }

  // Map confidence score to level
  const confidenceLevel: ConfidenceLevel = 
    candidate.confidence_score >= 70 ? 'high' : 
    candidate.confidence_score >= 40 ? 'medium' : 'low'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={fastTransition}
      className="group relative rounded-2xl bg-card border border-border hover:border-gold/30 transition-all duration-200 overflow-hidden"
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Provider icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <SubscriptionIcon name={candidate.provider_name} size={28} />
          </div>

          {/* Provider info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {candidate.provider_name}
              </h3>
              {candidate.possible_duplicate_id && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Possible duplicate
                </span>
              )}
            </div>
            {candidate.plan_name && (
              <p className="text-sm text-muted-foreground truncate">{candidate.plan_name}</p>
            )}
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-foreground">
              {formatAmount(candidate.amount, candidate.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {billingLabels[candidate.billing_cycle] || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Evidence snippet */}
        {candidate.evidence_snippet && (
          <div className="mb-3 p-2.5 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground line-clamp-2 italic">
              &ldquo;{candidate.evidence_snippet}&rdquo;
            </p>
          </div>
        )}

        {/* Tags and metadata row */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <ConfidenceBadge level={confidenceLevel} score={candidate.confidence_score} />
          {candidate.tags?.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Source and time */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {candidate.source && (
              <span className="flex items-center gap-1.5">
                <SourceIcon source={candidate.source} />
                <span className="capitalize">{candidate.source.replace('_', ' ')}</span>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(new Date(candidate.created_at))}
            </span>
          </div>

          {/* Actions */}
          {candidate.status === 'new' || candidate.status === 'review_needed' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onIgnore}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Ignore
              </button>
              <button
                onClick={onAdd}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20 transition-colors"
              >
                Add
              </button>
              <button
                onClick={onReview}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium',
              candidate.status === 'confirmed' && 'bg-emerald/15 text-emerald',
              candidate.status === 'ignored' && 'bg-muted text-muted-foreground',
              candidate.status === 'error' && 'bg-crimson/15 text-crimson',
            )}>
              {candidate.status === 'confirmed' && 'Added'}
              {candidate.status === 'ignored' && 'Ignored'}
              {candidate.status === 'error' && 'Error'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Empty state component
function EmptyState({ status }: { status: CandidateStatus | 'all' }) {
  const messages: Record<string, { title: string; description: string }> = {
    all: {
      title: 'No candidates yet',
      description: 'Connect your email or use the Notification Lab to detect subscriptions.',
    },
    new: {
      title: 'No new candidates',
      description: 'All detected subscriptions have been reviewed.',
    },
    review_needed: {
      title: 'Nothing to review',
      description: 'All candidates with low confidence have been processed.',
    },
    added: {
      title: 'No added subscriptions',
      description: 'Confirmed candidates will appear here.',
    },
    ignored: {
      title: 'No ignored candidates',
      description: 'Dismissed candidates will appear here.',
    },
    error: {
      title: 'No errors',
      description: 'All candidates processed successfully.',
    },
  }

  const { title, description } = messages[status] || messages.all

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fastTransition}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </motion.div>
  )
}

// Main Inbox Screen
interface InboxScreenProps {
  onReviewCandidate?: (candidate: Candidate) => void
}

export function InboxScreen({ onReviewCandidate }: InboxScreenProps) {
  const [activeStatus, setActiveStatus] = useState<CandidateStatus | 'all'>('new')
  const [sourceFilter, setSourceFilter] = useState<CaptureSource | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)

  // Fetch counts with SWR
  const { data: countsData } = useSWR<CountsResponse>(
    '/api/smart-capture/counts',
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30s
  )
  const counts = countsData?.counts || { new: 0, review_needed: 0, confirmed: 0, ignored: 0, error: 0, total: 0 }

  // Build API URL with filters
  const candidatesUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (activeStatus !== 'all') params.set('status', activeStatus)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    return `/api/smart-capture/candidates?${params.toString()}`
  }, [activeStatus, sourceFilter])

  // Fetch candidates with SWR
  const { data: candidatesData, error, isLoading, mutate: mutateCandidates } = useSWR<CandidatesResponse>(
    candidatesUrl,
    fetcher,
    { revalidateOnFocus: true }
  )

  // Filter by search locally (search is client-side for instant feedback)
  const filteredCandidates = useMemo(() => {
    const candidates = candidatesData?.candidates || []
    if (!searchQuery) return candidates

    const query = searchQuery.toLowerCase()
    return candidates.filter((c) =>
      c.provider_name.toLowerCase().includes(query) ||
      c.plan_name?.toLowerCase().includes(query) ||
      c.evidence_snippet?.toLowerCase().includes(query)
    )
  }, [candidatesData?.candidates, searchQuery])

  // Handlers
  const handleResync = useCallback(async () => {
    setIsResyncing(true)
    try {
      // Trigger fresh fetch by invalidating cache
      await mutateCandidates()
      await mutate('/api/smart-capture/counts')
    } finally {
      setIsResyncing(false)
    }
  }, [mutateCandidates])

  const handleReview = useCallback((candidate: Candidate) => {
    onReviewCandidate?.(candidate)
  }, [onReviewCandidate])

  const handleAdd = useCallback(async (candidate: Candidate) => {
    try {
      const res = await fetch(`/api/smart-capture/candidates/${candidate.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      })
      if (res.ok) {
        // Refresh data
        await mutateCandidates()
        await mutate('/api/smart-capture/counts')
      }
    } catch (err) {
      console.error('Failed to add candidate:', err)
    }
  }, [mutateCandidates])

  const handleIgnore = useCallback(async (candidate: Candidate) => {
    try {
      const res = await fetch(`/api/smart-capture/candidates/${candidate.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ignore' }),
      })
      if (res.ok) {
        // Refresh data
        await mutateCandidates()
        await mutate('/api/smart-capture/counts')
      }
    } catch (err) {
      console.error('Failed to ignore candidate:', err)
    }
  }, [mutateCandidates])

  return (
    <PageTransition>
      <Header title="Smart Capture Inbox" />

      <div className="px-4 lg:px-6 pb-8 space-y-6">
        {/* Page header with sync status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and manage detected subscription candidates
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
              <div className={cn(
                'w-2 h-2 rounded-full',
                error ? 'bg-crimson' : 'bg-emerald'
              )} />
              <span className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : `${counts.total} candidates`}
              </span>
            </div>

            {/* Rescan button */}
            <button
              onClick={handleResync}
              disabled={isResyncing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20',
                isResyncing && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-4 h-4', isResyncing && 'animate-spin')} />
              {isResyncing ? 'Scanning...' : 'Rescan'}
            </button>
          </div>
        </motion.div>

        {/* Status tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.05 }}
          className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0"
        >
          {statusTabs.map((tab) => {
            const count = counts[tab.id as keyof typeof counts] || 0
            const isActive = activeStatus === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id as CandidateStatus)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-gold/15 text-gold border border-gold/30'
                    : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    isActive ? 'bg-gold/30' : 'bg-muted'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </motion.div>

        {/* Search and filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                showFilters || sourceFilter !== 'all'
                  ? 'bg-gold/10 text-gold border-gold/30'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {sourceFilter !== 'all' && (
                <span className="w-2 h-2 rounded-full bg-gold" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={fastTransition}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">Source Filter</h3>
                  {sourceFilter !== 'all' && (
                    <button
                      onClick={() => setSourceFilter('all')}
                      className="text-xs text-gold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setSourceFilter(option.id as CaptureSource | 'all')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                        sourceFilter === option.id
                          ? 'bg-gold/15 text-gold border border-gold/30'
                          : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                      )}
                    >
                      {option.icon && <option.icon className="w-4 h-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidates list */}
        <div className="space-y-3">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Loading candidates...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-crimson/10 border border-crimson/30 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-crimson" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load</h3>
              <p className="text-sm text-muted-foreground mb-4">Could not fetch candidates. Please try again.</p>
              <button
                onClick={() => mutateCandidates()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20"
              >
                Retry
              </button>
            </motion.div>
          ) : (
          <AnimatePresence mode="popLayout">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onReview={() => handleReview(candidate)}
                  onAdd={() => handleAdd(candidate)}
                  onIgnore={() => handleIgnore(candidate)}
                />
              ))
            ) : (
              <EmptyState status={activeStatus} />
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
