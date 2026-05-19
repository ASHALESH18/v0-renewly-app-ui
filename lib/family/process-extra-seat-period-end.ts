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
  staleRemovedMemberEmails: string[]
  updatedOwnerSubscriptionIds: string[]
  updatedMemberSubscriptionIds: string[]
  archivedMemberSubscriptionIds: string[]
  profilePlansUpdated: string[]
  targetOwnerAmount?: number
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
    processedGroupIds: [],
    removedMemberEmails: [],
    staleRemovedMemberEmails: [],
    updatedOwnerSubscriptionIds: [],
    updatedMemberSubscriptionIds: [],
    archivedMemberSubscriptionIds: [],
    profilePlansUpdated: [],
    skippedAddonIds: [],
    errors: [],
  }

  // Track unique group IDs separately since we need to convert to array at end
  const processedGroupIdSet = new Set<string>()

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
          processedGroupIdSet.add(groupId)
          continue
        }

        // ACTUAL APPLY: Step 1 - Find extra members occupying these seats BEFORE marking addon cancelled
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
          result.skippedAddonIds.push(addonId)
          continue
        }

        // Step 2 - Remove extra members using only schema-stable fields (status, removed_at)
        // F7.3R3: Part A - Remove removed_reason/removal_reason dependency, Part B - Fix mutation order
        if (extraMembers && extraMembers.length > 0) {
          const { error: removeError } = await supabase
            .from('family_members')
            .update({
              status: 'removed',
              removed_at: nowIso,
              updated_at: nowIso,
            })
            .in('id', extraMembers.map(m => m.id))

          if (removeError) {
            result.errors.push({
              message: `Failed to remove members: ${removeError.message}`,
              addonId,
            })
            result.skippedAddonIds.push(addonId)
            continue
          }

          result.removedMemberEmails.push(
            ...extraMembers.map(m => m.email).filter(Boolean)
          )

          // Step 3 - Archive removed members' covered-by-family subscriptions.
          // Use a broad user + group lookup and filter in JS so stale flag mismatches do not block cleanup.
          for (const member of extraMembers) {
            const { data: memberSubs, error: memberSubsError } = await supabase
              .from('subscriptions')
              .select('id, status, amount, covered_by_family, is_system_managed, managed_plan, managed_subscription_key, system_metadata')
              .eq('user_id', member.user_id)
              .eq('family_group_id', groupId)

            if (memberSubsError) {
              result.errors.push({
                message: `Failed to fetch member subscriptions for ${member.email || member.user_id}: ${memberSubsError.message}`,
                addonId,
              })
              continue
            }

            const coveredSubs = (memberSubs || []).filter((sub) => {
              const managedKey = String(sub.managed_subscription_key || '')
              return (
                sub.status === 'active' &&
                sub.is_system_managed === true &&
                sub.managed_plan === 'family' &&
                (
                  sub.covered_by_family === true ||
                  Number(sub.amount || 0) === 0 ||
                  managedKey.startsWith(`renewly:family:member:${groupId}:`)
                )
              )
            })

            for (const sub of coveredSubs) {
              const existingMetadata = (sub.system_metadata || {}) as Record<string, unknown>
              const { error: archiveError } = await supabase
                .from('subscriptions')
                .update({
                  status: 'cancelled',
                  covered_by_family: false,
                  system_metadata: {
                    ...existingMetadata,
                    access_ended_at: nowIso,
                    access_ended_reason: 'extra_seat_period_end',
                  },
                  updated_at: nowIso,
                })
                .eq('id', sub.id)

              if (!archiveError) {
                result.archivedMemberSubscriptionIds.push(sub.id)
                result.updatedMemberSubscriptionIds.push(sub.id)
              } else {
                result.errors.push({
                  message: `Failed to archive member subscription ${sub.id}: ${archiveError.message}`,
                  addonId,
                })
              }
            }
          }
        }

        // Step 4a - Post-sync removed extra members' profiles.
        if (extraMembers && extraMembers.length > 0) {
          for (const member of extraMembers) {
            const { data: allActiveSubs, error: activeSubsError } = await supabase
              .from('subscriptions')
              .select('id, amount, covered_by_family, managed_plan, family_group_id')
              .eq('user_id', member.user_id)
              .eq('status', 'active')

            if (activeSubsError) {
              result.errors.push({
                message: `Failed to check active paid plans for ${member.email || member.user_id}: ${activeSubsError.message}`,
                addonId,
              })
              continue
            }

            const hasOwnActivePaidPlan = (allActiveSubs || []).some((sub) => {
              const isTargetCoveredFamily =
                sub.managed_plan === 'family' && sub.family_group_id === groupId
              return (
                !isTargetCoveredFamily &&
                sub.covered_by_family !== true &&
                Number(sub.amount || 0) > 0
              )
            })

            const { data: activeFamilyMembers, error: activeFamilyError } = await supabase
              .from('family_members')
              .select('id')
              .eq('user_id', member.user_id)
              .eq('status', 'active')
              .limit(1)

            if (activeFamilyError) {
              result.errors.push({
                message: `Failed to check active memberships for ${member.email || member.user_id}: ${activeFamilyError.message}`,
                addonId,
              })
              continue
            }

            if (!hasOwnActivePaidPlan && !(activeFamilyMembers && activeFamilyMembers.length > 0)) {
              const { error: profileError } = await supabase
                .from('profiles')
                .update({ plan: 'free', updated_at: nowIso })
                .eq('id', member.user_id)

              if (!profileError) {
                result.profilePlansUpdated.push(member.email || member.user_id)
              } else {
                result.errors.push({
                  message: `Failed to update profile for ${member.email || member.user_id}: ${profileError.message}`,
                  addonId,
                })
              }
            }
          }
        }

        // Step 4b - Recalculate owner subscription excluding the add-on currently ending.
        // The ending add-on is still status='active' until Step 5, so it must be excluded here.
        const { data: remainingAddons, error: remainingAddonsError } = await supabase
          .from('family_seat_addons')
          .select('id, quantity')
          .eq('family_group_id', groupId)
          .eq('status', 'active')
          .neq('id', addonId)

        if (remainingAddonsError) {
          result.errors.push({
            message: `Failed to fetch remaining add-ons: ${remainingAddonsError.message}`,
            addonId,
          })
          result.skippedAddonIds.push(addonId)
          continue
        }

        const totalRemainingSeats = (remainingAddons || []).reduce(
          (sum, remainingAddon) => sum + Number(remainingAddon.quantity || 0),
          0
        )
        const baseAmount = 299
        const extraSeatAmount = totalRemainingSeats * 99
        const totalAmount = baseAmount + extraSeatAmount

        const { data: ownerFamilySubs, error: ownerSubError } = await supabase
          .from('subscriptions')
          .select('id, amount, covered_by_family, system_metadata, updated_at')
          .eq('user_id', ownerId)
          .eq('managed_plan', 'family')
          .eq('family_group_id', groupId)
          .eq('is_system_managed', true)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })

        if (ownerSubError) {
          result.errors.push({
            message: `Failed to fetch owner subscription: ${ownerSubError.message}`,
            addonId,
          })
          result.skippedAddonIds.push(addonId)
          continue
        }

        const ownerFamilySub = (ownerFamilySubs || []).find((sub) => sub.covered_by_family !== true)
          || (ownerFamilySubs || [])[0]

        if (ownerFamilySub) {
          const existingMetadata = (ownerFamilySub.system_metadata || {}) as Record<string, unknown>
          const { error: amountError } = await supabase
            .from('subscriptions')
            .update({
              amount: totalAmount,
              system_metadata: {
                ...existingMetadata,
                base_amount: baseAmount,
                extra_seats: totalRemainingSeats,
                extra_amount: extraSeatAmount,
                current_monthly_total: totalAmount,
                next_cycle_monthly_total: totalAmount,
                has_scheduled_extra_seat_cancellation: false,
                scheduled_cancel_extra_seats: 0,
              },
              updated_at: nowIso,
            })
            .eq('id', ownerFamilySub.id)

          if (!amountError) {
            result.updatedOwnerSubscriptionIds.push(ownerFamilySub.id)
          } else {
            result.errors.push({
              message: `Failed to update owner subscription amount: ${amountError.message}`,
              addonId,
            })
          }
        }

        // Step 5 - Only AFTER successful member removal, sync owner subscription, mark addon as cancelled
        // F7.3R3: Part B - Only mark addon cancelled AFTER all other operations succeed
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

        result.processedAddonIds.push(addonId)
        processedGroupIdSet.add(groupId)
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
    result.processedGroupIds = Array.from(processedGroupIdSet)
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

/**
 * F7.3R4: Repair mode for extra-seat period-end
 * 
 * Repairs partially-applied state where addon is already cancelled and member removed,
 * but profiles and subscriptions are stale/out-of-sync.
 */
export async function processExtraSeatPeriodEndRepair(
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
  const targetFamilyGroupId = options?.familyGroupId

  const result: ExtraSeatProcessorResult = {
    success: true,
    dryRun,
    mode: 'extra_seat_period_end_repair',
    processedAddonIds: [],
    processedGroupIds: [],
    removedMemberEmails: [],
    staleRemovedMemberEmails: [],
    updatedOwnerSubscriptionIds: [],
    updatedMemberSubscriptionIds: [],
    archivedMemberSubscriptionIds: [],
    profilePlansUpdated: [],
    skippedAddonIds: [],
    errors: [],
  }

  if (!targetFamilyGroupId) {
    result.errors.push({ message: 'familyGroupId required for repair mode' })
    result.success = false
    return result
  }

  try {
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id')
      .eq('id', targetFamilyGroupId)
      .single()

    if (groupError || !group) {
      result.errors.push({
        message: `Family group not found: ${targetFamilyGroupId}${groupError ? ` (${groupError.message})` : ''}`,
      })
      result.success = false
      return result
    }

    const ownerId = group.owner_user_id

    const { data: removedMembers, error: removedMembersError } = await supabase
      .from('family_members')
      .select('id, user_id, email')
      .eq('family_group_id', targetFamilyGroupId)
      .eq('role', 'member')
      .eq('seat_type', 'extra')
      .eq('status', 'removed')

    if (removedMembersError) {
      result.errors.push({
        message: `Failed to fetch removed extra members: ${removedMembersError.message}`,
      })
      result.success = false
      return result
    }

    const membersByUserId = new Map<string, { id: string; user_id: string; email: string }>()
    for (const member of removedMembers || []) {
      if (member.user_id && !membersByUserId.has(member.user_id)) {
        membersByUserId.set(member.user_id, member)
      }
    }

    const deduplicatedMembers = Array.from(membersByUserId.values())
    result.staleRemovedMemberEmails = deduplicatedMembers
      .map((member) => member.email)
      .filter(Boolean)

    const memberSubsToArchive: Array<{ subId: string; existingMetadata: Record<string, unknown> }> = []
    const profilesNeedingUpdate: Array<{ userId: string; email: string }> = []

    for (const member of deduplicatedMembers) {
      // Use a broad user + family group query and filter in JS. This avoids missing stale rows
      // when one DB flag is out of sync, while still limiting repair to the target group/user.
      const { data: memberSubs, error: memberSubsError } = await supabase
        .from('subscriptions')
        .select('id, status, amount, covered_by_family, is_system_managed, managed_plan, managed_subscription_key, family_group_id, system_metadata')
        .eq('user_id', member.user_id)
        .eq('family_group_id', targetFamilyGroupId)

      if (memberSubsError) {
        result.errors.push({
          message: `Failed to fetch covered subscriptions for ${member.email}: ${memberSubsError.message}`,
        })
        continue
      }

      const coveredSubs = (memberSubs || []).filter((sub) => {
        const managedKey = String(sub.managed_subscription_key || '')
        return (
          sub.status === 'active' &&
          sub.is_system_managed === true &&
          sub.managed_plan === 'family' &&
          (
            sub.covered_by_family === true ||
            Number(sub.amount || 0) === 0 ||
            managedKey.startsWith(`renewly:family:member:${targetFamilyGroupId}:`)
          )
        )
      })

      for (const sub of coveredSubs) {
        memberSubsToArchive.push({
          subId: sub.id,
          existingMetadata: (sub.system_metadata || {}) as Record<string, unknown>,
        })
        result.archivedMemberSubscriptionIds.push(sub.id)
      }

      const { data: allActiveSubs, error: activeSubsError } = await supabase
        .from('subscriptions')
        .select('id, amount, status, covered_by_family, managed_plan, family_group_id')
        .eq('user_id', member.user_id)
        .eq('status', 'active')

      if (activeSubsError) {
        result.errors.push({
          message: `Failed to check active paid plans for ${member.email}: ${activeSubsError.message}`,
        })
        continue
      }

      const hasOwnActivePaidPlan = (allActiveSubs || []).some((sub) => {
        const isTargetCoveredFamily =
          sub.managed_plan === 'family' && sub.family_group_id === targetFamilyGroupId
        return (
          !isTargetCoveredFamily &&
          sub.covered_by_family !== true &&
          Number(sub.amount || 0) > 0
        )
      })

      const { data: activeFamilyMembers, error: activeFamilyError } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', member.user_id)
        .eq('status', 'active')
        .limit(1)

      if (activeFamilyError) {
        result.errors.push({
          message: `Failed to check active memberships for ${member.email}: ${activeFamilyError.message}`,
        })
        continue
      }

      if (!hasOwnActivePaidPlan && !(activeFamilyMembers && activeFamilyMembers.length > 0)) {
        profilesNeedingUpdate.push({ userId: member.user_id, email: member.email })
        result.profilePlansUpdated.push(member.email)
      }
    }

    const { data: activeAddons, error: addonsError } = await supabase
      .from('family_seat_addons')
      .select('quantity')
      .eq('family_group_id', targetFamilyGroupId)
      .eq('status', 'active')

    if (addonsError) {
      result.errors.push({ message: `Failed to fetch active add-ons: ${addonsError.message}` })
    }

    const totalRemainingSeats = (activeAddons || []).reduce(
      (sum, addon) => sum + Number(addon.quantity || 0),
      0
    )
    const baseAmount = 299
    const extraSeatAmount = totalRemainingSeats * 99
    const targetOwnerAmount = baseAmount + extraSeatAmount
    result.targetOwnerAmount = targetOwnerAmount

    const { data: ownerSubs, error: ownerSubsError } = await supabase
      .from('subscriptions')
      .select('id, amount, status, covered_by_family, is_system_managed, managed_plan, managed_subscription_key, family_group_id, system_metadata, updated_at')
      .eq('user_id', ownerId)
      .eq('family_group_id', targetFamilyGroupId)
      .eq('status', 'active')
      .eq('is_system_managed', true)
      .eq('managed_plan', 'family')
      .order('updated_at', { ascending: false })

    if (ownerSubsError) {
      result.errors.push({ message: `Failed to fetch owner subscription: ${ownerSubsError.message}` })
    }

    const ownerFamilySub = (ownerSubs || []).find((sub) => sub.covered_by_family !== true)
      || (ownerSubs || [])[0]

    if (ownerFamilySub && Number(ownerFamilySub.amount || 0) !== targetOwnerAmount) {
      result.updatedOwnerSubscriptionIds.push(ownerFamilySub.id)
    }

    if (!dryRun) {
      for (const { subId, existingMetadata } of memberSubsToArchive) {
        const { error: archiveError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            covered_by_family: false,
            system_metadata: {
              ...existingMetadata,
              access_ended_at: nowIso,
              access_ended_reason: 'extra_seat_period_end',
            },
            updated_at: nowIso,
          })
          .eq('id', subId)

        if (archiveError) {
          result.errors.push({
            message: `Failed to archive subscription ${subId}: ${archiveError.message}`,
          })
        }
      }

      for (const { userId, email } of profilesNeedingUpdate) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ plan: 'free', updated_at: nowIso })
          .eq('id', userId)

        if (profileError) {
          result.errors.push({
            message: `Failed to update profile for ${email}: ${profileError.message}`,
          })
        }
      }

      if (ownerFamilySub && Number(ownerFamilySub.amount || 0) !== targetOwnerAmount) {
        const existingMetadata = (ownerFamilySub.system_metadata || {}) as Record<string, unknown>
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            amount: targetOwnerAmount,
            system_metadata: {
              ...existingMetadata,
              base_amount: baseAmount,
              extra_seats: totalRemainingSeats,
              extra_amount: extraSeatAmount,
              current_monthly_total: targetOwnerAmount,
              next_cycle_monthly_total: targetOwnerAmount,
              has_scheduled_extra_seat_cancellation: false,
              scheduled_cancel_extra_seats: 0,
            },
            updated_at: nowIso,
          })
          .eq('id', ownerFamilySub.id)

        if (updateError) {
          result.errors.push({
            message: `Failed to update owner subscription: ${updateError.message}`,
          })
        }
      }
    }

    result.processedGroupIds.push(targetFamilyGroupId)
    result.success = result.errors.length === 0
    return result
  } catch (error) {
    console.error('[extra-seat-period-end-repair] Unexpected error:', error)
    result.success = false
    result.errors.push({
      message: `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
    })
    return result
  }
}
