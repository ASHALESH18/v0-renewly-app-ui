/**
 * Family Member Removed Email Sender
 * Sends removal notification emails using Resend API
 */

interface SendRemovedEmailParams {
  memberEmail: string
  ownerEmail: string
  ownerName: string
}

interface SendRemovedEmailResult {
  sent: boolean
  reason?: 'email_unconfigured' | 'send_failed' | 'success'
  error?: string
}

/**
 * Send family member removed email via Resend API
 * If email is not configured in preview/dev, returns { sent: false, reason: 'email_unconfigured' }
 */
export async function sendFamilyMemberRemovedEmail(
  params: SendRemovedEmailParams
): Promise<SendRemovedEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FAMILY_INVITE_FROM_EMAIL || 'contact@renewly.in'
  const vercelEnv = process.env.VERCEL_ENV || 'development'

  // Email not configured
  if (!resendApiKey) {
    if (vercelEnv === 'production') {
      return {
        sent: false,
        reason: 'send_failed',
        error: 'Email provider not configured in production',
      }
    }
    // In development/preview, allow without email
    return {
      sent: false,
      reason: 'email_unconfigured',
    }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.memberEmail,
        subject: "You've been removed from Renewly Family",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi,</p>
            
            <p>You've been removed from a Renewly Family plan.</p>
            
            <p>Your personal Renewly account and tracked subscriptions are safe. Family premium access has ended, but you can start your own Pro or Family plan anytime.</p>
            
            <p>If this was unexpected, please contact the family owner at ${params.ownerEmail}.</p>
            
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This email was sent to ${params.memberEmail} because you were a member of a Renewly Family plan.<br/>
                © Renewly | contact@renewly.in
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      console.warn('[family-removed-email] Resend API error:', data)
      return {
        sent: false,
        reason: 'send_failed',
        error: data.message || 'Failed to send email',
      }
    }

    return {
      sent: true,
      reason: 'success',
    }
  } catch (error) {
    console.warn('[family-removed-email] Email send error:', error)
    return {
      sent: false,
      reason: 'send_failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
