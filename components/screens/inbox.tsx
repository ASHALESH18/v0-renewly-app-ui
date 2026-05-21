'use client'

import { useMemo, useState, useCallback, type ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSWR, { mutate } from 'swr'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Inbox,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  XCircle,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'
import { SubscriptionIcon } from '@/lib/brand-icons'
import useStore from '@/lib/store'
import { useExchangeRates } from '@/lib/hooks/use-exchange-rates'
import { formatMoneyFromCurrency } from '@/lib/preferences-format'
import type {
  CandidateStatus,
  CaptureSource,
  ConfidenceLevel,
  CandidateTag,
  SubscriptionCandidate,
  DetectedBillingCycle,
} from '@/lib/smart-capture/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const fastTransition = { duration: 0.22, ease: [0.32, 0.72, 0, 1] }

type SmartInboxAction = 'confirm' | 'ignore' | 'already_tracked' | 'save_for_later' | 'retry'

interface Candidate {
  id: string
  provider_name: string
  plan_name?: string | null
  amount?: number | null
  currency?: string | null
  billing_cycle?: DetectedBillingCycle | string | null
  confidence_score?: number | null
  confidence_level?: ConfidenceLevel | null
  status: CandidateStatus | string
  source?: CaptureSource | null
  tags?: CandidateTag[] | null
  evidence_snippet?: string | null
  evidence_details?: any[] | null
  is_trial?: boolean | null
  possible_duplicate_id?: string | null
  possible_duplicate_name?: string | null
  created_at: string
  detected_at?: string | null
  reviewed_at?: string | null
}

interface CandidatesResponse {
  candidates: Candidate[]
  total: number
}

interface CountsResponse {
  counts: {
    new: number
    review_needed: number
    added?: number
    confirmed?: number
    ignored: number
    error: number
    total: number
  }
}

const statusTabs: Array<{ id: CandidateStatus | 'all'; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'review_needed', label: 'Review', icon: Eye },
  { id: 'added', label: 'Added', icon: CheckCircle2 },
  { id: 'ignored', label: 'Ignored', icon: XCircle },
  { id: 'error', label: 'Errors', icon: AlertCircle },
]

const sourceOptions: Array<{ id: CaptureSource | 'all'; label: string; icon?: ComponentType<{ className?: string }> }> = [
  { id: 'all', label: 'All Sources' },
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'outlook', label: 'Outlook', icon: Mail },
  { id: 'notification_lab', label: 'Notification Lab', icon: Smartphone },
  { id: 'manual', label: 'Manual', icon: Edit3 },
]

function normalizeCandidate(candidate: Candidate): SubscriptionCandidate {
  const confidenceScore = Number(candidate.confidence_score ?? 0)
  const confidenceLevel: ConfidenceLevel =
    candidate.confidence_level || (confidenceScore >= 70 ? 'high' : confidenceScore >= 40 ? 'medium' : 'low')

  return {
    id: candidate.id,
    userId: '',
    source: (candidate.source || 'manual') as CaptureSource,
    sourceEventId: undefined,
    ingestionEventId: '',
    providerName: candidate.provider_name,
    providerLogo: undefined,
    planName: candidate.plan_name || undefined,
    amount: candidate.amount ?? undefined,
    currency: candidate.currency || 'INR',
    billingCycle: (candidate.billing_cycle || 'unknown') as DetectedBillingCycle,
    confidenceScore,
    confidenceLevel,
    status: (candidate.status || 'new') as CandidateStatus,
    evidenceSnippet: candidate.evidence_snippet || undefined,
    evidenceDetails: Array.isArray(candidate.evidence_details) ? candidate.evidence_details : undefined,
    tags: candidate.tags || [],
    possibleDuplicateId: candidate.possible_duplicate_id || undefined,
    possibleDuplicateName: candidate.possible_duplicate_name || undefined,
    detectedAt: new Date(candidate.detected_at || candidate.created_at),
    reviewedAt: candidate.reviewed_at ? new Date(candidate.reviewed_at) : undefined,
    createdAt: new Date(candidate.created_at),
    updatedAt: new Date(candidate.created_at),
  }
}

function ConfidenceBadge({ score }: { score: number }) {
  const level: ConfidenceLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const config = {
    high: 'border-emerald/25 bg-emerald/10 text-emerald',
    medium: 'border-gold/25 bg-gold/10 text-gold',
    low: 'border-crimson/25 bg-crimson/10 text-crimson',
  }[level]

  return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', config)}>{score}% confidence</span>
}

function TagBadge({ tag }: { tag: CandidateTag }) {
  const labels: Record<CandidateTag, string> = {
    trial: 'Trial',
    renewal: 'Renewal',
    cancellation: 'Cancelled',
    price_change: 'Price change',
    duplicate: 'Duplicate',
    first_payment: 'First payment',
  }

  return <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">{labels[tag]}</span>
}

function SourcePill({ source }: { source?: CaptureSource | null }) {
  const Icon = source === 'notification_lab' ? Smartphone : source === 'manual' ? Edit3 : Mail
  const label = source ? source.replace('_', ' ') : 'Unknown source'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{label}</span>
    </span>
  )
}

function formatRelativeTime(dateInput: string) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function EmptyState({ status }: { status: CandidateStatus | 'all' }) {
  const copy: Record<string, { title: string; description: string }> = {
    all: { title: 'No candidates yet', description: 'Connect a source or use Notification Lab. Renewly will never add subscriptions without your review.' },
    new: { title: 'No new signals', description: 'Your newest subscription signals will appear here for quick review.' },
    review_needed: { title: 'Nothing needs review', description: 'Low-confidence or duplicate candidates will collect here.' },
    added: { title: 'No added candidates yet', description: 'Subscriptions you confirm from Smart Inbox will appear here.' },
    ignored: { title: 'No ignored candidates', description: 'Candidates you dismiss will remain here as history.' },
    error: { title: 'No processing errors', description: 'Smart Inbox is currently clean.' },
  }
  const item = copy[status] || copy.all

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
        <Inbox className="h-8 w-8 text-gold" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{item.description}</p>
    </motion.div>
  )
}

function CandidateCard({
  candidate,
  onReview,
  onDecision,
  pendingAction,
}: {
  candidate: Candidate
  onReview: () => void
  onDecision: (candidate: Candidate, action: SmartInboxAction) => void
  pendingAction: { id: string; action: SmartInboxAction } | null
}) {
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const preferredLanguage = notificationSettings.language || 'en'
  const { rates } = useExchangeRates()
  const confidence = Number(candidate.confidence_score ?? 0)
  const isPending = pendingAction?.id === candidate.id
  const isActionable = candidate.status === 'new' || candidate.status === 'review_needed'

  const amountLabel = candidate.amount
    ? formatMoneyFromCurrency(
      candidate.amount,
      candidate.currency || preferredCurrency,
      preferredCurrency,
      preferredLanguage,
      rates
    )
    : 'Amount unknown'

  const cycleLabel = String(candidate.billing_cycle || 'unknown').replace('_', ' ')

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={fastTransition}
      className="group relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025))] p-5 shadow-[0_24px_70px_-52px_rgba(0,0,0,0.9)]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.18),transparent_42%)]" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-[radial-gradient(circle_at_top,rgba(201,164,92,0.22),rgba(255,255,255,0.03))]">
              <SubscriptionIcon name={candidate.provider_name} size={30} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{candidate.provider_name}</h3>
                {candidate.possible_duplicate_id && (
                  <span className="rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300">Possible duplicate</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.plan_name || 'Detected subscription candidate'}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ConfidenceBadge score={confidence} />
                <SourcePill source={candidate.source} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeTime(candidate.created_at)}
                </span>
                {(candidate.tags || []).map((tag) => <TagBadge key={tag} tag={tag} />)}
              </div>
            </div>
          </div>

          {candidate.evidence_snippet && (
            <div className="mt-4 rounded-2xl border border-gold/12 bg-black/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">Evidence</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">“{candidate.evidence_snippet}”</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[260px] lg:items-end">
          <div className="w-full rounded-2xl border border-white/10 bg-black/15 p-4 lg:text-right">
            <p className="text-2xl font-semibold text-foreground">{amountLabel}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">{cycleLabel} billing</p>
          </div>

          {isActionable ? (
            <div className="flex w-full flex-wrap justify-start gap-2 lg:justify-end">
              <button
                type="button"
                onClick={onReview}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold/25 hover:text-gold"
              >
                Review <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDecision(candidate, 'ignore')}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-crimson/25 hover:text-crimson disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && pendingAction?.action === 'ignore' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Ignore
              </button>
              <button
                type="button"
                onClick={() => onDecision(candidate, 'confirm')}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-sm font-semibold text-obsidian transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && pendingAction?.action === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Add
              </button>
            </div>
          ) : (
            <span className={cn(
              'inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold',
              candidate.status === 'added' && 'border-emerald/25 bg-emerald/10 text-emerald',
              candidate.status === 'ignored' && 'border-white/10 bg-white/5 text-muted-foreground',
              candidate.status === 'error' && 'border-crimson/25 bg-crimson/10 text-crimson'
            )}>
              {candidate.status === 'added' ? 'Added to subscriptions' : candidate.status === 'ignored' ? 'Ignored' : 'Needs attention'}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  )
}

export function InboxScreen({ onReviewCandidate }: { onReviewCandidate?: (candidate: SubscriptionCandidate) => void }) {
  const [activeStatus, setActiveStatus] = useState<CandidateStatus | 'all'>('new')
  const [sourceFilter, setSourceFilter] = useState<CaptureSource | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isResyncing, setIsResyncing] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ id: string; action: SmartInboxAction } | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const { data: countsData } = useSWR<CountsResponse>('/api/smart-capture/counts', fetcher, { refreshInterval: 30000 })
  const counts = countsData?.counts || { new: 0, review_needed: 0, added: 0, confirmed: 0, ignored: 0, error: 0, total: 0 }
  const addedCount = counts.added ?? counts.confirmed ?? 0

  const candidatesUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (activeStatus !== 'all') params.set('status', activeStatus)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    params.set('fresh', 'true')
    return `/api/smart-capture/candidates?${params.toString()}`
  }, [activeStatus, sourceFilter])

  const { data: candidatesData, error, isLoading, mutate: mutateCandidates } = useSWR<CandidatesResponse>(
    candidatesUrl,
    fetcher,
    { revalidateOnFocus: false }
  )

  const filteredCandidates = useMemo(() => {
    const candidates = candidatesData?.candidates || []
    if (!searchQuery.trim()) return candidates
    const query = searchQuery.toLowerCase()
    return candidates.filter((candidate) =>
      candidate.provider_name.toLowerCase().includes(query) ||
      candidate.plan_name?.toLowerCase().includes(query) ||
      candidate.evidence_snippet?.toLowerCase().includes(query)
    )
  }, [candidatesData?.candidates, searchQuery])

  const refreshInbox = useCallback(async () => {
    await Promise.all([
      mutateCandidates(),
      mutate('/api/smart-capture/counts'),
      mutate((key) => typeof key === 'string' && key.startsWith('/api/smart-capture/candidates')),
    ])
  }, [mutateCandidates])

  const handleResync = useCallback(async () => {
    setIsResyncing(true)
    setNotice(null)
    try {
      await refreshInbox()
      setNotice({ tone: 'success', message: 'Smart Inbox refreshed.' })
    } catch {
      setNotice({ tone: 'error', message: 'Could not refresh Smart Inbox.' })
    } finally {
      setIsResyncing(false)
    }
  }, [refreshInbox])

  const handleDecision = useCallback(async (candidate: Candidate, action: SmartInboxAction, modifications?: Record<string, any>) => {
    setPendingAction({ id: candidate.id, action })
    setNotice(null)
    try {
      const res = await fetch(`/api/smart-capture/candidates/${candidate.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, modifications }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Decision failed')

      await refreshInbox()
      setNotice({
        tone: 'success',
        message: action === 'confirm'
          ? `${candidate.provider_name} was added to your subscriptions.`
          : action === 'ignore'
            ? `${candidate.provider_name} was ignored.`
            : 'Candidate updated.',
      })
    } catch (decisionError) {
      setNotice({ tone: 'error', message: decisionError instanceof Error ? decisionError.message : 'Decision failed.' })
    } finally {
      setPendingAction(null)
    }
  }, [refreshInbox])

  const handleReview = useCallback((candidate: Candidate) => {
    onReviewCandidate?.(normalizeCandidate(candidate))
  }, [onReviewCandidate])

  return (
    <PageTransition>
      <Header title="Smart Inbox" subtitle="Review detected subscriptions before they enter your tracker" />

      <div className="px-4 pb-10 lg:px-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
          className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-5 sm:p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(70,101,160,0.16),transparent_40%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Review-first intelligence
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">A quieter way to catch subscriptions.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Smart Inbox turns receipts, renewal notices, and app signals into candidates. You approve, edit, or ignore each one before Renewly touches your tracker.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm text-foreground/85">
                <ShieldCheck className="h-4 w-4 text-emerald" />
                No automatic subscription creation
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-emerald/20 bg-emerald/10 p-4">
                <p className="text-xs text-muted-foreground">New</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.new}</p>
              </div>
              <div className="rounded-2xl border border-gold/20 bg-gold/10 p-4">
                <p className="text-xs text-muted-foreground">Review</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.review_needed}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <p className="text-xs text-muted-foreground">Added</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{addedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{counts.total}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm',
              notice.tone === 'success' ? 'border-emerald/25 bg-emerald/10 text-emerald' : 'border-crimson/25 bg-crimson/10 text-crimson'
            )}
          >
            {notice.message}
          </motion.div>
        )}

        <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {statusTabs.map((tab) => {
                const count = tab.id === 'added' ? addedCount : counts[tab.id as keyof typeof counts] || 0
                const Icon = tab.icon
                const active = activeStatus === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveStatus(tab.id)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap',
                      active
                        ? 'border-gold/35 bg-gold/15 text-gold'
                        : 'border-white/10 bg-black/10 text-muted-foreground hover:border-gold/25 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {count > 0 && <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px] flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search candidates"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-black/15 pl-10 pr-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold/35"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-white/10">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className={cn(
                  'inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition',
                  showFilters || sourceFilter !== 'all'
                    ? 'border-gold/35 bg-gold/15 text-gold'
                    : 'border-white/10 bg-black/10 text-muted-foreground hover:border-gold/25 hover:text-foreground'
                )}
              >
                <Filter className="h-4 w-4" />
                Source
              </button>
              <button
                type="button"
                onClick={handleResync}
                disabled={isResyncing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gold/25 bg-gold/10 px-4 text-sm font-semibold text-gold transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', isResyncing && 'animate-spin')} />
                {isResyncing ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  {sourceOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSourceFilter(option.id)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-medium transition',
                          sourceFilter === option.id
                            ? 'border-gold/35 bg-gold/15 text-gold'
                            : 'border-white/10 bg-black/10 text-muted-foreground hover:border-gold/25 hover:text-foreground'
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" />}
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.035] py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-gold" /> Loading candidates...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-crimson/25 bg-crimson/10 p-5 text-sm text-crimson">
              Could not fetch candidates. Please refresh Smart Inbox.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCandidates.length > 0 ? filteredCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  pendingAction={pendingAction}
                  onReview={() => handleReview(candidate)}
                  onDecision={handleDecision}
                />
              )) : <EmptyState status={activeStatus} />}
            </AnimatePresence>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
