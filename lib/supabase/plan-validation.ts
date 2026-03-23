import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { hasHitSubscriptionLimit, type PlanType } from '@/lib/plan-capabilities'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Get user's current plan and subscription count
 */
export async function getUserPlanAndSubscriptionCount() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    // Get profile with plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    // Count subscriptions
    const { count, error: countError } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_active', true)

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
 * Returns: { allowed: boolean, reason?: string }
 */
export async function canAddSubscription() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const result = await getUserPlanAndSubscriptionCount()
    if (!result.success) throw new Error(result.error)

    const { plan, subscriptionCount } = result

    if (hasHitSubscriptionLimit(plan, subscriptionCount)) {
      return {
        allowed: false,
        plan,
        limit: plan === 'free' ? 2 : -1,
        current: subscriptionCount,
        reason:
          plan === 'free'
            ? 'You have reached the 2 subscription limit on the Free plan. Upgrade to Pro to add unlimited subscriptions.'
            : 'Subscription limit reached',
      }
    }

    return {
      allowed: true,
      plan,
      limit: plan === 'free' ? 2 : -1,
      current: subscriptionCount,
    }
  } catch (error) {
    console.error('[v0] Can add subscription error:', error)
    return {
      allowed: false,
      error: (error as Error).message,
      plan: 'free' as PlanType,
      current: 0,
      limit: 2,
    }
  }
}
