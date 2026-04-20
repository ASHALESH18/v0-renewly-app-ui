import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/smart-capture/integrations
 * Fetch connected integrations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch connected accounts
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('[integrations] Error fetching accounts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    // Build integration info from accounts
    const integrations = buildIntegrationList(accounts || [])

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('[integrations] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper: Build full integration list with connection status
function buildIntegrationList(accounts: any[]) {
  const gmailAccount = accounts.find(a => a.provider === 'gmail')
  const outlookAccount = accounts.find(a => a.provider === 'outlook')

  return [
    {
      id: 'int_gmail',
      name: 'Gmail',
      description: 'Scan your Gmail for subscription receipts and renewal notices',
      icon: 'mail',
      isConnected: !!gmailAccount,
      account: gmailAccount || null,
      lastSync: gmailAccount?.last_sync || null,
      syncHealth: gmailAccount ? determineSyncHealth(gmailAccount) : undefined,
      webhookStatus: gmailAccount?.webhook_status || undefined,
      canConnect: !gmailAccount,
      canReconnect: !!gmailAccount,
      canRescan: !!gmailAccount,
      canPause: !!gmailAccount,
    },
    {
      id: 'int_outlook',
      name: 'Outlook',
      description: 'Connect your Outlook account to detect subscriptions',
      icon: 'mail',
      isConnected: !!outlookAccount,
      account: outlookAccount || null,
      lastSync: outlookAccount?.last_sync || null,
      syncHealth: outlookAccount ? determineSyncHealth(outlookAccount) : undefined,
      webhookStatus: outlookAccount?.webhook_status || undefined,
      canConnect: !outlookAccount,
      canReconnect: !!outlookAccount,
      canRescan: !!outlookAccount,
      canPause: !!outlookAccount,
    },
    {
      id: 'int_automation',
      name: 'Automation Engine',
      description: 'Background processing for candidate detection and analysis',
      icon: 'cpu',
      isConnected: true, // Always available
      syncHealth: 'healthy',
      canConnect: false,
      canReconnect: false,
      canRescan: true,
      canPause: true,
    },
    {
      id: 'int_notification_lab',
      name: 'Notification Lab',
      description: 'Test notification parsing with simulated events',
      icon: 'flask',
      isConnected: true, // Always available
      syncHealth: 'healthy',
      canConnect: false,
      canReconnect: false,
      canRescan: false,
      canPause: false,
    },
  ]
}

// Helper: Determine sync health from account data
function determineSyncHealth(account: any): 'healthy' | 'degraded' | 'unhealthy' {
  if (!account.last_sync) return 'unhealthy'

  const lastSyncTime = new Date(account.last_sync).getTime()
  const now = Date.now()
  const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60)

  if (account.status === 'error') return 'unhealthy'
  if (hoursSinceSync > 24) return 'unhealthy'
  if (hoursSinceSync > 6) return 'degraded'
  return 'healthy'
}
