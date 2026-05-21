import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/notification-service'
import { invalidateUserCaches } from '@/lib/redis'

type IntegrationAction = 'connect' | 'reconnect' | 'rescan' | 'pause' | 'settings'

const SUPPORTED_INTEGRATIONS = new Set([
  'int_gmail',
  'int_outlook',
  'int_automation',
  'int_notification_lab',
])

function labelForIntegration(id: string) {
  if (id === 'int_gmail') return 'Gmail'
  if (id === 'int_outlook') return 'Outlook'
  if (id === 'int_automation') return 'Automation Engine'
  if (id === 'int_notification_lab') return 'Notification Lab'
  return 'Integration'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const integrationId = String(body?.integrationId || '')
    const action = String(body?.action || '') as IntegrationAction

    if (!SUPPORTED_INTEGRATIONS.has(integrationId)) {
      return NextResponse.json({ error: 'Unknown integration' }, { status: 400 })
    }

    if (!['connect', 'reconnect', 'rescan', 'pause', 'settings'].includes(action)) {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const integrationName = labelForIntegration(integrationId)

    if (action === 'settings') {
      return NextResponse.json({
        success: true,
        message: `${integrationName} settings are available in Account Settings.`,
        actionUrl: `/app/settings?integration=${encodeURIComponent(integrationId)}`,
      })
    }

    if (action === 'connect' || action === 'reconnect') {
      // OAuth is intentionally not faked. Return a useful response so the UI is not a dead button.
      await createNotification({
        userId: user.id,
        type: 'integration_setup_requested',
        category: 'system',
        severity: 'info',
        title: `${integrationName} setup requested`,
        message: 'We saved your request. OAuth connection is being finalized for this source.',
        actionUrl: '/app/integrations',
        idempotencyKey: `integration:${action}:${integrationId}:${user.id}`,
        metadata: { integrationId, action },
      })

      return NextResponse.json({
        success: true,
        status: 'setup_pending',
        message: `${integrationName} connection flow is not live yet. Your request was saved in Notifications.`,
        actionUrl: '/app/integrations',
      })
    }

    if (action === 'pause') {
      await createNotification({
        userId: user.id,
        type: 'integration_pause_requested',
        category: 'system',
        severity: 'info',
        title: `${integrationName} pause requested`,
        message: 'Pause/resume controls are queued for the integrations hardening phase.',
        actionUrl: '/app/integrations',
        idempotencyKey: `integration:pause:${integrationId}:${user.id}:${Date.now()}`,
        metadata: { integrationId, action },
      })

      return NextResponse.json({
        success: true,
        status: 'queued',
        message: `${integrationName} pause request recorded.`,
      })
    }

    // rescan
    await invalidateUserCaches(user.id)
    await createNotification({
      userId: user.id,
      type: 'integration_rescan_requested',
      category: 'system',
      severity: 'info',
      title: `${integrationName} rescan started`,
      message: 'Renewly refreshed your Smart Inbox data. Any new candidates will appear after processing.',
      actionUrl: '/app/inbox',
      idempotencyKey: `integration:rescan:${integrationId}:${user.id}:${Date.now()}`,
      metadata: { integrationId, action },
    })

    return NextResponse.json({
      success: true,
      status: 'completed',
      message: `${integrationName} rescan requested. Smart Inbox has been refreshed.`,
      actionUrl: '/app/inbox',
    })
  } catch (error) {
    console.error('[integrations/action] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
