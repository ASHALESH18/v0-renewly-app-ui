import { createClient } from '@supabase/supabase-js'

/**
 * F7.3R: Extra-Seat Period-End Processor
 * 
 * Handles expiry of extra-seat addons when their period ends.
 * Removes members occupying those seats, syncs owner to base plan.
 */

interface ExtraSeatProcessorOptions {
  familyGroupId?: string
  now?: string | Date
  dryRun?: boolean
}

interface ExtraSeatProcessorResult {
  success: boolean
  dryRun: boolean
  mode: string
  processedAddonIds: string[]
  processedGroupIds: string[]
  removedMemberEmails: string[]
  updatedOwnerSubscriptionIds: string[]
  updatedMemberSubscriptionIds: string[]
  skippedAddonIds: string[]
  errors: Array<{ message: string; addonId?: string }>
}

export async function processExtraSeatPeriodEnd(
  options?: ExtraSeatProcessorOptions
): Promise<ExtraSeatProcessorResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  const now = options?.now ? new Date(options.now) : new Date()
  const nowIso = now.toISOString()
  const dryRun = options?.dryRun || false

  const result: ExtraSeatProcessorResult = {
    success: true,
    dryRun,
    mode: 'extra_seat_period_end',
    processedAddonIds: [],
    processedGroupIds: Set(),
    removedMemberEmails: [],
    updatedOwnerSubscriptionIds: [],
    updatedMemberSubscriptionIds: [],
    skippedAddonIds: [],
    errors: [],
  }

  try {
    // 1. Find extra-seat addons due for expiry
    let query = supabase
      .from('family_seat_addons')
      .select('id, family_group_id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)
      .not('current_period_end', 'is', null)
      .lte('current_period_end', nowIso)

    if (options?.familyGroupId) {
      query = query.eq('family_group_id', options.familyGroupId)
    }

    const { data: dueAddons, error: fetchError } = await query

    if (fetchError) {
      result.success = false
      result.errors.push({
        message: `Failed to fetch due extra-seat addons: ${fetchError.message}`,
      })
      return result
    }

    if (!dueAddons || dueAddons.length === 0) {
      console.log('[extra-seat-period-end] No due extra-seat addons found')
      return result
    }

    console.log(`[extra-seat-period-end] Found ${dueAddons.length} due extra-seat addons`)

    // 2. Process each addon
    for (const addon of dueAddons) {
      try {
        const groupId = addon.family_group_id
        const addonId = addon.id
        const quantityEnding = addon.quantity || 0

        // Find family group and owner
        const { data: group, error: groupError } = await supabase
          .from('family_groups')
          .select('id, owner_user_id')
          .eq('id', groupId)
          .single()

        if (groupError || !group) {
          result.errors.push({
            message: `Family group not found for addon ${addonId}`,
            addonId,
          })
          result.skippedAddonIds.push(addonId)
          continue
        }

        const ownerId = group.owner_user_id

        // In dry-run mode, just collect data
        if (dryRun) {
          // Find extra members that would be removed
          const { data: extraMembers } = await supabase
            .from('family_members')
            .select('id, user_id, email')
            .eq('family_group_id', groupId)
            .eq('seat_type', 'extra')
            .eq('status', 'active')
            .limit(quantityEnding)

          if (extraMembers && extraMembers.length > 0) {
            result.removedMemberEmails.push(
              ...extraMembers.map(m => m.email).filter(Boolean)
            )
          }

          result.processedAddonIds.push(addonId)
          result.processedGroupIds.add(groupId)
          continue
        }

        // ACTUAL APPLY: Mark addon as cancelled
        const { error: updateAddonError } = await supabase
          .from('family_seat_addons')
          .update({
            status: 'cancelled',
            cancel_at_period_end: false,
            updated_at: nowIso,
          })
          .eq('id', addonId)

        if (updateAddonError) {
          result.errors.push({
            message: `Failed to mark addon as cancelled: ${updateAddonError.message}`,
            addonId,
          })
          result.skippedAddonIds.push(addonId)
          continue
        }

        // Find and remove extra members occupying these seats
        const { data: extraMembers, error: membersError } = await supabase
          .from('family_members')
          .select('id, user_id, email')
          .eq('family_group_id', groupId)
          .eq('seat_type', 'extra')
          .eq('status', 'active')
          .limit(quantityEnding)

        if (membersError) {
          result.errors.push({
            message: `Failed to fetch extra members: ${membersError.message}`,
            addonId,
          })
          continue
        }

        if (extraMembers && extraMembers.length > 0) {
          // Mark members as removed
          const { error: removeError } = await supabase
            .from('family_members')
            .update({
              status: 'removed',
              removed_at: nowIso,
              removal_reason: 'extra_seat_cancelled',
              updated_at: nowIso,
            })
            .in('id', extraMembers.map(m => m.id))

          if (removeError) {
            result.errors.push({
              message: `Failed to remove members: ${removeError.message}`,
              addonId,
            })
            continue
          }

          result.removedMemberEmails.push(
            ...extraMembers.map(m => m.email).filter(Boolean)
          )

          // For each removed member, archive their covered-by-family subscription
          for (const member of extraMembers) {
            const { data: memberSubs } = await supabase
              .from('subscriptions')
              .select('id')
              .eq('user_id', member.user_id)
              .eq('managed_plan', 'family')
              .eq('family_group_id', groupId)
              .eq('is_system_managed', true)

            if (memberSubs && memberSubs.length > 0) {
              const { error: archiveError } = await supabase
                .from('subscriptions')
                .update({
                  status: 'archived',
                  updated_at: nowIso,
                })
                .in('id', memberSubs.map(s => s.id))

              if (!archiveError) {
                result.updatedMemberSubscriptionIds.push(...memberSubs.map(s => s.id))
              }
            }
          }
        }

        // Update owner's Family subscription to sync new seat count
        const { data: remainingAddons } = await supabase
          .from('family_seat_addons')
          .select('quantity')
          .eq('family_group_id', groupId)
          .eq('status', 'active')

        const totalRemainingSeats = remainingAddons?.reduce((sum, a) => sum + (a.quantity || 0), 0) || 0

        const { data: ownerFamilySub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', ownerId)
          .eq('managed_plan', 'family')
          .eq('family_group_id', groupId)
          .eq('is_system_managed', true)
          .single()

        if (ownerFamilySub) {
          const { error: syncError } = await supabase
            .from('subscriptions')
            .update({
              system_metadata: {
                extra_seats: totalRemainingSeats,
              },
              updated_at: nowIso,
            })
            .eq('id', ownerFamilySub.id)

          if (!syncError) {
            result.updatedOwnerSubscriptionIds.push(ownerFamilySub.id)
          }
        }

        result.processedAddonIds.push(addonId)
        result.processedGroupIds.add(groupId)
        console.log(`[extra-seat-period-end] Processed addon ${addonId} for group ${groupId}`)
      } catch (err) {
        result.errors.push({
          message: `Unexpected error processing addon: ${err instanceof Error ? err.message : String(err)}`,
          addonId: addon.id,
        })
        result.success = false
      }
    }

    // Convert Set to array for response
    result.processedGroupIds = Array.from(result.processedGroupIds)
    result.success = result.errors.length === 0
    return result
  } catch (error) {
    console.error('[extra-seat-period-end] Unexpected error:', error)
    result.success = false
    result.errors.push({
      message: `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
    })
    return result
  }
}
