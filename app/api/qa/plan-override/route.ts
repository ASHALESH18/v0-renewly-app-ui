'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'
import { invalidateCache } from '@/lib/redis'

/**
 * QA-only endpoint to override user plan for testing
 * This is NOT a production feature and must be disabled in production
 * 
 * Security:
 * - Only works if QA_PLAN_OVERRIDE_ENABLED=true in server env
 * - Only works if Vercel env is preview/development (not production)
 * - Requires authentication (getUser)
 * - Requires email allowlist in QA_PLAN_OVERRIDE_EMAILS
 * - Server-side only, never exposes service role key
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[plan-override] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if QA override is enabled
    const qaEnabled = process.env.QA_PLAN_OVERRIDE_ENABLED === 'true'
    const nodeEnv = process.env.NODE_ENV
    const vercelEnv = process.env.VERCEL_ENV || 'development'

    // Deny in production
    if (vercelEnv === 'production') {
      return NextResponse.json(
        { error: 'QA override is not available in production' },
        { status: 403 }
      )
    }

    if (!qaEnabled) {
      return NextResponse.json(
        { error: 'QA override is not enabled' },
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
      console.warn(`[v0] QA override attempted by unauthorized email: ${user.email}`)
      return NextResponse.json(
        { error: 'Your email is not authorized for QA override' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { plan } = body

    // Validate plan
    const validPlans = ['free', 'pro', 'family']
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}. Must be one of: ${validPlans.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current plan for audit log
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

    const oldPlan = profile.plan

    // Update plan in Supabase
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('plan')
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Could not update plan' },
        { status: 500 }
      )
    }

    // Audit log (server-side only, never exposed to client)
    console.log(`[v0] QA PLAN OVERRIDE: ${user.email} (${user.id}) changed from ${oldPlan} to ${plan} at ${new Date().toISOString()}`)

    // Sync system-managed Renewly subscriptions
    let syncStatus: 'completed' | 'failed' | 'skipped' = 'skipped'
    if (plan === 'pro' || plan === 'family') {
      try {
        // Calculate period end (30 days from now)
        const periodStart = new Date()
        const periodEnd = new Date(periodStart)
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        const periodEndStr = periodEnd.toISOString().split('T')[0]

        await syncRenewlyBillingSubscriptionForPlan({
          userId: user.id,
          email: user.email || '',
          plan,
          currentPeriodEnd: periodEndStr,
        })
        syncStatus = 'completed'
      } catch (syncError) {
        console.error('[v0] QA: Renewly subscription sync failed:', syncError)
        syncStatus = 'failed'
      }
    } else if (plan === 'free') {
      // Archive system-managed subscriptions when downgrading to free
      try {
        const { archiveManagedRenewlySubscriptions } = await import(
          '@/lib/billing/renewly-subscription-sync'
        )
        await archiveManagedRenewlySubscriptions({ userId: user.id })
        syncStatus = 'completed'
      } catch (syncError) {
        console.error('[v0] QA: Archive Renewly subscriptions failed:', syncError)
        syncStatus = 'failed'
      }
    }

    // Invalidate subscriptions cache after plan change and sync
    try {
      await invalidateCache(`subscriptions:${user.id}`)
    } catch (cacheError) {
      console.error('[v0] QA: Failed to invalidate subscriptions cache:', cacheError)
    }

    // Invalidate cache tags
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`subscriptions:${user.id}`)
    revalidateTag('profile')

    return NextResponse.json(
      {
        success: true,
        plan: updated.plan,
        sync: syncStatus,
        message: syncStatus === 'failed' 
          ? 'Plan updated, but Renewly subscription sync failed. Use Resync Current Plan or check server logs.'
          : `QA plan set to ${plan}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] QA plan override error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
