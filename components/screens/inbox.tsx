'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Plus,
  X,
  Calendar,
  DollarSign,
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { SegmentedControl } from '@/components/filter-chips'
import { SubscriptionIcon } from '@/lib/brand-icons'
import {
  mockCandidates,
  getMockInboxCounts,
  mockSyncState,
} from '@/lib/smart-capture/mock-data'
import type {
  SubscriptionCandidate,
  CandidateStatus,
  CaptureSource,
  ConfidenceLevel,
  CandidateTag,
} from '@/lib/smart-capture/types'

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
  candidate: SubscriptionCandidate
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
            <SubscriptionIcon name={candidate.providerName} size={28} />
          </div>

          {/* Provider info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {candidate.providerName}
              </h3>
              {candidate.possibleDuplicateId && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  Possible duplicate
                </span>
              )}
            </div>
            {candidate.planName && (
              <p className="text-sm text-muted-foreground truncate">{candidate.planName}</p>
            )}
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-foreground">
              {formatAmount(candidate.amount, candidate.currency)}
            </p>
            <p className="text-xs text-muted-foreground">
              {billingLabels[candidate.billingCycle]}
            </p>
          </div>
        </div>

        {/* Evidence snippet */}
        {candidate.evidenceSnippet && (
          <div className="mb-3 p-2.5 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground line-clamp-2 italic">
              &ldquo;{candidate.evidenceSnippet}&rdquo;
            </p>
          </div>
        )}

        {/* Tags and metadata row */}
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <ConfidenceBadge level={candidate.confidenceLevel} score={candidate.confidenceScore} />
          {candidate.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Source and time */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <SourceIcon source={candidate.source} />
              <span className="capitalize">{candidate.source.replace('_', ' ')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(candidate.detectedAt)}
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
              candidate.status === 'added' && 'bg-emerald/15 text-emerald',
              candidate.status === 'ignored' && 'bg-muted text-muted-foreground',
              candidate.status === 'error' && 'bg-crimson/15 text-crimson',
            )}>
              {candidate.status === 'added' && 'Added'}
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
  onReviewCandidate?: (candidate: SubscriptionCandidate) => void
}

export function InboxScreen({ onReviewCandidate }: InboxScreenProps) {
  const [activeStatus, setActiveStatus] = useState<CandidateStatus | 'all'>('new')
  const [sourceFilter, setSourceFilter] = useState<CaptureSource | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)

  // Get counts
  const counts = useMemo(() => getMockInboxCounts(), [])

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter((c) => {
      // Status filter
      if (activeStatus !== 'all' && c.status !== activeStatus) return false

      // Source filter
      if (sourceFilter !== 'all' && c.source !== sourceFilter) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          c.providerName.toLowerCase().includes(query) ||
          c.planName?.toLowerCase().includes(query) ||
          c.evidenceSnippet?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [activeStatus, sourceFilter, searchQuery])

  // Handlers
  const handleResync = async () => {
    setIsResyncing(true)
    // Simulate resync
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsResyncing(false)
  }

  const handleReview = (candidate: SubscriptionCandidate) => {
    onReviewCandidate?.(candidate)
  }

  const handleAdd = (candidate: SubscriptionCandidate) => {
    // Quick add - in real implementation this would open a sheet
    onReviewCandidate?.(candidate)
  }

  const handleIgnore = (candidate: SubscriptionCandidate) => {
    // In real implementation this would call API
    console.log('Ignoring candidate:', candidate.id)
  }

  // Format sync time
  const lastSyncText = mockSyncState.lastSyncCompleted
    ? formatRelativeTime(mockSyncState.lastSyncCompleted)
    : 'Never'

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
                mockSyncState.isHealthy ? 'bg-emerald' : 'bg-crimson'
              )} />
              <span className="text-xs text-muted-foreground">
                Synced {lastSyncText}
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
        </div>
      </div>
    </PageTransition>
  )
}
