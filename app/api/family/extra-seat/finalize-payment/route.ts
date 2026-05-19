import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  generateInviteToken,
  hashInviteToken,
  buildFamilyInviteUrl,
  getInviteExpiryDate,
} from '@/lib/family/family-invite-utils'
import { sendFamilyInviteEmail } from '@/lib/email/family-invite-email'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import { FAMILY_EXTRA_MEMBER_PRICE_INR } from '@/lib/family/family-config'
import {
  checkTargetNotOwner,
  checkTargetNotActiveMember,
  checkNoPendingInvitesAcrossAll,
} from '@/lib/family/family-abuse-prevention'

type IntentMetadata = Record<string, any>

function addMonthsLikeBillingPeriod(date = new Date()) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + 1)
  return next
}

async function ensurePaidExtraSeatRecorded(params: {
  supabase: any
  familyGroupId: string
  intentId: string
  intentMetadata: IntentMetadata | null
  currentPeriodEnd?: string | null
}) {
  const { supabase, familyGroupId, intentId } = params
  const metadata = params.intentMetadata || {}

  if (metadata.extra_seat_recorded === true) {
    return { recorded: false, reason: 'already_recorded' }
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const periodEnd =
    params.currentPeriodEnd ||
    metadata.current_period_end ||
    addMonthsLikeBillingPeriod(now).toISOString()

  const { data: existingAddon, error: addonFetchError } = await supabase
    .from('family_seat_addons')
    .select('id, quantity')
    .eq('family_group_id', familyGroupId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (addonFetchError) {
    console.error('[finalize-payment] Failed to fetch seat addon:', addonFetchError)
    throw new Error('Failed to fetch extra-seat billing state')
  }

  let newPaidQuantity = 1

  if (existingAddon) {
    newPaidQuantity = Math.max(0, Number(existingAddon.quantity || 0)) + 1

    const { error: addonUpdateError } = await supabase
      .from('family_seat_addons')
      .update({
        quantity: newPaidQuantity,
        price_inr_per_seat: FAMILY_EXTRA_MEMBER_PRICE_INR,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
        updated_at: nowIso,
      })
      .eq('id', existingAddon.id)

    if (addonUpdateError) {
      console.error('[finalize-payment] Failed to update seat addon:', addonUpdateError)
      throw new Error('Failed to update extra-seat billing state')
    }
  } else {
    const { error: addonInsertError } = await supabase
      .from('family_seat_addons')
      .insert({
        family_group_id: familyGroupId,
        quantity: 1,
        price_inr_per_seat: FAMILY_EXTRA_MEMBER_PRICE_INR,
        status: 'active',
        current_period_start: nowIso,
        current_period_end: periodEnd,
        cancel_at_period_end: false,
      })

    if (addonInsertError) {
      console.error('[finalize-payment] Failed to create seat addon:', addonInsertError)
      throw new Error('Failed to record extra-seat billing state')
    }
  }

  const { data: activeAddons, error: activeAddonError } = await supabase
    .from('family_seat_addons')
    .select('quantity')
    .eq('family_group_id', familyGroupId)
    .eq('status', 'active')

  if (activeAddonError) {
    console.warn('[finalize-payment] Failed to recalc addon quantity:', activeAddonError)
  }

  const totalPaidSeats =
    activeAddons?.reduce((sum: number, addon: any) => sum + Math.max(0, Number(addon.quantity || 0)), 0) ??
    newPaidQuantity

  const { error: groupUpdateError } = await supabase
    .from('family_groups')
    .update({
      extra_seat_count: totalPaidSeats,
      current_period_end: periodEnd,
      updated_at: nowIso,
    })
    .eq('id', familyGroupId)

  if (groupUpdateError) {
    console.warn('[finalize-payment] Failed to update family group extra_seat_count:', groupUpdateError)
  }

  const { error: intentUpdateError } = await supabase
    .from('family_extra_seat_payment_intents')
    .update({
      metadata: {
        ...metadata,
        extra_seat_recorded: true,
        extra_seat_recorded_at: nowIso,
        extra_seat_quantity_after_recording: totalPaidSeats,
      },
      updated_at: nowIso,
    })
    .eq('id', intentId)

  if (intentUpdateError) {
    console.warn('[finalize-payment] Failed to mark intent seat recorded:', intentUpdateError)
  }

  return { recorded: true, totalPaidSeats }
}

/**
 * POST /api/family/extra-seat/finalize-payment
 *
 * F6C: create/send an extra-seat invite only after payment success.
 * F10: one payment intent can create only one invite.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { intentId } = await request.json()

    if (!intentId || typeof intentId !== 'string') {
      return NextResponse.json({ error: 'intentId is required' }, { status: 400 })
    }

    const entitlement = await resolveEffectiveEntitlement(user.id)
    if (!entitlement.isFamilyOwner) {
      return NextResponse.json({ error: 'Only Family owners can finalize payments' }, { status: 403 })
    }

    const { data: intent, error: intentError } = await supabase
      .from('family_extra_seat_payment_intents')
      .select('id, family_group_id, owner_user_id, invited_email, status, paid_at, qa_confirmed_at, expires_at, metadata')
      .eq('id', intentId)
      .maybeSingle()

    if (intentError) {
      console.error('[finalize-payment] Intent fetch error:', intentError)
      return NextResponse.json({ error: 'Failed to load payment intent' }, { status: 500 })
    }

    if (!intent) {
      return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
    }

    if (intent.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Cannot finalize another user's intent" }, { status: 403 })
    }

    if (intent.status !== 'qa_confirmed' && intent.status !== 'paid') {
      return NextResponse.json(
        { error: `Cannot finalize intent in status: ${intent.status}` },
        { status: 409 }
      )
    }

    if (new Date(intent.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Payment intent has expired' }, { status: 410 })
    }

    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, status, current_period_end, scheduled_action')
      .eq('id', intent.family_group_id)
      .maybeSingle()

    if (groupError) {
      console.error('[finalize-payment] Family group fetch error:', groupError)
      return NextResponse.json({ error: 'Failed to load family group' }, { status: 500 })
    }

    if (!familyGroup || familyGroup.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Family group not found' }, { status: 404 })
    }

    if (familyGroup.status !== 'active' && familyGroup.status !== 'past_due') {
      return NextResponse.json({ error: 'Family group is not active' }, { status: 409 })
    }

    if (familyGroup.scheduled_action === 'cancel_at_period_end' || familyGroup.scheduled_action === 'downgrade_to_pro_at_period_end') {
      return NextResponse.json(
        { error: 'Family plan changes are already scheduled. New invites are paused until the billing change is resolved.' },
        { status: 409 }
      )
    }

    // Strong idempotency: one intent -> one invite via family_invites.extra_seat_payment_intent_id.
    const { data: inviteByIntent, error: inviteByIntentError } = await supabase
      .from('family_invites')
      .select('id, invited_email, status')
      .eq('extra_seat_payment_intent_id', intent.id)
      .maybeSingle()

    if (inviteByIntentError) {
      console.error('[finalize-payment] Existing invite lookup error:', inviteByIntentError)
      return NextResponse.json({ error: 'Failed to check existing invite' }, { status: 500 })
    }

    if (inviteByIntent) {
      await ensurePaidExtraSeatRecorded({
        supabase,
        familyGroupId: familyGroup.id,
        intentId: intent.id,
        intentMetadata: intent.metadata,
        currentPeriodEnd: familyGroup.current_period_end,
      })

      return NextResponse.json({
        success: true,
        inviteId: inviteByIntent.id,
        emailSent: false,
        idempotent: true,
        message: 'Extra-seat invite already exists for this payment intent.',
      })
    }

    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .ilike('email', intent.invited_email)
      .eq('status', 'active')
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the family group' },
        { status: 409 }
      )
    }

    const notOwnerCheck = await checkTargetNotOwner(supabase, familyGroup.id, intent.invited_email)
    if (!notOwnerCheck.valid) {
      return NextResponse.json({ error: notOwnerCheck.error }, { status: 409 })
    }

    if (notOwnerCheck.targetUserId) {
      const targetNotActiveMemberCheck = await checkTargetNotActiveMember(
        supabase,
        familyGroup.id,
        notOwnerCheck.targetUserId
      )
      if (!targetNotActiveMemberCheck.valid) {
        return NextResponse.json({ error: targetNotActiveMemberCheck.error }, { status: 409 })
      }
    }

    const noPendingCheck = await checkNoPendingInvitesAcrossAll(supabase, intent.invited_email, familyGroup.id)
    if (!noPendingCheck.valid) {
      return NextResponse.json({ error: noPendingCheck.error }, { status: 409 })
    }

    const { data: duplicatePending } = await supabase
      .from('family_invites')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .ilike('invited_email', intent.invited_email)
      .eq('status', 'pending')
      .maybeSingle()

    if (duplicatePending) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email' },
        { status: 409 }
      )
    }

    const rawToken = generateInviteToken()
    const tokenHash = hashInviteToken(rawToken)
    const expiryDate = getInviteExpiryDate()

    const { data: newInvite, error: insertError } = await supabase
      .from('family_invites')
      .insert({
        family_group_id: familyGroup.id,
        invited_email: intent.invited_email,
        invited_by: user.id,
        token_hash: tokenHash,
        status: 'pending',
        seat_type: 'extra',
        expires_at: expiryDate.toISOString(),
        extra_seat_payment_intent_id: intent.id,
      })
      .select('id')
      .single()

    if (insertError || !newInvite) {
      // If unique index raced, return existing invite instead of creating another one.
      const { data: racedInvite } = await supabase
        .from('family_invites')
        .select('id')
        .eq('extra_seat_payment_intent_id', intent.id)
        .maybeSingle()

      if (racedInvite) {
        await ensurePaidExtraSeatRecorded({
          supabase,
          familyGroupId: familyGroup.id,
          intentId: intent.id,
          intentMetadata: intent.metadata,
          currentPeriodEnd: familyGroup.current_period_end,
        })

        return NextResponse.json({
          success: true,
          inviteId: racedInvite.id,
          emailSent: false,
          idempotent: true,
          message: 'Extra-seat invite already exists for this payment intent.',
        })
      }

      console.error('[finalize-payment] Invite insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    await ensurePaidExtraSeatRecorded({
      supabase,
      familyGroupId: familyGroup.id,
      intentId: intent.id,
      intentMetadata: intent.metadata,
      currentPeriodEnd: familyGroup.current_period_end,
    })

    if (intent.status === 'paid' && !intent.paid_at) {
      const { error: paidAtError } = await supabase
        .from('family_extra_seat_payment_intents')
        .update({ paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', intent.id)

      if (paidAtError) {
        console.warn('[finalize-payment] Failed to set paid_at:', paidAtError)
      }
    }

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const requestOrigin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      undefined

    const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

    const emailResult = await sendFamilyInviteEmail({
      invitedEmail: intent.invited_email,
      ownerEmail: ownerProfile?.email || user.email || 'contact@renewly.in',
      ownerName: ownerProfile?.full_name || ownerProfile?.email || 'Family owner',
      inviteUrl,
      expiresInDays: 7,
    })

    return NextResponse.json({
      success: true,
      inviteId: newInvite.id,
      emailSent: emailResult.sent,
      inviteUrl: emailResult.reason === 'email_unconfigured' ? inviteUrl : undefined,
      warning:
        emailResult.reason === 'email_unconfigured'
          ? 'Email is not configured. Use this QA invite link for testing.'
          : undefined,
      message: `Extra-seat invite created for ${intent.invited_email}`,
    })
  } catch (error) {
    console.error('[finalize-payment] Error:', error)
    return NextResponse.json({ error: 'Failed to finalize payment' }, { status: 500 })
  }
}
