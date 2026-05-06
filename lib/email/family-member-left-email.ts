import { Resend } from 'resend'

/**
 * Send non-blocking email notifications when a member leaves the Family plan.
 * 1. Confirmation email to the member
 * 2. Notification email to the family owner
 */
export async function sendFamilyMemberLeftEmail(params: {
  memberEmail: string
  memberName: string
  ownerUserId: string
}) {
  const { memberEmail, memberName, ownerUserId } = params

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    // Fetch owner email
    let ownerEmail = 'contact@renewly.in'
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', ownerUserId)
          .single()

        if (ownerProfile?.email) {
          ownerEmail = ownerProfile.email
        }
      }
    } catch (e) {
      console.warn('[family-member-left-email] Failed to fetch owner email:', e)
    }

    // 1. Member confirmation email
    const memberEmailResult = await resend.emails.send({
      from: 'Renewly <noreply@renewly.in>',
      to: memberEmail,
      reply_to: 'contact@renewly.in',
      subject: 'You left Renewly Family',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2>You left Renewly Family</h2>
          <p>You've left the Renewly Family plan. Your personal Renewly account and tracked subscriptions are safe.</p>
          <p>Family access has ended. You can start your own Pro or Family plan anytime.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            © Renewly | contact@renewly.in
          </p>
        </div>
      `,
      text: `You left Renewly Family

You've left the Renewly Family plan. Your personal Renewly account and tracked subscriptions are safe.

Family access has ended. You can start your own Pro or Family plan anytime.

© Renewly | contact@renewly.in`,
    })

    // 2. Owner notification email
    const ownerEmailResult = await resend.emails.send({
      from: 'Renewly <noreply@renewly.in>',
      to: ownerEmail,
      reply_to: 'contact@renewly.in',
      subject: 'A member left your Renewly Family',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2>A member left your Renewly Family</h2>
          <p>${memberEmail} has left your Renewly Family plan.</p>
          <p>Their seat is now available for a new family member.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            © Renewly | contact@renewly.in
          </p>
        </div>
      `,
      text: `A member left your Renewly Family

${memberEmail} has left your Renewly Family plan.

Their seat is now available for a new family member.

© Renewly | contact@renewly.in`,
    })

    return {
      sent: memberEmailResult.data?.id !== undefined && ownerEmailResult.data?.id !== undefined,
      reason: undefined,
    }
  } catch (error) {
    console.error('[family-member-left-email] Error sending emails:', error)
    // Check if email is unconfigured in preview
    if (process.env.VERCEL_ENV !== 'production' && error instanceof Error && error.message.includes('unconfigured')) {
      return {
        sent: false,
        reason: 'email_unconfigured',
      }
    }
    return {
      sent: false,
      reason: 'error',
    }
  }
}
