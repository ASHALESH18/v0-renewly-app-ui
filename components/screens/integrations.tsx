'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
import {
  Mail,
  Smartphone,
  Cpu,
  FlaskConical,
  AlertTriangle,
  RefreshCw,
  Settings,
  Pause,
  Link2,
  Clock,
  Activity,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'

// SWR fetcher — returns null on any failure so the UI falls back to empty state
// instead of propagating errors that would white-screen the route.
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.log('[v0] integrations fetcher: non-ok response', url, res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.log('[v0] integrations fetcher: threw', url, err)
    return null
  }
}

// Allowed literal values — anything else gets normalized to a safe default.
type HealthValue = 'healthy' | 'degraded' | 'unhealthy'
type WebhookValue = 'active' | 'inactive' | 'error'

const HEALTH_VALUES: readonly HealthValue[] = ['healthy', 'degraded', 'unhealthy']
const WEBHOOK_VALUES: readonly WebhookValue[] = ['active', 'inactive', 'error']

// Integration type from API
interface IntegrationInfo {
  id: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  account?: { email: string } | null
  lastSync?: string | null
  syncHealth?: HealthValue
  webhookStatus?: WebhookValue
  canConnect: boolean
  canReconnect: boolean
  canRescan: boolean
  canPause: boolean
}

// Normalize a raw, possibly-malformed integration record into a safe, fully
// populated IntegrationInfo. Anything missing/invalid collapses to a safe
// default so downstream rendering never crashes.
function normalizeIntegration(raw: unknown, index: number): IntegrationInfo {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const idFromRaw = typeof r.id === 'string' && r.id.length > 0 ? r.id : null
  const id = idFromRaw ?? `integration-${index}`
  const name = typeof r.name === 'string' && r.name.trim().length > 0 ? r.name : 'Unknown integration'
  const description =
    typeof r.description === 'string' && r.description.trim().length > 0
      ? r.description
      : 'No description available'
  const icon = typeof r.icon === 'string' && r.icon.length > 0 ? r.icon : 'mail'
  const isConnected = r.isConnected === true

  // Account is either { email } or null
  let account: { email: string } | null = null
  if (r.account && typeof r.account === 'object') {
    const emailRaw = (r.account as Record<string, unknown>).email
    if (typeof emailRaw === 'string' && emailRaw.length > 0) {
      account = { email: emailRaw }
    }
  }

  const lastSync = typeof r.lastSync === 'string' && r.lastSync.length > 0 ? r.lastSync : null

  const syncHealth =
    typeof r.syncHealth === 'string' && (HEALTH_VALUES as readonly string[]).includes(r.syncHealth)
      ? (r.syncHealth as HealthValue)
      : undefined

  const webhookStatus =
    typeof r.webhookStatus === 'string' && (WEBHOOK_VALUES as readonly string[]).includes(r.webhookStatus)
      ? (r.webhookStatus as WebhookValue)
      : undefined

  return {
    id,
    name,
    description,
    icon,
    isConnected,
    account,
    lastSync,
    syncHealth,
    webhookStatus,
    canConnect: r.canConnect === true,
    canReconnect: r.canReconnect === true,
    canRescan: r.canRescan === true,
    canPause: r.canPause === true,
  }
}

// Safe "time ago" formatter. Never throws, never returns "NaN ago".
// Falls back to "Never" if the date is missing, malformed, or unparseable.
function formatLastSync(date?: string | null): string {
  if (!date || typeof date !== 'string') return 'Never'
  try {
    const parsedMs = new Date(date).getTime()
    if (!Number.isFinite(parsedMs)) return 'Never'

    const diff = Date.now() - parsedMs
    if (!Number.isFinite(diff) || diff < 0) {
      // Future dates or computation errors — fall back to locale date only.
      const locale = new Date(parsedMs).toLocaleDateString()
      return locale || 'Never'
    }

    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(parsedMs).toLocaleDateString()
  } catch {
    return 'Never'
  }
}

// Fast transition
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const }

// Health status component — guards against unknown values.
function HealthStatus({ health }: { health?: HealthValue }) {
  const config: Record<HealthValue, { label: string; color: string; pulse: boolean }> = {
    healthy: { label: 'Healthy', color: 'bg-emerald', pulse: false },
    degraded: { label: 'Degraded', color: 'bg-gold', pulse: true },
    unhealthy: { label: 'Unhealthy', color: 'bg-crimson', pulse: true },
  }
  // Fall back to a safe "Unavailable" tile if health is missing or unknown
  // (prevents destructuring undefined, which was a crash vector).
  const entry = health && config[health] ? config[health] : { label: 'Unavailable', color: 'bg-muted-foreground', pulse: false }
  const { label, color, pulse } = entry

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={cn('w-2 h-2 rounded-full', color)} />
        {pulse && (
          <div className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75', color)} />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// Webhook status component — guards against unknown values.
function WebhookStatus({ status }: { status?: WebhookValue }) {
  const config: Record<WebhookValue, { label: string; icon: typeof Activity; color: string }> = {
    active: { label: 'Webhook Active', icon: Activity, color: 'text-emerald' },
    inactive: { label: 'Webhook Inactive', icon: Pause, color: 'text-muted-foreground' },
    error: { label: 'Webhook Error', icon: AlertTriangle, color: 'text-crimson' },
  }
  // Fall back to an "Unknown" state rather than destructuring undefined.
  const entry = status && config[status]
    ? config[status]
    : { label: 'Webhook Unknown', icon: Activity, color: 'text-muted-foreground' }
  const { label, icon: Icon, color } = entry

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', color)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  )
}

// Integration icon component
function IntegrationIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    mail: Mail,
    cpu: Cpu,
    flask: FlaskConical,
    smartphone: Smartphone,
  }
  const Icon = icons[type as keyof typeof icons] || Mail

  return <Icon className={className} />
}

// Integration card component
interface IntegrationCardProps {
  integration: IntegrationInfo
  onConnect: () => void
  onReconnect: () => void
  onRescan: () => void
  onPause: () => void
  onSettings: () => void
}

function IntegrationCard({
  integration,
  onConnect,
  onReconnect,
  onRescan,
  onPause,
  onSettings,
}: IntegrationCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (action: () => void) => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      action()
    } catch (err) {
      console.log('[v0] integration action failed', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border transition-all overflow-hidden',
        integration.isConnected
          ? 'bg-card border-border hover:border-gold/30'
          : 'bg-muted/30 border-dashed border-border'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              integration.isConnected
                ? 'bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30'
                : 'bg-muted border border-border'
            )}
          >
            <IntegrationIcon
              type={integration.icon}
              className={cn('w-6 h-6', integration.isConnected ? 'text-gold' : 'text-muted-foreground')}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{integration.name}</h3>
              {integration.isConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald/15 text-emerald border border-emerald/30">
                  Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  Not connected
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{integration.description}</p>
          </div>
        </div>

        {/* Status info for connected integrations */}
        {integration.isConnected && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <HealthStatus health={integration.syncHealth} />
                <WebhookStatus status={integration.webhookStatus} />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Last sync: {formatLastSync(integration.lastSync)}
              </div>
            </div>

            {/* Account email if available */}
            {integration.account?.email && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">Connected account</p>
                <p className="text-sm text-foreground">{integration.account.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {!integration.isConnected && integration.canConnect && (
            <button
              onClick={() => handleAction(onConnect)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                'bg-gold text-obsidian hover:bg-gold/90',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Connect
            </button>
          )}

          {integration.isConnected && (
            <>
              {integration.canRescan && (
                <button
                  onClick={() => handleAction(onRescan)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Rescan
                </button>
              )}

              {integration.canPause && (
                <button
                  onClick={() => handleAction(onPause)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              )}

              {integration.canReconnect && (
                <button
                  onClick={() => handleAction(onReconnect)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </button>
              )}

              <button
                onClick={onSettings}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-all"
                aria-label="Integration settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Coerce an unknown value into a finite, non-negative number.
function safeNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// Sync stats component — numbers are coerced defensively.
function SyncStats({ stats }: { stats: { processed: number; candidates: number; errors: number } }) {
  const processed = safeNumber(stats?.processed)
  const candidates = safeNumber(stats?.candidates)
  const errors = safeNumber(stats?.errors)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fastTransition, delay: 0.1 }}
      className="rounded-2xl bg-card border border-border p-5"
    >
      <h3 className="font-semibold text-foreground mb-4">Sync Statistics</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-2xl font-bold text-foreground">{processed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Messages Processed</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-2xl font-bold text-gold">{candidates.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Candidates Found</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className={cn(
            'text-2xl font-bold',
            errors > 0 ? 'text-crimson' : 'text-emerald'
          )}>
            {errors.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Errors</p>
        </div>
      </div>
    </motion.div>
  )
}

// Main Integrations Screen
export function IntegrationsScreen() {
  // Fetch integrations from API — fetcher never throws, so SWR's `error`
  // path shouldn't fire, but we still defensively coerce the result below.
  const { data: integrationsData, mutate: mutateIntegrations } = useSWR<unknown>(
    '/api/smart-capture/integrations',
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )

  // Pull `.integrations` only if data is an object with an array at that key.
  const rawIntegrations: unknown[] = (() => {
    if (!integrationsData || typeof integrationsData !== 'object') return []
    const list = (integrationsData as Record<string, unknown>).integrations
    return Array.isArray(list) ? list : []
  })()

  // Normalize every entry into a safe shape.
  const integrations: IntegrationInfo[] = rawIntegrations.map((raw, i) => normalizeIntegration(raw, i))

  // Fetch counts for stats
  const { data: countsData } = useSWR<unknown>('/api/smart-capture/counts', fetcher)

  // Calculate stats from counts — fully guarded.
  const countsTotal = (() => {
    if (!countsData || typeof countsData !== 'object') return 0
    const counts = (countsData as Record<string, unknown>).counts
    if (!counts || typeof counts !== 'object') return 0
    return safeNumber((counts as Record<string, unknown>).total)
  })()

  const stats = {
    processed: 0, // Would need a separate endpoint for this
    candidates: countsTotal,
    errors: 0, // Would need a separate endpoint for this
  }

  const handleConnect = (id: string) => {
    console.log('[v0] Connect integration:', id)
    // In real implementation, this would trigger OAuth flow
  }

  const handleReconnect = async (id: string) => {
    console.log('[v0] Reconnect integration:', id)
    try {
      await mutateIntegrations()
    } catch (err) {
      console.log('[v0] reconnect revalidate failed', err)
    }
  }

  const handleRescan = async (id: string) => {
    console.log('[v0] Rescan integration:', id)
    try {
      await mutateIntegrations()
    } catch (err) {
      console.log('[v0] rescan revalidate failed', err)
    }
  }

  const handlePause = async (id: string) => {
    console.log('[v0] Pause integration:', id)
    try {
      await mutateIntegrations()
    } catch (err) {
      console.log('[v0] pause revalidate failed', err)
    }
  }

  const handleSettings = (id: string) => {
    console.log('[v0] Open settings for:', id)
  }

  const emailIntegrations = integrations.filter((i) => i.icon === 'mail')
  const systemIntegrations = integrations.filter((i) => i.icon !== 'mail')

  return (
    <PageTransition>
      <Header title="Integrations" />

      <div className="px-4 lg:px-6 pb-8 space-y-6">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
        >
          <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your email and notification sources for automatic subscription detection
          </p>
        </motion.div>

        {/* Sync stats */}
        <SyncStats stats={stats} />

        {/* Email integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Email Sources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {emailIntegrations.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-muted/30 border border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">No email sources available yet.</p>
              </div>
            ) : (
              emailIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.id)}
                  onReconnect={() => handleReconnect(integration.id)}
                  onRescan={() => handleRescan(integration.id)}
                  onPause={() => handlePause(integration.id)}
                  onSettings={() => handleSettings(integration.id)}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* System integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">System</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {systemIntegrations.length === 0 ? (
              <div className="col-span-full rounded-2xl bg-muted/30 border border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">No system integrations available yet.</p>
              </div>
            ) : (
              systemIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.id)}
                  onReconnect={() => handleReconnect(integration.id)}
                  onRescan={() => handleRescan(integration.id)}
                  onPause={() => handlePause(integration.id)}
                  onSettings={() => handleSettings(integration.id)}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.25 }}
          className="rounded-2xl bg-card border border-border p-5"
        >
          <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="/app/inbox"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:border-gold/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-medium text-foreground">View Inbox</p>
                  <p className="text-xs text-muted-foreground">Review detected candidates</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
            </a>

            <a
              href="/app/labs/notification-capture"
              className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border hover:border-gold/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <FlaskConical className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-foreground">Notification Lab</p>
                  <p className="text-xs text-muted-foreground">Test notification parsing</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
            </a>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
