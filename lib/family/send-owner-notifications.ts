import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

interface InviteAction {
  inviteId: string
  familyGroupId: string
  invitedEmail: string
  action: 'accepted' | 'declined'
  invitedUserName?: string
}

/**
 * Notify family owner when an invite is accepted or declined
 * Sends email + creates notification in app
 * Does NOT fail if email send fails
 */
export async function notifyOwnerOfInviteAction(data: InviteAction) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get family group and owner details
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id')
      .eq('id', data.familyGroupId)
      .single()

    if (groupError || !group) {
      console.warn('[family-notifications] Failed to fetch family group:', groupError)
      return
    }

    // Get owner profile with email
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('id, email, first_name')
      .eq('id', group.owner_user_id)
      .single()

    if (ownerError || !ownerProfile?.email) {
      console.warn('[family-notifications] Failed to fetch owner profile:', ownerError)
      return
    }

    // Send email to owner via Resend
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const emailSubject =
        data.action === 'accepted'
          ? `${data.invitedEmail} accepted your Renewly Family invite`
          : `${data.invitedEmail} declined your Renewly Family invite`

      const emailBody =
        data.action === 'accepted'
          ? `${data.invitedEmail} has accepted your Renewly Family invite and is now part of your Family plan.`
          : `${data.invitedEmail} has declined your Renewly Family invite.`

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Renewly <contact@renewly.in>'
      const replyTo = 'contact@renewly.in'

      try {
        const { error: emailError } = await resend.emails.send({
          from: fromEmail,
          replyTo: replyTo,
          to: ownerProfile.email,
          subject: emailSubject,
          html: `<p>${emailBody}</p>`,
        })

        if (emailError) {
          console.warn('[family-notifications] Email send failed (continuing):', emailError)
        }
      } catch (emailError) {
        console.warn('[family-notifications] Email send exception (continuing):', emailError)
      }
    }

    // Create in-app notification for owner
    const notificationTitle =
      data.action === 'accepted'
        ? `${data.invitedEmail} accepted your Family invite`
        : `${data.invitedEmail} declined your Family invite`

    const emailBody =
      data.action === 'accepted'
        ? `${data.invitedEmail} has accepted your Renewly Family invite and is now part of your Family plan.`
        : `${data.invitedEmail} has declined your Renewly Family invite.`

    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: group.owner_user_id,
        type: 'info',
        title: notificationTitle,
        message: emailBody,
        notification_key: `family-invite-${data.action}-${data.inviteId}`,
      })
      .catch((error) => {
        console.warn('[family-notifications] Failed to create notification:', error)
        return { error }
      })

    if (notifError) {
      console.warn('[family-notifications] Notification creation failed (non-fatal):', notifError)
    }
  } catch (error) {
    console.error('[family-notifications] Unexpected error:', error)
    // Don't re-throw - this is a best-effort notification system
  }
}
