import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { 
  generateInviteToken, 
  hashInviteToken, 
  buildFamilyInviteUrl,
  getInviteExpiryDate 
} from '@/lib/family/family-invite-utils'
import { sendFamilyInviteEmail } from '@/lib/email/family-invite-email'

/**
 * POST /api/family/invites/[inviteId]/resend
 * 
 * Resend a pending family invite with fresh token and expiry
 * - Owner only
 * - Pending status only
 * - Generates new token and extends expiry
 * - Resends email with new link
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
      console.error('[family-invites-resend] Missing Supabase env vars')
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Debug logging in non-production
    if (process.env.VERCEL_ENV !== 'production') {
      console.info('[family-invites] action invite id', {
        action: 'resend',
        hasInviteId: Boolean(normalizedInviteId),
      })
    }

    // Fetch the invite
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select('id, family_group_id, status, invited_email')
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
        { error: 'Only pending invites can be resent' },
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
        { error: 'Only family owner can resend invites' },
        { status: 403 }
      )
    }

    // Generate new token and hash
    const rawToken = generateInviteToken()
    const tokenHash = hashInviteToken(rawToken)
    const expiryDate = getInviteExpiryDate()

    // Build invite URL using request origin for environment-aware URL
    const requestOrigin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      undefined

    const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

    // Update invite with new token and expiry
    const { error: updateError } = await supabase
      .from('family_invites')
      .update({
        token_hash: tokenHash,
        expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', normalizedInviteId)

    if (updateError) {
      throw updateError
    }

    // Try to send email
    try {
      await sendFamilyInviteEmail(invite.invited_email, inviteUrl)
      return NextResponse.json({ success: true, emailSent: true })
    } catch (emailError) {
      // Email is not configured in Preview/development
      if (process.env.VERCEL_ENV !== 'production') {
        console.warn('[family-invites-resend] Email not sent (Preview/dev):', emailError)
        return NextResponse.json({
          success: true,
          emailSent: false,
          inviteUrl,
          warning: 'Email is not configured. Use this QA invite link.',
        })
      }

      // Email failed in production - return safe error
      console.error('[family-invites-resend] Email send failed:', emailError)
      return NextResponse.json(
        { error: 'Failed to resend invite email. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[family-invites-resend] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
