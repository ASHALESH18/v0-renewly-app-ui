import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getPlanPricing } from '@/lib/plans'
import type { PlanType } from '@/lib/plans'
import { computeFamilyBillingState } from '@/lib/billing/family-billing-state'
import { getUserFamilyRelationship } from '@/lib/family/get-user-family-relationship'

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
 * F7.2D-R: Persists current vs next-cycle billing metadata when extra seats are scheduled to cancel.
 */
export async function syncRenewlyFamilyOwnerSubscription(params: {
  ownerUserId: string
  familyGroupId: string
  extraSeatCount?: number
  currentPeriodEnd?: string | null
  /** F7.2D-R: optional active seat addon rows for scheduled-cancel metadata */
  seatAddons?: Array<{
    id?: string
    quantity?: number | null
    status?: string | null
    cancel_at_period_end?: boolean | null
    current_period_end?: string | null
  }>
}): Promise<void> {
  const { ownerUserId, familyGroupId, extraSeatCount = 0, currentPeriodEnd, seatAddons } = params
  const supabase = getSupabaseClient()

  try {
    const renewalDate = getNextMonthlyRenewalDate(currentPeriodEnd)
    const basePricing = getPlanPricing('family', 'INR')
    const baseAmount = basePricing?.amount ?? 299

    // F7.2D-R: Compute centralized billing state from add-ons when provided.
    const billingState = computeFamilyBillingState({
      currentPeriodEnd,
      seatAddons: seatAddons || [],
      baseAmount,
    })

    // Fall back to extraSeatCount-based math if no addons were supplied.
    const currentExtraSeats = seatAddons ? billingState.currentExtraSeatCount : extraSeatCount
    const extraAmount = currentExtraSeats * 99
    const currentMonthlyTotal = seatAddons
      ? billingState.currentMonthlyTotal
      : baseAmount + extraAmount
    const nextCycleMonthlyTotal = seatAddons
      ? billingState.nextCycleMonthlyTotal
      : currentMonthlyTotal

    const managedKey = `renewly:family:owner:${familyGroupId}:${ownerUserId}`

    const { error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          managed_subscription_key: managedKey,
          user_id: ownerUserId,
          name: 'Renewly Family',
          category: 'Productivity',
          amount: currentMonthlyTotal,
          currency: 'INR',
          billing_cycle: 'monthly',
          status: 'active',
          renewal_date: renewalDate,
          description: 'Managed by Renewly billing. Includes family access.',
          color: '#C9A45C',
          is_system_managed: true,
          managed_plan: 'family',
          system_source: 'renewly_billing',
          billing_owner_user_id: ownerUserId,
          family_group_id: familyGroupId,
          covered_by_family: false,
          system_metadata: {
            synced_at: new Date().toISOString(),
            base_amount: baseAmount,
            extra_seats: currentExtraSeats,
            extra_amount: extraAmount,
            current_monthly_total: currentMonthlyTotal,
            next_cycle_monthly_total: nextCycleMonthlyTotal,
            scheduled_cancel_extra_seats: billingState.scheduledCancelExtraSeatCount,
            scheduled_cancel_date: billingState.scheduledCancelDate,
            has_scheduled_extra_seat_cancellation: billingState.hasScheduledExtraSeatCancellation,
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
 * F7.2D-R: Persists seat type + scheduled-cancel metadata for extra-seat members.
 */
export async function syncRenewlyFamilyMemberSubscription(params: {
  memberUserId: string
  ownerUserId: string
  familyGroupId: string
  currentPeriodEnd?: string | null
  seatType?: 'included' | 'extra' | 'owner' | null
  hasScheduledExtraSeatCancellation?: boolean
  accessEndsAt?: string | null
}): Promise<void> {
  const {
    memberUserId,
    ownerUserId,
    familyGroupId,
    currentPeriodEnd,
    seatType,
    hasScheduledExtraSeatCancellation = false,
    accessEndsAt = null,
  } = params
  const supabase = getSupabaseClient()

  try {
    // F7.2E-R: Get owner info from family_groups if not provided
    let finalOwnerUserId = ownerUserId
    if (!finalOwnerUserId) {
      const { data: group } = await supabase
        .from('family_groups')
        .select('owner_user_id')
        .eq('id', familyGroupId)
        .maybeSingle()
      finalOwnerUserId = group?.owner_user_id || ''
    }

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
          billing_owner_user_id: finalOwnerUserId,
          family_group_id: familyGroupId,
          covered_by_family: true,
          system_metadata: {
            synced_at: new Date().toISOString(),
            seat_type: seatType ?? null,
            has_scheduled_extra_seat_cancellation: hasScheduledExtraSeatCancellation,
            access_ends_at: accessEndsAt,
          },
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
      // F7.2E-R: Relationship-aware family sync
      // Check if user is actually an owner or just has profile.plan='family' (old data)
      const relationship = await getUserFamilyRelationship(userId)

      if (relationship.relationship === 'owner' && relationship.familyGroupId) {
        // F7.2E-R: User owns the family group - sync as owner
        const familyGroupId = relationship.familyGroupId
        const currentPeriodEnd = relationship.currentPeriodEnd

        // Fetch seat add-ons for owner
        const { data: seatAddons } = await supabase
          .from('family_seat_addons')
          .select('id, quantity, price_inr_per_seat, status, cancel_at_period_end, current_period_end')
          .eq('family_group_id', familyGroupId)
          .eq('status', 'active')

        let currentCycleSeats = 0
        if (seatAddons && seatAddons.length > 0) {
          currentCycleSeats = seatAddons.reduce((sum, addon) => sum + (addon.quantity || 0), 0)
        } else {
          const { data: familyGroup } = await supabase
            .from('family_groups')
            .select('extra_seat_count')
            .eq('id', familyGroupId)
            .single()
          currentCycleSeats = familyGroup?.extra_seat_count ?? 0
        }

        await syncRenewlyFamilyOwnerSubscription({
          ownerUserId: userId,
          familyGroupId,
          extraSeatCount: currentCycleSeats,
          currentPeriodEnd,
          seatAddons: seatAddons || [],
        })

        await archiveManagedRenewlySubscriptions({
          userId,
          exceptManagedKeys: [`renewly:family:owner:${familyGroupId}:${userId}`],
        })
      } else if (relationship.relationship === 'member' && relationship.familyGroupId) {
        // F7.2E-R: User is a member, sync as covered member (not owner)
        await syncRenewlyFamilyMemberSubscription({
          memberUserId: userId,
          ownerUserId: '',
          familyGroupId: relationship.familyGroupId,
          currentPeriodEnd: relationship.currentPeriodEnd,
          seatType: relationship.seatType as any,
        })

        // Archive any orphaned owner rows
        await archiveManagedRenewlySubscriptions({
          userId,
          exceptManagedKeys: [`renewly:family:member:${relationship.familyGroupId}:${userId}`],
        })
      } else {
        // F7.2E-R: No family relationship found - profile.plan='family' but not in DB
        // Archive any old family subscriptions and treat as standalone
        await archiveManagedRenewlySubscriptions({ userId })
      }
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
