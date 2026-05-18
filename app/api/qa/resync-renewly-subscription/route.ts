'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'
import { safeCacheDelete } from '@/lib/redis'

/**
 * QA-only endpoint to resync Renewly subscription for current plan
 * Useful when profile.plan is Pro/Family but Renewly subscription row is missing
 * 
 * Security:
 * - Only works if QA_PLAN_OVERRIDE_ENABLED=true in server env
 * - Only works if Vercel env is preview/development (not production)
 * - Requires authentication (getUser)
 * - Requires email allowlist in QA_PLAN_OVERRIDE_EMAILS
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[resync-renewly-subscription] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if QA override is enabled
    const qaEnabled = process.env.QA_PLAN_OVERRIDE_ENABLED === 'true'
    const vercelEnv = process.env.VERCEL_ENV || 'development'

    // Deny in production
    if (vercelEnv === 'production') {
      return NextResponse.json(
        { error: 'QA resync is not available in production' },
        { status: 403 }
      )
    }

    if (!qaEnabled) {
      return NextResponse.json(
        { error: 'QA resync is not enabled' },
        { status: 403 }
      )
    }

    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check email allowlist
    const allowlistStr = process.env.QA_PLAN_OVERRIDE_EMAILS || ''
    const allowlist = allowlistStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    if (!allowlist.includes(user.email?.toLowerCase() || '')) {
      console.warn(`[v0] QA resync attempted by unauthorized email: ${user.email}`)
      return NextResponse.json(
        { error: 'Your email is not authorized for QA resync' },
        { status: 403 }
      )
    }

    // Get current plan
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Could not fetch user profile' },
        { status: 500 }
      )
    }

    const currentPlan = profile.plan

    // Sync based on current plan
    let syncStatus: 'completed' | 'failed' = 'completed'
    if (currentPlan === 'pro' || currentPlan === 'family') {
      try {
        // Calculate period end (30 days from now)
        const periodStart = new Date()
        const periodEnd = new Date(periodStart)
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        const periodEndStr = periodEnd.toISOString().split('T')[0]

        await syncRenewlyBillingSubscriptionForPlan({
          userId: user.id,
          email: user.email || '',
          plan: currentPlan,
          currentPeriodEnd: periodEndStr,
        })
      } catch (syncError) {
        console.error('[v0] QA resync: Renewly subscription sync failed:', syncError)
        syncStatus = 'failed'
      }
    } else if (currentPlan === 'free') {
      // Archive system-managed subscriptions for free plan
      try {
        const { archiveManagedRenewlySubscriptions } = await import(
          '@/lib/billing/renewly-subscription-sync'
        )
        await archiveManagedRenewlySubscriptions({ userId: user.id })
      } catch (syncError) {
        console.error('[v0] QA resync: Archive Renewly subscriptions failed:', syncError)
        syncStatus = 'failed'
      }
    }

    // Invalidate cache tags
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`subscriptions:${user.id}`, 'max')
    revalidateTag('profile', 'max')
    
    // Invalidate Redis cache for subscriptions
    await safeCacheDelete(`subscriptions:${user.id}`)

    console.log(`[v0] QA RESYNC: ${user.email} (${user.id}) resynced plan: ${currentPlan}`)

    return NextResponse.json(
      {
        success: true,
        plan: currentPlan,
        sync: syncStatus,
        message: syncStatus === 'failed' 
          ? 'Resync attempted but failed. Check server logs.'
          : `Renewly subscription resynced for ${currentPlan} plan`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] QA resync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
