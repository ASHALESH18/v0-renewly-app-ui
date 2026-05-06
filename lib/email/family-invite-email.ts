/**
 * Family Invite Email Sender
 * Sends invitation emails using Resend or returns QA link if unconfigured
 */

interface SendInviteEmailParams {
  invitedEmail: string
  ownerEmail: string
  ownerName?: string
  inviteUrl: string
  expiresInDays: number
}

interface SendInviteEmailResult {
  sent: boolean
  reason?: 'email_unconfigured' | 'send_failed' | 'success'
  error?: string
}

/**
 * Send family invite email via Resend API
 * If email is not configured:
 * - In Preview/development: returns { sent: false, reason: 'email_unconfigured' }
 * - In production: returns error
 */
export async function sendFamilyInviteEmail(
  params: SendInviteEmailParams
): Promise<SendInviteEmailResult> {
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
    // In development/preview, allow QA mode without email
    return {
      sent: false,
      reason: 'email_unconfigured',
    }
  }

  try {
    // Build email content
    const htmlContent = buildInviteEmailHtml({
      ...params,
      fromEmail,
    })

    const textContent = buildInviteEmailText({
      ...params,
    })

    // Send via Resend API using fetch (no new dependency)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.invitedEmail,
        subject: "You're invited to join Renewly Family",
        html: htmlContent,
        text: textContent,
        reply_to: 'contact@renewly.in',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[family-invite-email] Resend API error:', error)
      return {
        sent: false,
        reason: 'send_failed',
        error: 'Failed to send invite email',
      }
    }

    return {
      sent: true,
      reason: 'success',
    }
  } catch (error) {
    console.error('[family-invite-email] Error sending email:', error)
    return {
      sent: false,
      reason: 'send_failed',
      error: (error as Error).message,
    }
  }
}

/**
 * Build HTML email for invite
 */
function buildInviteEmailHtml(params: SendInviteEmailParams & { fromEmail: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #d4a574; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .cta-button { display: inline-block; padding: 12px 24px; background-color: #d4a574; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; }
    .expiry-note { background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    
    <p>Hello,</p>
    
    <div class="content">
      <p><strong>${params.ownerName || params.ownerEmail}</strong> has invited you to join their <strong>Renewly Family plan</strong>.</p>
      
      <p>Renewly Family helps you manage all your subscription expenses together — track renewals, manage bills, and share subscription management with your loved ones.</p>
      
      <p style="text-align: center;">
        <a href="${params.inviteUrl}" class="cta-button">Accept Invite</a>
      </p>
      
      <p>Or copy this link: <a href="${params.inviteUrl}">${params.inviteUrl}</a></p>
      
      <div class="expiry-note">
        <strong>This invite expires in ${params.expiresInDays} days.</strong><br>
        <small>Please sign in with <strong>${params.invitedEmail}</strong> to accept the invitation.</small>
      </div>
    </div>
    
                <p>If you have any questions, contact us at contact@renewly.in</p>
    
    <div class="footer">
      <p>© Renewly. All rights reserved.</p>
      <p>You received this email because you were invited to join a Renewly Family plan.</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

/**
 * Build plain text email for invite
 */
function buildInviteEmailText(params: SendInviteEmailParams): string {
  return `
You're invited to join Renewly Family

${params.ownerName || params.ownerEmail} has invited you to join their Renewly Family plan.

Renewly Family helps you manage all your subscription expenses together — track renewals, manage bills, and share subscription management with your loved ones.

Accept your invite:
${params.inviteUrl}

IMPORTANT:
- This invite expires in ${params.expiresInDays} days
- You must sign in with ${params.invitedEmail} to accept

If you have questions, contact contact@renewly.in

© Renewly. All rights reserved.
`.trim()
}
