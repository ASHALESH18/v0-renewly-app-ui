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

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Integration type from API
interface IntegrationInfo {
  id: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  account?: { email: string } | null
  lastSync?: string | null
  syncHealth?: 'healthy' | 'degraded' | 'unhealthy'
  webhookStatus?: 'active' | 'inactive' | 'error'
  canConnect: boolean
  canReconnect: boolean
  canRescan: boolean
  canPause: boolean
}

// Fast transition
const fastTransition = { duration: 0.2, ease: [0.32, 0.72, 0, 1] }

// Health status component
function HealthStatus({ health }: { health?: 'healthy' | 'degraded' | 'unhealthy' }) {
  if (!health) return null

  const config = {
    healthy: { label: 'Healthy', color: 'bg-emerald', pulse: false },
    degraded: { label: 'Degraded', color: 'bg-gold', pulse: true },
    unhealthy: { label: 'Unhealthy', color: 'bg-crimson', pulse: true },
  }
  const { label, color, pulse } = config[health]

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

// Webhook status component
function WebhookStatus({ status }: { status?: 'active' | 'inactive' | 'error' }) {
  if (!status) return null

  const config = {
    active: { label: 'Webhook Active', icon: Activity, color: 'text-emerald' },
    inactive: { label: 'Webhook Inactive', icon: Pause, color: 'text-muted-foreground' },
    error: { label: 'Webhook Error', icon: AlertTriangle, color: 'text-crimson' },
  }
  const { label, icon: Icon, color } = config[status]

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
    await new Promise((r) => setTimeout(r, 1000))
    action()
    setIsLoading(false)
  }

  const formatLastSync = (date?: string | null) => {
    if (!date) return 'Never synced'
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
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

              {integration.lastSync && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Last sync: {formatLastSync(integration.lastSync)}
                </div>
              )}
            </div>

            {/* Account email if available */}
            {integration.account && (
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

// Sync stats component
function SyncStats({ stats }: { stats: { processed: number; candidates: number; errors: number } }) {
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
          <p className="text-2xl font-bold text-foreground">{stats.processed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Messages Processed</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-2xl font-bold text-gold">{stats.candidates}</p>
          <p className="text-xs text-muted-foreground mt-1">Candidates Found</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className={cn(
            'text-2xl font-bold',
            stats.errors > 0 ? 'text-crimson' : 'text-emerald'
          )}>
            {stats.errors}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Errors</p>
        </div>
      </div>
    </motion.div>
  )
}

// Main Integrations Screen
export function IntegrationsScreen() {
  // Fetch integrations from API
  const { data: integrationsData, mutate: mutateIntegrations } = useSWR<{ integrations: IntegrationInfo[] }>(
    '/api/smart-capture/integrations',
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  )
  const integrations = integrationsData?.integrations || []

  // Fetch counts for stats
  const { data: countsData } = useSWR<{ counts: { total: number } }>(
    '/api/smart-capture/counts',
    fetcher
  )

  // Calculate stats from counts
  const stats = {
    processed: 0, // Would need a separate endpoint for this
    candidates: countsData?.counts?.total || 0,
    errors: 0, // Would need a separate endpoint for this
  }

  const handleConnect = (id: string) => {
    console.log('Connect integration:', id)
    // In real implementation, this would trigger OAuth flow
  }

  const handleReconnect = async (id: string) => {
    console.log('Reconnect integration:', id)
    await mutateIntegrations()
  }

  const handleRescan = async (id: string) => {
    console.log('Rescan integration:', id)
    // Would trigger sync via Inngest
    await mutateIntegrations()
  }

  const handlePause = async (id: string) => {
    console.log('Pause integration:', id)
    await mutateIntegrations()
  }

  const handleSettings = (id: string) => {
    console.log('Open settings for:', id)
  }

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
          <p className="text-sm text-muted-foreground mt-2">
            Connect your email, calendar, and other sources. Renewly looks for subscription signals and never adds anything without your review.
          </p>
        </motion.div>

        {/* Data Sources section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.1 }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Sources</h2>
            <p className="text-sm text-muted-foreground">Connect your email and calendar to detect subscription signals automatically.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {integrations
              .filter((i) => i.icon === 'mail')
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.id)}
                  onReconnect={() => handleReconnect(integration.id)}
                  onRescan={() => handleRescan(integration.id)}
                  onPause={() => handlePause(integration.id)}
                  onSettings={() => handleSettings(integration.id)}
                />
              ))}
          </div>
        </motion.div>

        {/* Intelligence Systems */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.15 }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Intelligence Systems</h2>
            <p className="text-sm text-muted-foreground">Automatic systems that power Smart Capture, renewal detection, and notifications.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {integrations
              .filter((i) => i.icon !== 'mail')
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration.id)}
                  onReconnect={() => handleReconnect(integration.id)}
                  onRescan={() => handleRescan(integration.id)}
                  onPause={() => handlePause(integration.id)}
                  onSettings={() => handleSettings(integration.id)}
                />
              ))}
          </div>
        </motion.div>

        {/* Privacy & Safety note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fastTransition, delay: 0.2 }}
          className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Privacy:</span> Renewly only scans for subscription-related signals. Your full email content and sensitive data are never shared or stored.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}
