import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCache, CACHE_TTL, invalidateCache } from '@/lib/redis'
import { canAddSubscription } from '@/lib/supabase/plan-validation'

/**
 * GET /api/subscriptions
 * Fetch all subscriptions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `subscriptions:${user.id}`

    const subscriptions = await withCache(
      cacheKey,
      async () => {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'cancelled')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[subscriptions] Error fetching:', error)
          throw error
        }

        return data || []
      },
      CACHE_TTL.medium
    )

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('[subscriptions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permission = await canAddSubscription()

    if (!permission.allowed) {
      return NextResponse.json(
        {
          error:
            permission.reason ||
            'You have reached the subscription limit for your current plan.',
          code: 'SUBSCRIPTION_LIMIT_REACHED',
          plan: permission.plan,
          current: permission.current,
          limit: permission.limit,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      category,
      amount,
      currency,
      billing_cycle,
      renewal_date,
      description,
      status,
    } = body

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, amount' },
        { status: 400 }
      )
    }

    const subscriptionData = {
      user_id: user.id,
      name,
      category: category || 'Other',
      amount,
      currency: currency || 'INR',
      billing_cycle: billing_cycle || 'monthly',
      renewal_date: renewal_date || null,
      description: description || null,
      status: status || 'active',
      // System-managed fields: never allow client to set these
      is_system_managed: false,
      managed_plan: null,
      system_source: null,
      managed_subscription_key: null,
      billing_owner_user_id: null,
      family_group_id: null,
      covered_by_family: false,
      system_metadata: {},
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (error) {
      console.error('[subscriptions] Error creating:', error)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    await invalidateCache(`subscriptions:${user.id}`)

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('[subscriptions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
