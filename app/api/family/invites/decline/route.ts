'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeInviteEmail } from '@/lib/family/family-invite-utils'
import { revalidateTag } from 'next/cache'

/**
 * POST /api/family/invites/decline
 * 
 * Decline a pending Family invite as the invited member
 * Body: { inviteId: "<invite id>" }
 * 
 * Rules:
 * - Requires logged-in user
 * - Only allows decline if signed-in email matches invited_email
 * - Only allows if invite.status = pending
 * - Updates invite.status to cancelled (member-declined)
 * - Does not grant Family access
 * - Member remains Free
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[decline] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse body
    const body = await request.json()
    const inviteId = body.inviteId as string

    if (!inviteId || !inviteId.trim()) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    // Fetch pending invite by ID
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select('id, invited_email, status')
      .eq('id', inviteId.trim())
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Check status is pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invite is no longer pending' },
        { status: 409 }
      )
    }

    // Get signed-in user email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const signedInEmail = userProfile?.email || user.email || ''

    try {
      const signedInNormalized = normalizeInviteEmail(signedInEmail)
      const invitedNormalized = normalizeInviteEmail(invite.invited_email)

      // Verify email match (CRITICAL: must match the invited email)
      if (signedInNormalized !== invitedNormalized) {
        return NextResponse.json(
          {
            error: `This invite was sent to ${invite.invited_email}. Only that email can decline it.`,
          },
          { status: 403 }
        )
      }
    } catch (emailError) {
      console.error('[decline] Email normalization error:', emailError)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Update invite as declined/cancelled
    const { error: updateError } = await supabase
      .from('family_invites')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('[decline] Invite update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to decline invite' },
        { status: 500 }
      )
    }

    // Invalidate cache
    revalidateTag('family-status')
    revalidateTag(`subscriptions:${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Invite declined',
    })
  } catch (error) {
    console.error('[decline] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
