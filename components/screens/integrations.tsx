'use client'

import { useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import useSWR, { mutate } from 'swr'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  FlaskConical,
  Link2,
  Loader2,
  Mail,
  Pause,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Header } from '@/components/header'
import { PageTransition } from '@/components/motion'

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const fastTransition = { duration: 0.22, ease: [0.32, 0.72, 0, 1] }

type IntegrationAction = 'connect' | 'reconnect' | 'rescan' | 'pause' | 'settings'

interface IntegrationInfo {
  id: string
  name: string
  description: string
  icon: string
  isConnected: boolean
  account?: { email?: string } | null
  lastSync?: string | null
  syncHealth?: 'healthy' | 'degraded' | 'unhealthy'
  webhookStatus?: 'active' | 'inactive' | 'error'
  canConnect: boolean
  canReconnect: boolean
  canRescan: boolean
  canPause: boolean
}

interface ActionState {
  integrationId: string
  action: IntegrationAction
}

function IntegrationIcon({ type, className }: { type: string; className?: string }) {
  const icons = {
    mail: Mail,
    cpu: Cpu,
    flask: FlaskConical,
    smartphone: Smartphone,
  }
  const Icon = icons[type as keyof typeof icons] || Link2
  return <Icon className={className} />
}

function formatLastSync(date?: string | null) {
  if (!date) return 'Not synced yet'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'Sync date unavailable'
  const mins = Math.floor((Date.now() - parsed.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return parsed.toLocaleDateString()
}

function healthMeta(health?: IntegrationInfo['syncHealth']) {
  if (health === 'healthy') return { label: 'Healthy', className: 'text-emerald border-emerald/25 bg-emerald/10', dot: 'bg-emerald' }
  if (health === 'degraded') return { label: 'Needs attention', className: 'text-gold border-gold/25 bg-gold/10', dot: 'bg-gold' }
  if (health === 'unhealthy') return { label: 'Unhealthy', className: 'text-crimson border-crimson/25 bg-crimson/10', dot: 'bg-crimson' }
  return { label: 'Ready to connect', className: 'text-muted-foreground border-border bg-muted/30', dot: 'bg-muted-foreground' }
}

function capabilityCopy(id: string) {
  if (id === 'int_gmail') return ['Receipt detection', 'Renewal alerts', 'Trial signals']
  if (id === 'int_outlook') return ['Work inbox scans', 'Renewal notices', 'Shared receipts']
  if (id === 'int_automation') return ['Candidate scoring', 'Duplicate checks', 'Background refresh']
  if (id === 'int_notification_lab') return ['QA simulations', 'Parser checks', 'Safe test events']
  return ['Subscription signals', 'Secure sync', 'Review queue']
}

function IntegrationCard({
  integration,
  loadingAction,
  onAction,
}: {
  integration: IntegrationInfo
  loadingAction: ActionState | null
  onAction: (integration: IntegrationInfo, action: IntegrationAction) => void
}) {
  const health = healthMeta(integration.syncHealth)
  const isBusy = loadingAction?.integrationId === integration.id
  const capabilities = capabilityCopy(integration.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fastTransition}
      className={cn(
        'group relative overflow-hidden rounded-[1.6rem] border p-5 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.8)]',
        integration.isConnected
          ? 'border-gold/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))]'
          : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))]'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.16),transparent_42%)]" />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-[radial-gradient(circle_at_top,rgba(201,164,92,0.22),rgba(255,255,255,0.03))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <IntegrationIcon type={integration.icon} className="h-6 w-6 text-gold" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{integration.name}</h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold',
                  integration.isConnected
                    ? 'border-emerald/30 bg-emerald/10 text-emerald'
                    : 'border-white/10 bg-white/5 text-muted-foreground'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', integration.isConnected ? 'bg-emerald' : 'bg-muted-foreground')} />
                {integration.isConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{integration.description}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {capabilities.map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-black/12 px-3 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/85">
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                {item}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={cn('rounded-2xl border px-3.5 py-3', health.className)}>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className={cn('h-2 w-2 rounded-full', health.dot)} />
              {health.label}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Sync health</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/12 px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground/85">
              <Clock className="h-3.5 w-3.5 text-gold" />
              {formatLastSync(integration.lastSync)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Last activity</p>
          </div>
        </div>

        {integration.account?.email && (
          <div className="rounded-2xl border border-gold/12 bg-gold/10 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Connected account</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{integration.account.email}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!integration.isConnected && integration.canConnect && (
            <button
              type="button"
              onClick={() => onAction(integration, 'connect')}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-2.5 text-sm font-semibold text-obsidian shadow-[0_14px_30px_-18px_rgba(201,164,92,0.8)] transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect
            </button>
          )}

          {integration.canRescan && (
            <button
              type="button"
              onClick={() => onAction(integration, 'rescan')}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Rescan
            </button>
          )}

          {integration.canReconnect && (
            <button
              type="button"
              onClick={() => onAction(integration, 'reconnect')}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-foreground/85 transition hover:border-gold/25 hover:text-gold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </button>
          )}

          {integration.canPause && (
            <button
              type="button"
              onClick={() => onAction(integration, 'pause')}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-gold/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={() => onAction(integration, 'settings')}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-gold/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function HeroMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-gold/20 bg-gold/10">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function IntegrationsScreen() {
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState<ActionState | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning' | 'error'; message: string } | null>(null)

  const { data: integrationsData, error, isLoading, mutate: mutateIntegrations } = useSWR<{ integrations: IntegrationInfo[] }>(
    '/api/smart-capture/integrations',
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: countsData } = useSWR<{ counts: { total: number; new?: number; review_needed?: number; added?: number; confirmed?: number } }>(
    '/api/smart-capture/counts',
    fetcher
  )

  const integrations = integrationsData?.integrations || []
  const connectedCount = integrations.filter((item) => item.isConnected).length
  const emailSources = integrations.filter((item) => item.icon === 'mail')
  const systemSources = integrations.filter((item) => item.icon !== 'mail')
  const candidateCount = countsData?.counts?.total || 0
  const reviewCount = (countsData?.counts?.new || 0) + (countsData?.counts?.review_needed || 0)

  const readiness = useMemo(() => {
    if (emailSources.some((item) => item.isConnected)) return 'Email source connected'
    if (candidateCount > 0) return 'Manual signals available'
    return 'Connect a source to unlock Smart Inbox'
  }, [candidateCount, emailSources])

  const runAction = async (integration: IntegrationInfo, action: IntegrationAction) => {
    setNotice(null)
    setLoadingAction({ integrationId: integration.id, action })

    try {
      const res = await fetch('/api/smart-capture/integrations/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: integration.id, action }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(body.error || 'Action failed')
      }

      setNotice({ tone: body.status === 'setup_pending' ? 'warning' : 'success', message: body.message || 'Action completed.' })
      await Promise.all([
        mutateIntegrations(),
        mutate('/api/smart-capture/counts'),
        mutate((key) => typeof key === 'string' && key.startsWith('/api/smart-capture/candidates')),
      ])

      if (action === 'settings' && body.actionUrl) {
        router.push(body.actionUrl)
      }
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Action failed'
      setNotice({ tone: 'error', message })
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <PageTransition>
      <Header title="Integrations" subtitle="Connect sources and control subscription intelligence" />

      <div className="px-4 pb-10 lg:px-6 space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fastTransition}
          className="relative overflow-hidden rounded-[2rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-5 sm:p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,164,92,0.18),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(70,101,160,0.16),transparent_40%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Intelligence Control Room
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Premium sources, safer automation.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Connect inbox and system signals, rescan safely, and keep every detected subscription in a review-first workflow. Nothing is added without your confirmation.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-4 py-2 text-sm text-foreground/85">
                <ShieldCheck className="h-4 w-4 text-emerald" />
                {readiness}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <HeroMetric label="Connected" value={`${connectedCount}/${integrations.length || 4}`} icon={Link2} />
              <HeroMetric label="Candidates" value={candidateCount} icon={Activity} />
              <HeroMetric label="Needs review" value={reviewCount} icon={AlertTriangle} />
            </div>
          </div>
        </motion.section>

        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm',
              notice.tone === 'success' && 'border-emerald/25 bg-emerald/10 text-emerald',
              notice.tone === 'warning' && 'border-gold/25 bg-gold/10 text-gold',
              notice.tone === 'error' && 'border-crimson/25 bg-crimson/10 text-crimson'
            )}
          >
            {notice.message}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-gold" /> Loading integrations...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-crimson/25 bg-crimson/10 p-5 text-sm text-crimson">
            Failed to load integrations. Please refresh the page.
          </div>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Data sources</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Email sources that feed Smart Inbox candidates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/app/inbox')}
                  className="hidden items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15 sm:inline-flex"
                >
                  Open Smart Inbox <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {emailSources.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} loadingAction={loadingAction} onAction={runAction} />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Intelligence systems</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review engine, notification lab, and background safety systems.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {systemSources.map((integration) => (
                  <IntegrationCard key={integration.id} integration={integration} loadingAction={loadingAction} onAction={runAction} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PageTransition>
  )
}
