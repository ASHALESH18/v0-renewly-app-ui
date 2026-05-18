import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getPlanPricing } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'

/**
 * Get Supabase client for sync operations
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
 * Get next monthly renewal date
 * If periodEnd exists, use that. Otherwise, return 30 days from now.
 */
export function getNextMonthlyRenewalDate(periodEnd?: string | null): string {
  if (periodEnd) {
    return periodEnd
  }
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0] // Return as ISO date string (YYYY-MM-DD)
}

/**
 * Ensure family group exists and owner is member
 * Returns the family_group_id
 */
export async function ensureFamilyGroupForOwner(params: {
  ownerUserId: string
  ownerEmail: string
  currentPeriodStart?: string | null
  currentPeriodEnd?: string | null
}): Promise<string> {
  const { ownerUserId, ownerEmail, currentPeriodStart, currentPeriodEnd } = params

  const supabase = getSupabaseClient()

  try {
    // Find existing active/past_due family group for owner
    const { data: existing, error: fetchError } = await supabase
      .from('family_groups')
      .select('id')
      .eq('owner_user_id', ownerUserId)
      .in('status', ['active', 'past_due'])
      .limit(1)
      .single()

    let familyGroupId: string

    if (!fetchError && existing) {
      // Use existing group
      familyGroupId = existing.id
    } else {
      // Create new family group
      const { data: newGroup, error: createError } = await supabase
        .from('family_groups')
        .insert({
          owner_user_id: ownerUserId,
          status: 'active',
          included_member_limit: 4,
          extra_member_price_inr: 99,
          extra_seat_count: 0,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
        })
        .select('id')
        .single()

      if (createError) {
        console.error('[renewly-sync] Error creating family group:', createError)
        throw createError
      }

      familyGroupId = newGroup.id
    }

    // Ensure owner is in family_members
    const { data: ownerMember, error: memberFetchError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', ownerUserId)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!memberFetchError && ownerMember) {
      // Owner already exists as member
      return familyGroupId
    }

    // Create owner membership
    const { error: memberCreateError } = await supabase
      .from('family_members')
      .insert({
        family_group_id: familyGroupId,
        user_id: ownerUserId,
        email: ownerEmail,
        role: 'owner',
        status: 'active',
        seat_type: 'owner',
      })

    if (memberCreateError) {
      console.warn('[renewly-sync] Error creating owner membership:', memberCreateError)
      // Don't throw - membership might already exist
    }

    return familyGroupId
  } catch (error) {
    console.error('[renewly-sync] ensureFamilyGroupForOwner error:', error)
    throw error
  }
}

/**
 * Sync Renewly Pro subscription for user
 */
export async function syncRenewlyProSubscription(params: {
  userId: string
  currentPeriodEnd?: string | null
}): Promise<void> {
  const { userId, currentPeriodEnd } = params
  const supabase = getSupabaseClient()

  try {
    const renewalDate = getNextMonthlyRenewalDate(currentPeriodEnd)
    const pricing = getPlanPricing('pro', 'INR')
    const amount = pricing?.amount ?? 149

    const managedKey = `renewly:pro:${userId}`

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          managed_subscription_key: managedKey,
          user_id: userId,
          name: 'Renewly Pro',
          category: 'Productivity',
          amount,
          currency: 'INR',
          billing_cycle: 'monthly',
          status: 'active',
          renewal_date: renewalDate,
          description: 'Managed by Renewly billing.',
          color: '#C9A45C',
          is_system_managed: true,
          managed_plan: 'pro',
          system_source: 'renewly_billing',
          billing_owner_user_id: userId,
          family_group_id: null,
          covered_by_family: false,
          system_metadata: { synced_at: new Date().toISOString() },
        },
        { onConflict: 'managed_subscription_key' }
      )

    if (error) {
      console.error('[renewly-sync] Error syncing pro subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('[renewly-sync] syncRenewlyProSubscription error:', error)
    throw error
  }
}

/**
 * Sync Renewly Family subscription for owner
 */
export async function syncRenewlyFamilyOwnerSubscription(params: {
  ownerUserId: string
  familyGroupId: string
  extraSeatCount?: number
  currentPeriodEnd?: string | null
}): Promise<void> {
  const { ownerUserId, familyGroupId, extraSeatCount = 0, currentPeriodEnd } = params
  const supabase = getSupabaseClient()

  try {
    const renewalDate = getNextMonthlyRenewalDate(currentPeriodEnd)
    const basePricing = getPlanPricing('family', 'INR')
    const baseAmount = basePricing?.amount ?? 299
    const extraAmount = extraSeatCount * 99
    const totalAmount = baseAmount + extraAmount

    const managedKey = `renewly:family:owner:${familyGroupId}:${ownerUserId}`

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          managed_subscription_key: managedKey,
          user_id: ownerUserId,
          name: 'Renewly Family',
          category: 'Productivity',
          amount: totalAmount,
          currency: 'INR',
          billing_cycle: 'monthly',
          status: 'active',
          renewal_date: renewalDate,
          description: 'Managed by Renewly billing. Includes family access.',
          color: '#C9A45C',
          is_system_managed: true,
          managed_plan: 'family',
          system_source: 'renewly_billing',
          managed_subscription_key: managedKey,
          billing_owner_user_id: ownerUserId,
          family_group_id: familyGroupId,
          covered_by_family: false,
          system_metadata: {
            synced_at: new Date().toISOString(),
            base_amount: baseAmount,
            extra_seats: extraSeatCount,
            extra_amount: extraAmount,
          },
        },
        { onConflict: 'managed_subscription_key' }
      )

    if (error) {
      console.error('[renewly-sync] Error syncing family owner subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('[renewly-sync] syncRenewlyFamilyOwnerSubscription error:', error)
    throw error
  }
}

/**
 * Sync Renewly Family subscription for family member
 */
export async function syncRenewlyFamilyMemberSubscription(params: {
  memberUserId: string
  ownerUserId: string
  familyGroupId: string
  currentPeriodEnd?: string | null
}): Promise<void> {
  const { memberUserId, ownerUserId, familyGroupId, currentPeriodEnd } = params
  const supabase = getSupabaseClient()

  try {
    const renewalDate = getNextMonthlyRenewalDate(currentPeriodEnd)
    const managedKey = `renewly:family:member:${familyGroupId}:${memberUserId}`

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          managed_subscription_key: managedKey,
          user_id: memberUserId,
          name: 'Renewly Family',
          category: 'Productivity',
          amount: 0,
          currency: 'INR',
          billing_cycle: 'monthly',
          status: 'active',
          renewal_date: renewalDate,
          description: 'Covered by Family plan.',
          color: '#C9A45C',
          is_system_managed: true,
          managed_plan: 'family',
          system_source: 'renewly_billing',
          billing_owner_user_id: ownerUserId,
          family_group_id: familyGroupId,
          covered_by_family: true,
          system_metadata: { synced_at: new Date().toISOString() },
        },
        { onConflict: 'managed_subscription_key' }
      )

    if (error) {
      console.error('[renewly-sync] Error syncing family member subscription:', error)
      throw error
    }
  } catch (error) {
    console.error('[renewly-sync] syncRenewlyFamilyMemberSubscription error:', error)
    throw error
  }
}

/**
 * Archive old Renewly system-managed subscriptions
 */
export async function archiveManagedRenewlySubscriptions(params: {
  userId: string
  exceptManagedKeys?: string[]
}): Promise<void> {
  const { userId, exceptManagedKeys = [] } = params
  const supabase = getSupabaseClient()

  try {
    // Find all system-managed Renewly subscriptions for this user
    const { data: oldSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, managed_subscription_key')
      .eq('user_id', userId)
      .eq('is_system_managed', true)

    if (fetchError) {
      console.error('[renewly-sync] Error fetching old subscriptions:', fetchError)
      throw fetchError
    }

    if (!oldSubs || oldSubs.length === 0) {
      return
    }

    // Filter out exceptions
    const idsToArchive = oldSubs
      .filter((sub) => !exceptManagedKeys.includes(sub.managed_subscription_key || ''))
      .map((sub) => sub.id)

    if (idsToArchive.length === 0) {
      return
    }

    // Archive them
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .in('id', idsToArchive)

    if (updateError) {
      console.error('[renewly-sync] Error archiving subscriptions:', updateError)
      throw updateError
    }
  } catch (error) {
    console.error('[renewly-sync] archiveManagedRenewlySubscriptions error:', error)
    throw error
  }
}

/**
 * Main orchestrator: Sync Renewly subscription based on plan
 */
export async function syncRenewlyBillingSubscriptionForPlan(params: {
  userId: string
  email: string
  plan: PlanType
  currentPeriodEnd?: string | null
}): Promise<void> {
  const { userId, email, plan, currentPeriodEnd } = params
  const supabase = getSupabaseClient()

  try {
    if (plan === 'pro') {
      // Sync Pro, archive old Family
      await syncRenewlyProSubscription({ userId, currentPeriodEnd })
      await archiveManagedRenewlySubscriptions({
        userId,
        exceptManagedKeys: [`renewly:pro:${userId}`],
      })
    } else if (plan === 'family') {
      // Ensure family group, sync Family owner, archive old Pro
      const familyGroupId = await ensureFamilyGroupForOwner({
        ownerUserId: userId,
        ownerEmail: email,
        currentPeriodEnd,
      })

      // F7.2B: Get extra seat count from family_seat_addons (active) for CURRENT CYCLE
      // Include seats scheduled for cancellation (cancel_at_period_end=true) because they're still active until period end
      const { data: seatAddons, error: addonsError } = await supabase
        .from('family_seat_addons')
        .select('quantity, price_inr_per_seat, cancel_at_period_end')
        .eq('family_group_id', familyGroupId)
        .eq('status', 'active')

      if (addonsError) {
        console.warn('[renewly-sync] Could not fetch seat addons:', addonsError)
      }

      // F7.2B: Use active addon quantity for CURRENT MONTHLY AMOUNT (includes scheduled)
      // Scheduled cancellations (cancel_at_period_end=true) stay in current cycle
      let currentCycleSeats = 0
      let scheduledCancelSeats = 0
      if (seatAddons && seatAddons.length > 0) {
        currentCycleSeats = seatAddons.reduce((sum, addon) => sum + (addon.quantity || 0), 0)
        scheduledCancelSeats = seatAddons
          .filter(a => a.cancel_at_period_end)
          .reduce((sum, addon) => sum + (addon.quantity || 0), 0)
      } else {
        // Fallback to family_groups.extra_seat_count if no addons
        const { data: familyGroup, error: fetchError } = await supabase
          .from('family_groups')
          .select('extra_seat_count')
          .eq('id', familyGroupId)
          .single()

        if (fetchError) {
          console.warn('[renewly-sync] Could not fetch family group for seat count:', fetchError)
        }

        currentCycleSeats = familyGroup?.extra_seat_count ?? 0
      }

      // F7.2B: Debug logging shows both current and next cycle amounts
      if (process.env.NODE_ENV !== 'production') {
        const nextCycleSeats = currentCycleSeats - scheduledCancelSeats
        console.log('[v0] F7.2B DEBUG: Renewly Family sync', {
          familyGroupId,
          currentCycleSeats,
          scheduledCancelSeats,
          nextCycleSeats,
          currentMonthlyAmount: 299 + currentCycleSeats * 99,
          nextCycleMonthlyAmount: 299 + nextCycleSeats * 99,
        })
      }

      // F7.2B: Use current cycle seats (includes scheduled cancellations)
      await syncRenewlyFamilyOwnerSubscription({
        ownerUserId: userId,
        familyGroupId,
        extraSeatCount: currentCycleSeats,
        currentPeriodEnd,
      })

      await archiveManagedRenewlySubscriptions({
        userId,
        exceptManagedKeys: [`renewly:family:owner:${familyGroupId}:${userId}`],
      })
    } else if (plan === 'free') {
      // Archive all system-managed Renewly subscriptions
      await archiveManagedRenewlySubscriptions({ userId })
    }
    // For 'enterprise', do nothing for now
  } catch (error) {
    console.error('[renewly-sync] syncRenewlyBillingSubscriptionForPlan error:', error)
    // Log but don't throw - we don't want sync failures to break payment flows
  }
}
