'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyFamilyOwnerSubscription } from '@/lib/billing/renewly-subscription-sync'
import { invalidateCache } from '@/lib/redis'
import { revalidateTag } from 'next/cache'
import { notifyExtraSeatCancellationReversed } from '@/lib/notifications/family-event-notifications'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])
}

/**
 * POST /api/family/extra-seat/undo-cancel
 * F7.2D-R: Owner reverses a previously scheduled extra-seat cancellation.
 *
 * Only works while the addon is still active (cancel_at_period_end=true and
 * current_period_end is in the future). Sets cancel_at_period_end=false on
 * matching addons and triggers a Renewly sync so billing metadata reflects
 * the kept seat.
 */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { familyGroupId, addonId } = body || {}

    if (!familyGroupId) {
      return NextResponse.json(
        { error: 'Invalid request: familyGroupId required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[extra-seat-undo-cancel] Missing Supabase env vars')
      return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify ownership
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, status, current_period_end')
      .eq('id', familyGroupId)
      .eq('owner_user_id', user.id)
      .eq('status', 'active')
      .single()

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found or not owned by user' },
        { status: 404 }
      )
    }

    // Find scheduled-cancel add-ons that are still active in the current cycle.
    let query = supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')
      .eq('cancel_at_period_end', true)

    if (addonId) {
      query = query.eq('id', addonId)
    }

    const { data: scheduledAddons, error: fetchError } = await query

    if (fetchError) {
      console.error('[extra-seat-undo-cancel] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch seat addons' }, { status: 500 })
    }

    if (!scheduledAddons || scheduledAddons.length === 0) {
      return NextResponse.json(
        { error: 'No scheduled cancellation found to undo' },
        { status: 409 }
      )
    }

    // Filter out any addons whose period has already ended (lifecycle should remove these).
    const now = Date.now()
    const restorable = scheduledAddons.filter(
      (a: any) => !a.current_period_end || new Date(a.current_period_end).getTime() > now
    )

    if (restorable.length === 0) {
      return NextResponse.json(
        { error: 'Scheduled cancellation has already taken effect' },
        { status: 409 }
      )
    }

    const idsToRestore = restorable.map((a: any) => a.id)

    const { error: updateError } = await supabase
      .from('family_seat_addons')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', idsToRestore)

    if (updateError) {
      console.error('[extra-seat-undo-cancel] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update seat addon' },
        { status: 500 }
      )
    }

    const { data: refreshedAddons = [] } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')

    let syncWarning: string | null = null
    try {
      await withTimeout(
        syncRenewlyFamilyOwnerSubscription({
          ownerUserId: user.id,
          familyGroupId,
          currentPeriodEnd: familyGroup.current_period_end,
          seatAddons: refreshedAddons || [],
        }),
        3500,
        'Renewly owner subscription resync'
      )
    } catch (syncError) {
      syncWarning = syncError instanceof Error ? syncError.message : 'Renewly subscription resync failed'
      console.warn('[extra-seat-undo-cancel] Renewly sync warning:', syncError)
    }

    try {
      await invalidateCache(`subscriptions:${user.id}`)
      revalidateTag(`subscriptions:${user.id}`, 'max')
      revalidateTag('billing', 'max')
    } catch (cacheError) {
      console.warn('[extra-seat-undo-cancel] Cache invalidation warning:', cacheError)
    }

    const restoredQuantity = restorable.reduce(
      (sum: number, a: any) => sum + (a.quantity || 0),
      0
    )

    console.log('[v0] F7.2D-R: Cancellation undone', {
      familyGroupId,
      restoredAddonIds: idsToRestore,
      restoredQuantity,
    })

    try {
      await notifyExtraSeatCancellationReversed(user.id, restoredQuantity, familyGroupId)
    } catch (notificationError) {
      console.warn('[extra-seat-undo-cancel] Notification warning:', notificationError)
    }

    return NextResponse.json(
      {
        message: 'Scheduled cancellation reversed',
        restoredQuantity,
        restoredAddonIds: idsToRestore,
        syncWarning,
        shouldRefreshSubscriptions: true,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[extra-seat-undo-cancel] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
