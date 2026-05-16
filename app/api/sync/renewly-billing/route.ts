import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/repositories/profile'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'

/**
 * POST /api/sync/renewly-billing
 * Trigger Renewly subscription sync for current user
 * F6C.2B: Ensure Dashboard/Calendar have current synced subscription before displaying data
 */
export async function POST() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current plan and sync
    const profile = await getProfile()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Sync Renewly subscription based on current plan
    await syncRenewlyBillingSubscriptionForPlan({
      userId: user.id,
      email: profile.email || user.email || '',
      plan: profile.plan || 'free',
      currentPeriodEnd: profile.current_period_end || undefined,
    })

    return NextResponse.json(
      { message: 'Renewly subscription synced successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[sync] renewly-billing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
