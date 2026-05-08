/**
 * Family Lifecycle Email Senders (F9)
 * Sends non-blocking notifications for lifecycle events
 */

interface FamilyLifecycleEmailParams {
  email: string
  ownerEmail?: string
  ownerName?: string
  scheduledDate?: string
  reason?: string
}

interface SendEmailResult {
  sent: boolean
  reason?: string
  error?: string
}

/**
 * Send Family cancellation scheduled notification
 * Non-blocking: does not throw, returns { sent: boolean }
 */
export async function sendFamilyCancellationScheduledEmail(
  params: FamilyLifecycleEmailParams
): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FAMILY_INVITE_FROM_EMAIL || 'contact@renewly.in'
  const vercelEnv = process.env.VERCEL_ENV || 'development'

  if (!resendApiKey) {
    return { sent: false, reason: 'email_unconfigured' }
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
        to: params.email,
        subject: 'Your Renewly Family plan will cancel on ' + (params.scheduledDate || 'the end of your billing period'),
        html: `
          <h2>Family Plan Cancellation Scheduled</h2>
          <p>Your Renewly Family plan has been scheduled for cancellation on <strong>${params.scheduledDate || 'the end of your billing period'}</strong>.</p>
          <p>Until that date, your family members will continue to have access to the Family plan benefits.</p>
          <p>If you'd like to change this, you can cancel the scheduled action in your Family settings.</p>
          <p>Questions? Contact us at <strong>contact@renewly.in</strong></p>
        `,
      }),
    })

    if (!response.ok) {
      console.warn('[family-email] Cancellation email send failed:', await response.text())
      return { sent: false, reason: 'send_failed' }
    }

    return { sent: true }
  } catch (error) {
    console.warn('[family-email] Cancellation email error:', error)
    return { sent: false, reason: 'error', error: (error as Error).message }
  }
}

/**
 * Send Family downgrade scheduled notification
 * Non-blocking: does not throw, returns { sent: boolean }
 */
export async function sendFamilyDowngradeScheduledEmail(
  params: FamilyLifecycleEmailParams
): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FAMILY_INVITE_FROM_EMAIL || 'contact@renewly.in'
  const vercelEnv = process.env.VERCEL_ENV || 'development'

  if (!resendApiKey) {
    return { sent: false, reason: 'email_unconfigured' }
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
        to: params.email,
        subject: 'Your Renewly Family plan will downgrade on ' + (params.scheduledDate || 'the end of your billing period'),
        html: `
          <h2>Family Plan Downgrade Scheduled</h2>
          <p>Your Renewly Family plan has been scheduled to downgrade to Pro on <strong>${params.scheduledDate || 'the end of your billing period'}</strong>.</p>
          <p>After that date, your family members will no longer have access to the Family plan.</p>
          <p>Your personal Pro plan will continue normally.</p>
          <p>If you'd like to change this, you can cancel the scheduled action in your Family settings.</p>
          <p>Questions? Contact us at <strong>contact@renewly.in</strong></p>
        `,
      }),
    })

    if (!response.ok) {
      console.warn('[family-email] Downgrade email send failed:', await response.text())
      return { sent: false, reason: 'send_failed' }
    }

    return { sent: true }
  } catch (error) {
    console.warn('[family-email] Downgrade email error:', error)
    return { sent: false, reason: 'error', error: (error as Error).message }
  }
}

/**
 * Send extra-seat payment success notification
 * Non-blocking: does not throw, returns { sent: boolean }
 */
export async function sendExtraSeatsPaymentSuccessEmail(
  params: FamilyLifecycleEmailParams & { invitedEmail: string }
): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.FAMILY_INVITE_FROM_EMAIL || 'contact@renewly.in'

  if (!resendApiKey) {
    return { sent: false, reason: 'email_unconfigured' }
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
        to: params.email,
        subject: 'Extra seat added to your Renewly Family plan',
        html: `
          <h2>Extra Seat Added</h2>
          <p>You've successfully added an extra seat to your Renewly Family plan.</p>
          <p>An invitation has been sent to <strong>${params.invitedEmail}</strong> to join your family.</p>
          <p>Your Family plan now includes:</p>
          <ul>
            <li>4 included family members (unlimited)</li>
            <li>Extra members at ₹99/member/month</li>
          </ul>
          <p>Questions? Contact us at <strong>contact@renewly.in</strong></p>
        `,
      }),
    })

    if (!response.ok) {
      console.warn('[family-email] Extra seat payment email send failed:', await response.text())
      return { sent: false, reason: 'send_failed' }
    }

    return { sent: true }
  } catch (error) {
    console.warn('[family-email] Extra seat payment email error:', error)
    return { sent: false, reason: 'error', error: (error as Error).message }
  }
}
