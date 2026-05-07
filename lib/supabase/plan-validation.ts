import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { hasHitSubscriptionLimit, type PlanType } from '@/lib/plan-capabilities'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'

/**
 * Get Supabase client for plan validation operations
 * Initializes inside function calls, not at module level, to avoid build-time errors
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Get user's current plan and subscription count
 */
export async function getUserPlanAndSubscriptionCount() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = getSupabaseClient()

    // Get profile with plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    // Count subscriptions (excluding system-managed)
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_system_managed', false)

    if (countError) throw countError

    return {
      success: true,
      plan: (profile.plan || 'free') as PlanType,
      subscriptionCount: count || 0,
    }
  } catch (error) {
    console.error('[v0] Get user plan and subscription count error:', error)
    return {
      success: false,
      error: (error as Error).message,
      plan: 'free' as PlanType,
      subscriptionCount: 0,
    }
  }
}

/**
 * Check if user can add another subscription
 * Uses effective entitlement instead of just profile.plan
 * Returns: { allowed: boolean, reason?: string }
 */
export async function canAddSubscription() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = getSupabaseClient()

    // Count user-created subscriptions (excluding system-managed)
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('is_system_managed', false)

    if (countError) throw countError

    const subscriptionCount = count || 0

    // Resolve effective entitlement
    const entitlement = await resolveEffectiveEntitlement(user.id)
    const effectivePlan = entitlement.effectivePlan

    // Check subscription limit
    if (hasHitSubscriptionLimit(effectivePlan, subscriptionCount)) {
      const reason =
        effectivePlan === 'free'
          ? 'Your Family access has ended. Free accounts can track up to 2 subscriptions. Upgrade to continue adding more.'
          : `You have reached the subscription limit for your ${effectivePlan} plan.`

      return {
        allowed: false,
        reason,
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('[plan-validation] Can add subscription error:', error)
    return {
      allowed: false,
      reason: 'Could not validate subscription limit',
    }
  }
}
