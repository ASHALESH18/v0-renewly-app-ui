'use server'

import { SupabaseClient } from '@supabase/supabase-js'

export interface PendingFamilyInvite {
  id: string
  familyGroupId: string
  invitedEmail: string
  expiresAt: string
  seatType: string
  createdAt: string
  familyOwner: {
    userId: string
    email: string | null
  }
}

/**
 * Get pending Family invite for a user by email
 * 
 * Shared source-of-truth used by:
 * - /api/family/status
 * - /api/notifications
 * - any pending invite logic
 * 
 * Rules:
 * - Normalize email: trim + lowercase
 * - Case-insensitive query
 * - Only pending status
 * - Only non-expired invites
 * - Only from active/past_due family groups
 * - Newest invite preferred
 * 
 * @returns Invite object or null if no valid pending invite
 */
export async function getPendingFamilyInviteForUserEmail(
  supabase: SupabaseClient<any>,
  email: string
): Promise<PendingFamilyInvite | null> {
  try {
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) return null

    // Query pending invites (case-insensitive)
    const { data: invites, error: invitesError } = await supabase
      .from('family_invites')
      .select('id, family_group_id, invited_email, status, expires_at, seat_type, created_at')
      .ilike('invited_email', normalizedEmail)
      .eq('status', 'pending')
      .gt('expires_at', 'now()')
      .order('created_at', { ascending: false })
      .limit(1)

    if (invitesError) {
      console.error('[get-pending-invite] Query error:', invitesError)
      return null
    }

    if (!invites || invites.length === 0) {
      return null
    }

    const invite = invites[0]

    // Fetch family group (only active/past_due)
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, status')
      .eq('id', invite.family_group_id)
      .in('status', ['active', 'past_due'])
      .maybeSingle()

    if (groupError) {
      console.error('[get-pending-invite] Group fetch error:', groupError)
      return null
    }

    if (!group) {
      // Family group not active/past_due
      return null
    }

    // Fetch owner profile
    let ownerEmail: string | null = null
    if (group.owner_user_id) {
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', group.owner_user_id)
        .maybeSingle()

      if (ownerError) {
        console.error('[get-pending-invite] Owner fetch error:', ownerError)
      }

      ownerEmail = ownerProfile?.email || null
    }

    return {
      id: invite.id,
      familyGroupId: invite.family_group_id,
      invitedEmail: invite.invited_email,
      expiresAt: invite.expires_at,
      seatType: invite.seat_type,
      createdAt: invite.created_at,
      familyOwner: {
        userId: group.owner_user_id,
        email: ownerEmail,
      },
    }
  } catch (error) {
    console.error('[get-pending-invite] Unexpected error:', error)
    return null
  }
}
