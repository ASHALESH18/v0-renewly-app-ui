'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashInviteToken, isInviteExpired } from '@/lib/family/family-invite-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/family/invites/resolve?token=...
 * 
 * Unauthenticated preview of invite before sign-in
 * Returns minimal safe data about the invite
 * Never returns token_hash
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Hash the token to lookup
    const tokenHash = hashInviteToken(token)

    // Find invite by token hash
    const { data: invite, error } = await supabase
      .from('family_invites')
      .select(`
        id,
        invited_email,
        status,
        expires_at,
        created_at,
        family_groups (
          owner_user_id,
          profiles (
            email,
            full_name
          )
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Check status
    if (invite.status !== 'pending') {
      if (invite.status === 'expired') {
        return NextResponse.json(
          { error: 'This invite has expired' },
          { status: 410 }
        )
      }
      if (invite.status === 'accepted') {
        return NextResponse.json(
          { error: 'This invite has already been accepted' },
          { status: 409 }
        )
      }
      if (invite.status === 'cancelled') {
        return NextResponse.json(
          { error: 'This invite has been cancelled' },
          { status: 410 }
        )
      }
    }

    // Check expiry
    if (isInviteExpired(invite.expires_at)) {
      // Mark as expired
      await supabase
        .from('family_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    // Return safe preview data (never token_hash)
    const ownerProfile = (invite.family_groups as any)?.profiles
    const ownerEmail = ownerProfile?.email || 'A Renewly member'

    return NextResponse.json({
      invitedEmail: invite.invited_email,
      ownerEmail,
      ownerName: ownerProfile?.full_name,
      expiresAt: invite.expires_at,
      status: invite.status,
      createdAt: invite.created_at,
    })
  } catch (error) {
    console.error('[family-invites-resolve] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
