/**
 * F10: Family Lifecycle Processor
 * 
 * Handles safe enforcement of scheduled Family lifecycle actions (cancellation, downgrade)
 * when the billing period ends. This processor:
 * 
 * 1. Finds due Family groups with scheduled actions at period end
 * 2. Applies cancellation (all members removed, group cancelled) or
 *    downgrade-to-pro (members removed, owner gets Pro)
 * 3. Handles independent paid plan protection (members with own Pro keep it)
 * 4. Remains idempotent - can be run multiple times safely
 */

import { createClient } from '@supabase/supabase-js'

interface LifecycleProcessorOptions {
  familyGroupId?: string
  now?: string | Date
  dryRun?: boolean
}

interface ProcessorResult {
  success: boolean
  processedGroupIds: string[]
  cancelledGroupIds: string[]
  downgradedGroupIds: string[]
  skippedGroupIds: string[]
  errors: Array<{ familyGroupId?: string; message: string }>
}

/**
 * Apply due Family lifecycle actions (cancellation, downgrade)
 * 
 * Usage in tests/QA:
 * - Call POST /api/family/lifecycle/apply-scheduled with familyGroupId
 * - Or use this directly in cron/admin context
 */
export async function applyDueFamilyLifecycleActions(
  options?: LifecycleProcessorOptions
): Promise<ProcessorResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  const now = options?.now ? new Date(options.now) : new Date()
  const nowIso = now.toISOString()
  const dryRun = options?.dryRun || false

  const result: ProcessorResult = {
    success: true,
    processedGroupIds: [],
    cancelledGroupIds: [],
    downgradedGroupIds: [],
    skippedGroupIds: [],
    errors: [],
  }

  try {
    // 1. Find due family groups
    const query = supabase
      .from('family_groups')
      .select('id, owner_user_id, status, scheduled_action, current_period_end')
      .in('status', ['active', 'past_due'])
      .in('scheduled_action', ['cancel_at_period_end', 'downgrade_to_pro_at_period_end'])
      .not('current_period_end', 'is', null)
      .lte('current_period_end', nowIso)

    if (options?.familyGroupId) {
      query.eq('id', options.familyGroupId)
    }

    const { data: dueGroups, error: fetchError } = await query

    if (fetchError) {
      result.success = false
      result.errors.push({
        message: `Failed to fetch due family groups: ${fetchError.message}`,
      })
      return result
    }

    if (!dueGroups || dueGroups.length === 0) {
      console.log('[family-lifecycle] No due family groups found')
      return result
    }

    console.log(`[family-lifecycle] Found ${dueGroups.length} due family groups to process`)

    // 2. Process each group
    for (const group of dueGroups) {
      try {
        if (group.scheduled_action === 'cancel_at_period_end') {
          const verified = await processGroupCancellation(supabase, group, nowIso, dryRun)
          if (verified) {
            result.cancelledGroupIds.push(group.id)
            result.processedGroupIds.push(group.id)
          } else {
            result.skippedGroupIds.push(group.id)
          }
        } else if (group.scheduled_action === 'downgrade_to_pro_at_period_end') {
          const verified = await processGroupDowngrade(supabase, group, nowIso, dryRun)
          if (verified) {
            result.downgradedGroupIds.push(group.id)
            result.processedGroupIds.push(group.id)
          } else {
            result.skippedGroupIds.push(group.id)
          }
        }
      } catch (error) {
        result.success = false
        result.errors.push({
          familyGroupId: group.id,
          message: error instanceof Error ? error.message : String(error),
        })
        console.error(
          `[family-lifecycle] Error processing group ${group.id}:`,
          error
        )
      }
    }

    return result
  } catch (error) {
    result.success = false
    result.errors.push({
      message: error instanceof Error ? error.message : String(error),
    })
    console.error('[family-lifecycle] Unexpected error:', error)
    return result
  }
}

/**
 * Process Family cancellation at period end
 * Returns true only if verification passed
 */
async function processGroupCancellation(
  supabase: any,
  group: any,
  nowIso: string,
  dryRun: boolean
): Promise<boolean> {
  const groupId = group.id
  const ownerId = group.owner_user_id

  console.log(
    `[family-lifecycle] ${dryRun ? '[DRY-RUN] ' : ''}Processing cancellation for group ${groupId}`
  )

  // Fetch active members and pending invites
  const { data: members } = await supabase
    .from('family_members')
    .select('id, user_id, role')
    .eq('family_group_id', groupId)
    .eq('status', 'active')

  const { data: invites } = await supabase
    .from('family_invites')
    .select('id')
    .eq('family_group_id', groupId)
    .eq('status', 'pending')

  const { data: managedSubs } = await supabase
    .from('subscriptions')
    .select('id, user_id, managed_plan')
    .eq('family_group_id', groupId)
    .eq('is_system_managed', true)
    .eq('system_source', 'renewly_billing')
    .in('status', ['active', 'past_due'])

  if (!dryRun) {
    // 1. Cancel family group
    const { error: groupError } = await supabase
      .from('family_groups')
      .update({
        status: 'cancelled',
        scheduled_action: null,
        scheduled_action_reason: null,
        scheduled_action_created_at: null,
        scheduled_action_effective_at: null,
        scheduled_action_at: null,
        updated_at: nowIso,
      })
      .eq('id', groupId)

    if (groupError) {
      console.error(`[family-lifecycle] Failed to cancel group ${groupId}:`, groupError)
      return false
    }

    // 2. Verify the update worked
    const { data: verifyGroup, error: verifyError } = await supabase
      .from('family_groups')
      .select('id, status, scheduled_action')
      .eq('id', groupId)
      .maybeSingle()

    if (verifyError || !verifyGroup || verifyGroup.status !== 'cancelled' || verifyGroup.scheduled_action !== null) {
      console.error(
        `[family-lifecycle] Verification failed for cancelled group ${groupId}:`,
        verifyGroup
      )
      return false
    }

    // 3. Remove active members
    if (members && members.length > 0) {
      const { error: memberError } = await supabase
        .from('family_members')
        .update({
          status: 'removed',
          removed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('family_group_id', groupId)
        .eq('status', 'active')

      if (memberError) {
        console.warn(`[family-lifecycle] Failed to remove members from group ${groupId}:`, memberError)
      }
    }

    // 4. Cancel pending invites
    if (invites && invites.length > 0) {
      const { error: inviteError } = await supabase
        .from('family_invites')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          updated_at: nowIso,
        })
        .eq('family_group_id', groupId)
        .eq('status', 'pending')

      if (inviteError) {
        console.warn(`[family-lifecycle] Failed to cancel invites for group ${groupId}:`, inviteError)
      }
    }

    // 5. Cancel managed Renewly Family subscriptions
    if (managedSubs && managedSubs.length > 0) {
      for (const sub of managedSubs) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: nowIso,
          })
          .eq('id', sub.id)

        if (subError) {
          console.warn(`[family-lifecycle] Failed to cancel subscription ${sub.id}:`, subError)
        }
      }
    }

    // 6. Set owner and members to Free (protecting independent paid plans)
    const memberIds = members ? members.map((m: any) => m.user_id) : []
    const allUserIds = [ownerId, ...memberIds]

    for (const userId of allUserIds) {
      await setUserPlanToFreeIfNotIndependentPaid(supabase, userId, nowIso)
    }
  }

  console.log(
    `[family-lifecycle] ${dryRun ? '[DRY-RUN] ' : ''}Cancelled group ${groupId}, removed ${members?.length || 0} members`
  )
  return true
}

/**
 * Process Family downgrade to Pro at period end
 * Returns true only if verification passed
 */
async function processGroupDowngrade(
  supabase: any,
  group: any,
  nowIso: string,
  dryRun: boolean
): Promise<boolean> {
  const groupId = group.id
  const ownerId = group.owner_user_id

  console.log(
    `[family-lifecycle] ${dryRun ? '[DRY-RUN] ' : ''}Processing downgrade to Pro for group ${groupId}`
  )

  // Fetch active members and pending invites
  const { data: members } = await supabase
    .from('family_members')
    .select('id, user_id, role')
    .eq('family_group_id', groupId)
    .eq('status', 'active')

  const { data: invites } = await supabase
    .from('family_invites')
    .select('id')
    .eq('family_group_id', groupId)
    .eq('status', 'pending')

  const { data: managedSubs } = await supabase
    .from('subscriptions')
    .select('id, user_id, managed_plan')
    .eq('family_group_id', groupId)
    .eq('is_system_managed', true)
    .eq('system_source', 'renewly_billing')
    .in('status', ['active', 'past_due'])

  if (!dryRun) {
    // 1. Cancel family group
    const { error: groupError } = await supabase
      .from('family_groups')
      .update({
        status: 'cancelled',
        scheduled_action: null,
        scheduled_action_reason: null,
        scheduled_action_created_at: null,
        scheduled_action_effective_at: null,
        scheduled_action_at: null,
        updated_at: nowIso,
      })
      .eq('id', groupId)

    if (groupError) {
      console.error(`[family-lifecycle] Failed to cancel group ${groupId}:`, groupError)
      return false
    }

    // 2. Verify the update worked
    const { data: verifyGroup, error: verifyError } = await supabase
      .from('family_groups')
      .select('id, status, scheduled_action')
      .eq('id', groupId)
      .maybeSingle()

    if (verifyError || !verifyGroup || verifyGroup.status !== 'cancelled' || verifyGroup.scheduled_action !== null) {
      console.error(
        `[family-lifecycle] Verification failed for downgraded group ${groupId}:`,
        verifyGroup
      )
      return false
    }

    // 3. Remove active members
    if (members && members.length > 0) {
      const { error: memberError } = await supabase
        .from('family_members')
        .update({
          status: 'removed',
          removed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('family_group_id', groupId)
        .eq('status', 'active')

      if (memberError) {
        console.warn(`[family-lifecycle] Failed to remove members from group ${groupId}:`, memberError)
      }
    }

    // 4. Cancel pending invites
    if (invites && invites.length > 0) {
      const { error: inviteError } = await supabase
        .from('family_invites')
        .update({
          status: 'cancelled',
          cancelled_at: nowIso,
          updated_at: nowIso,
        })
        .eq('family_group_id', groupId)
        .eq('status', 'pending')

      if (inviteError) {
        console.warn(`[family-lifecycle] Failed to cancel invites for group ${groupId}:`, inviteError)
      }
    }

    // 5. Cancel managed Family subscriptions for all users
    if (managedSubs && managedSubs.length > 0) {
      for (const sub of managedSubs) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: nowIso,
          })
          .eq('id', sub.id)

        if (subError) {
          console.warn(`[family-lifecycle] Failed to cancel subscription ${sub.id}:`, subError)
        }
      }
    }

    // 6. Set members to Free (protecting independent paid plans)
    const memberIds = members ? members.map((m: any) => m.user_id) : []
    for (const userId of memberIds) {
      await setUserPlanToFreeIfNotIndependentPaid(supabase, userId, nowIso)
    }

    // 7. Create Pro managed subscription for owner
    // First try to reuse existing Pro subscription if owner already has one
    const { data: existingProSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', ownerId)
      .eq('is_system_managed', true)
      .eq('managed_plan', 'pro')
      .eq('status', 'active')
      .maybeSingle()

    if (!existingProSub) {
      // Create new Pro managed subscription for owner
      const { error: proSubError } = await supabase.from('subscriptions').insert({
        user_id: ownerId,
        is_system_managed: true,
        system_source: 'renewly_billing',
        managed_plan: 'pro',
        status: 'active',
        created_at: nowIso,
        updated_at: nowIso,
      })

      if (proSubError) {
        console.warn(
          `[family-lifecycle] Failed to create Pro subscription for owner ${ownerId}:`,
          proSubError
        )
      } else {
        console.log(
          `[family-lifecycle] Created Pro managed subscription for owner ${ownerId}`
        )
      }
    }

    // 8. Set owner to Pro
    const { error: ownerError } = await supabase
      .from('profiles')
      .update({
        plan: 'pro',
        updated_at: nowIso,
      })
      .eq('id', ownerId)

    if (ownerError) {
      console.warn(`[family-lifecycle] Failed to set owner ${ownerId} to Pro:`, ownerError)
    }
  }

  console.log(
    `[family-lifecycle] ${dryRun ? '[DRY-RUN] ' : ''}Downgraded group ${groupId} to owner Pro, removed ${members?.length || 0} members`
  )
  return true
}

/**
 * Set user plan to Free, but protect if user has independent paid plan
 */
async function setUserPlanToFreeIfNotIndependentPaid(
  supabase: any,
  userId: string,
  nowIso: string
) {
  // Check if user has independent Pro/Enterprise
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  // If already Pro or Enterprise, keep it
  if (userProfile?.plan === 'pro' || userProfile?.plan === 'enterprise') {
    console.log(
      `[family-lifecycle] Protecting user ${userId} - already has plan: ${userProfile.plan}`
    )
    return
  }

  // Check if user has independent active managed Pro subscription
  const { data: independentSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_system_managed', true)
    .eq('managed_plan', 'pro')
    .eq('status', 'active')
    .eq('covered_by_family', false)
    .maybeSingle()

  if (independentSub) {
    console.log(
      `[family-lifecycle] Protecting user ${userId} - has independent Pro subscription`
    )
    return
  }

  // Set to Free
  await supabase
    .from('profiles')
    .update({
      plan: 'free',
      updated_at: nowIso,
    })
    .eq('id', userId)

  console.log(`[family-lifecycle] Set user ${userId} plan to Free`)
}
