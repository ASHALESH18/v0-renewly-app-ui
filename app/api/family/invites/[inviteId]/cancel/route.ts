import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/family/invites/[inviteId]/cancel
 * 
 * Cancel a pending family invite
 * - Owner only
 * - Pending status only
 * - Sets status to cancelled with timestamp
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ inviteId: string }> }
) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-invites-cancel] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 16
    const { inviteId } = await context.params
    const normalizedInviteId = typeof inviteId === 'string' ? inviteId.trim() : ''

    if (
      !normalizedInviteId ||
      normalizedInviteId === 'undefined' ||
      normalizedInviteId === 'null'
    ) {
      return NextResponse.json({ error: 'Invalid invite ID' }, { status: 400 })
    }

    // Debug logging in non-production
    if (process.env.VERCEL_ENV !== 'production') {
      console.info('[family-invites] action invite id', {
        action: 'cancel',
        hasInviteId: Boolean(normalizedInviteId),
      })
    }

    // Fetch the invite
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select('id, family_group_id, status')
      .eq('id', normalizedInviteId)
      .single()

    if (inviteError) {
      if (inviteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      }
      throw inviteError
    }

    // Verify invite is pending
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending invites can be cancelled' },
        { status: 400 }
      )
    }

    // Fetch family group and verify ownership
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id')
      .eq('id', invite.family_group_id)
      .single()

    if (groupError) {
      throw groupError
    }

    if (familyGroup.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only family owner can cancel invites' },
        { status: 403 }
      )
    }

    // Cancel the invite
    const { error: updateError } = await supabase
      .from('family_invites')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', normalizedInviteId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[family-invites-cancel] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
