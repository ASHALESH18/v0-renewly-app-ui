'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Calendar,
  TrendingDown,
  Sparkles,
  ChevronRight,
  Search,
  ArrowUpRight,
  Zap,
  X,
  Users
} from 'lucide-react'
import { Header, SearchOverlay } from '@/components/header'
import { MetricCard } from '@/components/metric-card'
import { SubscriptionCard, SubscriptionCardCompact } from '@/components/subscription-card'
import { FilterChips, SegmentedControl } from '@/components/filter-chips'
import { PageTransition, StaggerList, staggerItem } from '@/components/motion'
import { MotionSection } from '@/components/motion-section'
import { InsightBoard } from '@/components/insights/insight-board'
import { useInsights } from '@/lib/hooks/use-insights'
import useStore from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/lib/types'
import { formatMoney, formatSubscriptionMoney } from '@/lib/preferences-format'
import { calculateMetrics, getUpcomingRenewals, getDaysUntilRenewal } from '@/lib/subscription-math'
import { useExchangeRates } from '@/lib/hooks/use-exchange-rates'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { isDisplayableSubscription } from '@/lib/billing/subscription-display-utils'
import { mapSubscriptionRowToUI } from '@/lib/supabase/mappers'

// Translation helper for dashboard labels
const dashboardLabels: Record<string, Record<string, string>> = {
  en: {
    financialCommandCenter: 'Financial Command Center',
    monthlySpend: 'Monthly Spend',
    annualProjected: 'Annual Projected',
    potentialSavings: 'Potential Savings',
    subscriptionHealthScore: 'Subscription Health Score',
    needsAttention: 'Needs Attention',
    yourSubscriptions: 'Your Subscriptions',
    upcomingRenewals: 'Upcoming Renewals',
    viewReport: 'View Report',
    displayedIn: 'Displayed in',
    noSubscriptionsYet: 'No subscriptions yet',
    noSubscriptionsMatch: 'No subscriptions match your search',
  },
  es: {
    financialCommandCenter: 'Centro de Control Financiero',
    monthlySpend: 'Gasto Mensual',
    annualProjected: 'Proyección Anual',
    potentialSavings: 'Ahorros Potenciales',
    subscriptionHealthScore: 'Puntuación de Salud',
    needsAttention: 'Necesita Atención',
    yourSubscriptions: 'Tus Suscripciones',
    upcomingRenewals: 'Renovaciones Próximas',
    viewReport: 'Ver Reporte',
    displayedIn: 'Mostrado en',
    noSubscriptionsYet: 'Sin suscripciones aún',
    noSubscriptionsMatch: 'Ninguna suscripción coincide',
  },
  fr: {
    financialCommandCenter: 'Centre de Commande Financier',
    monthlySpend: 'Dépenses Mensuelles',
    annualProjected: 'Projection Annuelle',
    potentialSavings: 'Économies Potentielles',
    subscriptionHealthScore: 'Score de Santé',
    needsAttention: 'Nécessite Attention',
    yourSubscriptions: 'Vos Abonnements',
    upcomingRenewals: 'Renouvellements À Venir',
    viewReport: 'Voir le Rapport',
    displayedIn: 'Affiché en',
    noSubscriptionsYet: 'Aucun abonnement pour l\'instant',
    noSubscriptionsMatch: 'Aucun abonnement ne correspond',
  },
  de: {
    financialCommandCenter: 'Finanzkontrollzentrum',
    monthlySpend: 'Monatliche Ausgaben',
    annualProjected: 'Jährliche Projektion',
    potentialSavings: 'Mögliche Ersparnisse',
    subscriptionHealthScore: 'Gesundheitswert',
    needsAttention: 'Erfordert Aufmerksamkeit',
    yourSubscriptions: 'Ihre Abonnements',
    upcomingRenewals: 'Anstehende Verlängerungen',
    viewReport: 'Bericht Anzeigen',
    displayedIn: 'Angezeigt in',
    noSubscriptionsYet: 'Noch keine Abonnements',
    noSubscriptionsMatch: 'Keine Abonnements stimmen überein',
  },
  hi: {
    financialCommandCenter: 'वित्तीय कमांड सेंटर',
    monthlySpend: 'मासिक खर्च',
    annualProjected: 'वार्षिक अनुमान',
    potentialSavings: 'संभावित बचत',
    subscriptionHealthScore: 'स्वास्थ्य स्कोर',
    needsAttention: 'ध्यान देने की जरूरत है',
    yourSubscriptions: 'आपकी सदस्यताएं',
    upcomingRenewals: 'आने वाली नवीनीकरण',
    viewReport: 'रिपोर्ट देखें',
    displayedIn: 'इसमें प्रदर्शित',
    noSubscriptionsYet: 'अभी कोई सदस्यता नहीं',
    noSubscriptionsMatch: 'कोई सदस्यता मेल नहीं खाती',
  },
}

function getDashboardLabel(key: string, language: string): string {
  return dashboardLabels[language]?.[key] || dashboardLabels.en[key] || key
}

const viewSegments = [
  { id: 'cards', label: 'Cards' },
  { id: 'list', label: 'List' },
]

// Helper functions for formatting
function getBillingLabel(cycle: string): string {
  switch (cycle) {
    case 'daily':
      return 'day'
    case 'weekly':
      return 'wk'
    case 'monthly':
      return 'mo'
    case 'quarterly':
      return 'qtr'
    case 'yearly':
      return 'yr'
    default:
      return 'mo'
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

function getRenewalLabel(renewalDate: string | null | undefined): string {
  if (!renewalDate) return 'N/A'
  
  try {
    const daysUntil = getDaysUntilRenewal({ renewalDate } as any)
    if (daysUntil < 0) return `Renews ${formatDate(renewalDate)}`
    if (daysUntil === 0) return 'Due today'
    if (daysUntil === 1) return '1 day left'
    if (daysUntil <= 30) return `${daysUntil} days left`
    return `Renews ${formatDate(renewalDate)}`
  } catch {
    return 'N/A'
  }
}

export function DashboardScreen({
  onSubscriptionSelect,
  onNavigateTab,
  onProfileClick,
  onNotificationClick
}: {
  onSubscriptionSelect?: (subscription: Subscription) => void
  onNavigateTab?: (tab: string) => void
  onProfileClick?: () => void
  onNotificationClick?: () => void
}) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [familyStatus, setFamilyStatus] = useState<any>(null)
  const [dismissedInviteId, setDismissedInviteId] = useState<string | null>(null)
  const renewlyIntelligenceRef = React.useRef<HTMLDivElement | null>(null)
  const setSubscriptions = useStore((state) => state.setSubscriptions)

  // Fetch family status to show pending invite banner
  // F6C.2B: Also trigger Renewly subscription sync before Dashboard loads
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Sync Renewly subscriptions first (ensures Dashboard shows current billing)
        const syncRes = await fetch('/api/sync/renewly-billing', {
          method: 'POST',
          cache: 'no-store',
        })
        
        // F6C.2C: Add debug logging in development
        if (process.env.NODE_ENV !== 'production') {
          if (syncRes.ok) {
            console.log('[v0] F6C.2C DEBUG: Renewly sync completed, now refreshing subscriptions')
          } else {
            console.warn('[v0] F6C.2C DEBUG: Renewly sync returned non-200 status:', syncRes.status)
          }
        }
      } catch (error) {
        console.error('[v0] Error syncing Renewly billing:', error)
        // Continue with dashboard even if sync fails
      }

      // Refresh subscription store from a fresh server read after sync.
      // This prevents the Dashboard card/metrics from rendering stale Redis/Zustand data.
      try {
        const subscriptionsRes = await fetch('/api/subscriptions?fresh=1', {
          cache: 'no-store',
        })

        if (subscriptionsRes.ok) {
          const subscriptionsPayload = await subscriptionsRes.json()
          const freshSubscriptions = Array.isArray(subscriptionsPayload?.subscriptions)
            ? subscriptionsPayload.subscriptions.map(mapSubscriptionRowToUI)
            : []
          setSubscriptions(freshSubscriptions)
        }
      } catch (error) {
        console.error('[v0] Error refreshing subscriptions after Renewly sync:', error)
      }

      // Then fetch family status
      try {
        const res = await fetch('/api/family/status', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setFamilyStatus(data)
          
          // Initialize dismissed state from sessionStorage
          if (data.pendingInvite?.id) {
            const dismissed = sessionStorage.getItem(`renewly:pending-invite-dismissed:${data.pendingInvite.id}`)
            if (dismissed) {
              setDismissedInviteId(data.pendingInvite.id)
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching family status:', error)
      }
    }

    initializeDashboard()
  }, [setSubscriptions])

  const rawSubscriptions = useStore((state) => state.subscriptions)
  const subscriptions = useMemo(
    () => rawSubscriptions.filter(isDisplayableSubscription),
    [rawSubscriptions]
  )
  const notificationSettings = useStore((state) => state.notificationSettings)
  const preferredLanguage = notificationSettings.language || 'en'
  const preferredCurrency = notificationSettings.currencyCode || 'INR'
  const { rates } = useExchangeRates()
  const { insights } = useInsights({ maxInsights: 3 })

  const metrics = useMemo(() => {
    const m = calculateMetrics(subscriptions, preferredCurrency, rates)

    // F6C.2C: Add debug logging in development
    if (process.env.NODE_ENV !== 'production' && subscriptions.length > 0) {
      const renewlyFamily = subscriptions.find(s => s.name === 'Renewly Family' && s.isSystemManaged)
      console.log('[v0] F6C.2C DEBUG: Dashboard metrics', {
        totalSubscriptions: subscriptions.length,
        renewlyFamilyFound: !!renewlyFamily,
        renewlyFamilyAmount: renewlyFamily?.amount,
        totalMonthlySpend: m.totalMonthlySpend,
        totalYearlySpend: m.totalYearlySpend,
      })
    }

    return {
      totalMonthly: m.totalMonthlySpend,
      totalYearly: m.totalYearlySpend,
      activeSubscriptions: m.activeCount,
      savingsPotential: m.savingsPotential,
      leakScore: m.leakScore,
    }
  }, [subscriptions, preferredCurrency, rates])

  const upcoming = useMemo(() => {
    return getUpcomingRenewals(subscriptions, 30)
  }, [subscriptions])

  const categories = [...new Set(subscriptions.map((s) => s.category || 'Other'))]
  const filterChips = [
    { id: 'all', label: 'All', count: subscriptions.length },
    { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
    ...categories.map(cat => ({
      id: cat,
      label: cat,
      count: subscriptions.filter(s => s.category === cat).length
    }))
  ]

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'upcoming') {
      const days = getDaysUntilRenewal(sub)
      return days <= 30 && days > 0
    }
    return sub.category === selectedFilter
  })

  const displayedSubscriptions = filteredSubscriptions.filter((sub) => {
    const name = String(sub.name || '').toLowerCase()
    const category = String(sub.category || 'Other').toLowerCase()
    const query = searchQuery.toLowerCase()

    return name.includes(query) || category.includes(query)
  })

  // Search results for the overlay - search globally across all subscriptions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    
    // Filter and categorize matches
    const startsWith: typeof searchResults = []
    const includes: typeof searchResults = []
    const categoryMatches: typeof searchResults = []

    subscriptions.forEach((sub) => {
      const name = String(sub.name || '').toLowerCase()
      const category = String(sub.category || 'Other').toLowerCase()
      const description = String(sub.description || '').toLowerCase()

      // Determine match type
      if (name.startsWith(query)) {
        startsWith.push(sub)
      } else if (name.includes(query) || description.includes(query)) {
        includes.push(sub)
      } else if (category.includes(query)) {
        categoryMatches.push(sub)
      }
    })

    // Combine results: startsWith first, then includes, then category matches
    const allMatches = [...startsWith, ...includes, ...categoryMatches]

    return allMatches.map((sub) => ({
      id: sub.id,
      title: sub.name || 'Unknown',
      subtitle: sub.category || 'Other',
      meta: `${formatSubscriptionMoney(sub, preferredCurrency, preferredLanguage, rates)}/${getBillingLabel(sub.billingCycle || 'monthly')} · ${getRenewalLabel(sub.renewalDate)}`,
    }))
  }, [searchQuery, subscriptions, preferredCurrency, preferredLanguage, rates])

  return (
    <PageTransition className="min-h-screen bg-transparent">
      <Header
        showProfile
        onSearchClick={() => setShowSearch(true)}
      />

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        results={searchResults}
        emptyMessage="No subscriptions match your search"
      />

      {/* Pending Family Invite Banner */}
      <AnimatePresence mode="wait">
        {familyStatus?.pendingInvite && dismissedInviteId !== familyStatus.pendingInvite.id && (
          <motion.div
            key="family-invite-banner"
            initial={{ opacity: 0, y: -16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -16, height: 0 }}
            className="px-4 lg:px-6"
          >
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-4 flex items-center gap-4 shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900 dark:text-blue-100">You&apos;ve been invited to Renewly Family</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">Accept your invite to join a Family plan and unlock shared Renewly access.</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onNavigateTab?.('family')}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Review Invite
                </button>
                <button
                  onClick={() => {
                    setDismissedInviteId(familyStatus.pendingInvite.id)
                    sessionStorage.setItem(`renewly:pending-invite-dismissed:${familyStatus.pendingInvite.id}`, 'true')
                  }}
                  className="rounded-lg p-1.5 hover:bg-blue-600/20 transition-colors cursor-pointer"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 lg:px-6 space-y-6 pb-8">
        <div className="rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,254,250,0.75),rgba(248,244,236,0.60))] dark:bg-[linear-gradient(180deg,rgba(17,20,24,0.80),rgba(8,9,12,0.75))]" />

            <div
              className="absolute -top-16 right-4 w-48 h-48 rounded-full blur-[80px]"
              style={{ background: 'radial-gradient(circle, rgba(176, 132, 64, 0.06) 0%, transparent 70%)' }}
            />

            <div
              className="absolute -bottom-12 left-4 w-40 h-40 rounded-full blur-[90px]"
              style={{ background: 'radial-gradient(circle, rgba(61, 107, 88, 0.05) 0%, transparent 70%)' }}
            />

            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold/12 to-transparent" />
          </div>

          <div className="relative glass-premium border border-gold/8 p-6 md:p-8 shadow-md">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/6 border border-gold/15 backdrop-blur-sm">
                <div className="relative w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-gold" />
                </div>
                <span className="text-[10px] font-semibold text-gold tracking-wider uppercase">
                  {getDashboardLabel('financialCommandCenter', preferredLanguage)}
                </span>
              </div>
              
              {/* Currency clarity chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/40 border border-border/50 backdrop-blur-sm">
                <span className="text-[10px] font-medium text-muted-foreground tracking-wider">
                  {getDashboardLabel('displayedIn', preferredLanguage)} {preferredCurrency}
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-card/50 backdrop-blur-xl border border-gold/12 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(176, 132, 64, 0.05) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">{getDashboardLabel('monthlySpend', preferredLanguage)}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-semibold text-gold tracking-tight">
                      {formatMoney(metrics.totalMonthly, preferredCurrency, preferredLanguage)}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/8 border border-emerald/15 text-emerald text-xs">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span className="font-medium">12% vs last month</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-card/50 backdrop-blur-xl border border-border/50 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(168, 174, 184, 0.03) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">{getDashboardLabel('annualProjected', preferredLanguage)}</p>
                  <p className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                    {formatMoney(metrics.totalYearly, preferredCurrency, preferredLanguage)}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">Based on current spend</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.55 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="relative p-5 rounded-xl bg-gradient-to-br from-emerald/6 to-emerald/2 backdrop-blur-xl border border-emerald/15 group"
              >
                <motion.div
                  className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: 'radial-gradient(circle at center, rgba(61, 107, 88, 0.06) 0%, transparent 70%)' }}
                />
                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">{getDashboardLabel('potentialSavings', preferredLanguage)}</p>
                  <p className="text-2xl md:text-3xl font-semibold text-emerald tracking-tight">
                    {formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)}
                    <span className="text-sm text-muted-foreground ml-1">/mo</span>
                  </p>
                  <p className="mt-3 text-xs text-emerald font-medium">Review unused subscriptions</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-between pt-6 border-t border-glass-border"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-gold/10 blur-md opacity-70" />
                  <svg className="relative w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(199,163,106,0.1)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="url(#healthGradient)"
                      strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                      animate={{
                        strokeDashoffset: 2 * Math.PI * 28 * (1 - metrics.leakScore / 100)
                      }}
                      transition={{ delay: 0.8, duration: 2, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C7A36A" />
                        <stop offset="100%" stopColor="#2E5E52" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-foreground">
                    {metrics.leakScore}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{getDashboardLabel('subscriptionHealthScore', preferredLanguage)}</p>
                  <p className="text-base font-semibold text-foreground">
                    {metrics.leakScore > 70
                      ? getDashboardLabel('needsAttention', preferredLanguage)
                      : metrics.leakScore > 40
                        ? 'Some Optimization Possible'
                        : 'Well Optimized'}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => onNavigateTab?.('leak-report')}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                aria-label="View subscription leak report"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold text-sm font-medium border border-gold/20 hover:bg-gold/15 transition-colors cursor-pointer"
              >
                {getDashboardLabel('viewReport', preferredLanguage)}
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* F7.2D-R: Scheduled extra-seat cancellation banner (owner) */}
        {familyStatus?.isFamilyOwner && familyStatus?.billingMetadata?.hasScheduledExtraSeatCancellation && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Extra-seat cancellation scheduled
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Current cycle: ₹{familyStatus.billingMetadata.currentMonthlyTotal}/month · Next cycle: ₹{familyStatus.billingMetadata.nextCycleMonthlyTotal}/month
                {familyStatus.billingMetadata.scheduledCancelDate
                  ? ` · Takes effect ${new Date(familyStatus.billingMetadata.scheduledCancelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab?.('family')}
              className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg bg-amber-600/20 text-amber-800 dark:text-amber-200 px-3 py-1.5 text-xs font-medium hover:bg-amber-600/30 transition-colors cursor-pointer whitespace-nowrap"
            >
              Manage seats
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* F7.2D-R: Scheduled extra-seat cancellation banner (member) */}
        {!familyStatus?.isFamilyOwner && familyStatus?.scheduledExtraSeatCancellation && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Family access ending soon
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Active until {new Date(familyStatus.scheduledExtraSeatCancellation.activeUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.
              {' '}{familyStatus.scheduledExtraSeatCancellation.message}
            </p>
          </div>
        )}

        <StaggerList className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Monthly Recurring"
            value={formatMoney(metrics.totalMonthly, preferredCurrency, preferredLanguage)}
            change={-12}
            changeLabel="vs last month"
            icon={CreditCard}
            iconColor="#C7A36A"
            index={0}
          />
          <MetricCard
            title="Yearly Projected"
            value={formatMoney(metrics.totalYearly, preferredCurrency, preferredLanguage)}
            icon={Calendar}
            iconColor="#2E5E52"
            index={1}
          />
          <MetricCard
            title="Active Subscriptions"
            value={metrics.activeSubscriptions}
            suffix=" services"
            icon={Sparkles}
            iconColor="#BCC2CC"
            index={2}
          />
          <MetricCard
            title="Possible Savings"
            value={formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)}
            suffix="/mo"
            icon={TrendingDown}
            iconColor="#2E5E52"
            index={3}
            variant="emerald"
          />
          {familyStatus?.membership?.role === 'member' && (
            <MetricCard
              title="Renewly Family"
              value="Member"
              suffix="Included"
              icon={Users}
              iconColor="#8B5CF6"
              index={4}
              variant="violet"
            />
          )}
        </StaggerList>

        <MotionSection>
          <motion.button
            onClick={() => {
              renewlyIntelligenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                renewlyIntelligenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            whileHover={{ y: -2, boxShadow: '0 20px 40px -12px rgba(199, 163, 106, 0.15)' }}
            className="relative rounded-2xl overflow-hidden group w-full text-left border-0 bg-transparent cursor-pointer"
            type="button"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-card to-emerald/5 dark:from-gold/10 dark:via-graphite dark:to-emerald/5" />

            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.8 }}
            />

            <div className="relative border border-gold/15 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/20">
                    <Zap className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">AI Insight</p>
                      <span className="px-2 py-0.5 rounded-full bg-gold/10 text-gold text-[10px] font-medium uppercase tracking-wider">New</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      {metrics.leakScore > 0
                        ? `You could save ${formatMoney(metrics.savingsPotential, preferredCurrency, preferredLanguage)} monthly by reviewing unused subscriptions.`
                        : 'All your subscriptions are being actively used. Great job!'}
                    </p>
                  </div>
                </div>
                <motion.div
                  className="p-2 rounded-lg bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
          </motion.button>
        </MotionSection>

        {/* Renewly Intelligence Board - moved above Your Subscriptions */}
        {insights.length > 0 && (
          <motion.div
            ref={renewlyIntelligenceRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pt-4"
          >
            <InsightBoard 
              insights={insights} 
              title="Renewly Intelligence"
              maxInsights={3}
            />
          </motion.div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {getDashboardLabel('yourSubscriptions', preferredLanguage)}
            </h2>
            <SegmentedControl
              segments={viewSegments}
              selectedSegment={viewMode}
              onSegmentSelect={setViewMode}
            />
          </div>

          <FilterChips
            chips={filterChips}
            selectedChip={selectedFilter}
            onChipSelect={setSelectedFilter}
          />
        </div>

        <motion.div layout className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {displayedSubscriptions.map((subscription, index) => (
              <motion.div
                key={subscription.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="will-change-transform"
              >
                {viewMode === 'cards' ? (
                  <SubscriptionCard
                    subscription={subscription}
                    index={index}
                    onClick={() => onSubscriptionSelect?.(subscription)}
                    onEdit={() => onSubscriptionSelect?.(subscription)}
                  />
                ) : (
                  <SubscriptionCardCompact
                    subscription={subscription}
                    onClick={() => onSubscriptionSelect?.(subscription)}
                    onEdit={() => onSubscriptionSelect?.(subscription)}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {displayedSubscriptions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {subscriptions.length === 0 ? getDashboardLabel('noSubscriptionsYet', preferredLanguage) : getDashboardLabel('noSubscriptionsMatch', preferredLanguage)}
            </p>
          </motion.div>
        )}

        {upcoming.length > 0 && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {getDashboardLabel('upcomingRenewals', preferredLanguage)}
              </h2>
              <button 
                onClick={() => onNavigateTab?.('calendar')}
                className="text-sm text-gold font-medium cursor-pointer hover:text-gold/80 transition-colors"
              >
                View all
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {upcoming.slice(0, 5).map((sub, index) => (
                <UpcomingCard
                  key={sub.id || `${sub.name}-${sub.renewalDate}-${index}`}
                  subscription={sub}
                  index={index}
                  preferredCurrency={preferredCurrency}
                  preferredLanguage={preferredLanguage}
                  rates={rates}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

interface UpcomingCardProps {
  subscription: Subscription
  index: number
  preferredCurrency: string
  preferredLanguage: string
  rates: import('@/lib/currency').ExchangeRates
}

function UpcomingCard({
  subscription,
  index,
  preferredCurrency,
  preferredLanguage,
  rates,
}: UpcomingCardProps) {
  const daysUntil = subscription.renewalDate
    ? getDaysUntilRenewal(subscription)
    : 999
  const isUrgent = daysUntil <= 3

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'rounded-2xl border p-4 transition-all',
        isUrgent
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-border bg-card'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <SubscriptionIcon
            name={subscription.name}
            fallbackColor={subscription.color}
            size="md"
          />

          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{subscription.name}</p>
            <p className="text-sm text-muted-foreground">
              {daysUntil === 0 ? 'Due today' : `${daysUntil} days left`}
            </p>
          </div>
        </div>

        <span className="font-semibold text-foreground whitespace-nowrap">
          {formatSubscriptionMoney(subscription, preferredCurrency, preferredLanguage, rates)}
        </span>
      </div>
    </motion.div>
  )
}
