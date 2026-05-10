'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateCache } from '@/lib/redis'
import { isRenewlyManagedSubscription } from '@/lib/billing/managed-subscription-utils'
import { getRenewlyManagedPlan, getSubscriptionRenewalDate } from '@/lib/billing/billing-lifecycle-utils'

/**
 * QA-only endpoint to schedule period-end billing changes (cancel/downgrade)
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
      console.error('[schedule-change] Missing Supabase env vars')
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
        { error: 'QA scheduling is not available in production' },
        { status: 403 }
      )
    }

    if (!qaEnabled) {
      return NextResponse.json(
        { error: 'QA scheduling is not enabled' },
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
    const allowedEmails = process.env.QA_PLAN_OVERRIDE_EMAILS || ''
    const emailList = allowedEmails.split(',').map((e) => e.trim().toLowerCase())
    if (!emailList.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json(
        { error: 'Email not in QA allowlist' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { type, targetPlan } = body

    if (!type || !['cancel', 'downgrade'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type: must be cancel or downgrade' },
        { status: 400 }
      )
    }

    if (!targetPlan || !['free', 'pro'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid targetPlan: must be free or pro' },
        { status: 400 }
      )
    }

    // Fetch user's subscriptions from Supabase
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (subError) {
      console.error('[schedule-change] Error fetching subscriptions:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    // Find current active Renewly-managed subscription
    let targetSubscription = subscriptions?.find((sub: any) => {
      if (!isRenewlyManagedSubscription(sub)) return false
      const plan = getRenewlyManagedPlan(sub)
      // Find the currently active managed plan (Pro or Family)
      return plan === 'pro' || plan === 'family'
    })

    if (!targetSubscription) {
      return NextResponse.json(
        { error: 'No active Renewly subscription found' },
        { status: 404 }
      )
    }

    // Get renewal date or calculate 30 days from now
    let effectiveAt = getSubscriptionRenewalDate(targetSubscription)
    if (!effectiveAt) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      effectiveAt = thirtyDaysFromNow.toISOString().split('T')[0]
    } else if (effectiveAt instanceof Date) {
      effectiveAt = effectiveAt.toISOString().split('T')[0]
    }

    const currentPlan = getRenewlyManagedPlan(targetSubscription)

    // Build pending billing change metadata
    const pendingBillingChange = {
      type,
      target_plan: targetPlan,
      effective_at: effectiveAt,
      requested_at: new Date().toISOString(),
      source: 'qa_preview',
    }

    // Update subscription with pending billing change
    const currentMetadata = targetSubscription.system_metadata || targetSubscription.systemMetadata || {}
    const updatedMetadata = {
      ...currentMetadata,
      pending_billing_change: pendingBillingChange,
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        system_metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetSubscription.id)

    if (updateError) {
      console.error('[schedule-change] Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule billing change' },
        { status: 500 }
      )
    }

    // Invalidate Redis cache
    try {
      await invalidateCache(`subscriptions:${user.id}`)
    } catch (err) {
      console.warn('[schedule-change] Redis cache invalidation failed:', err)
      // Continue - this is non-critical
    }

    // Invalidate Next.js cache tags
    const { revalidateTag } = await import('next/cache')
    revalidateTag(`subscriptions:${user.id}`)
    revalidateTag('profile')

    // Also schedule Family group action if user is a Family owner
    // This ensures Settings cancellation/downgrade properly flags the family group
    if (currentPlan === 'family' && (type === 'cancel' || (type === 'downgrade' && targetPlan === 'pro'))) {
      const { data: familyGroup } = await supabase
        .from('family_groups')
        .select('id, status, scheduled_action')
        .eq('owner_user_id', user.id)
        .in('status', ['active', 'past_due'])
        .maybeSingle()

      if (familyGroup) {
        const familyAction =
          type === 'cancel' ? 'cancel_at_period_end' : 'downgrade_to_pro_at_period_end'

        // Only update if not already scheduled
        if (familyGroup.scheduled_action !== familyAction) {
          await supabase
            .from('family_groups')
            .update({
              scheduled_action: familyAction,
              scheduled_action_reason: 'qa_preview_downgrade',
              scheduled_action_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', familyGroup.id)

          console.log(
            `[schedule-change] Also scheduled Family group ${familyGroup.id} for ${familyAction}`
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      type,
      targetPlan,
      effectiveAt,
      currentPlan,
    })
  } catch (error) {
    console.error('[schedule-change] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
