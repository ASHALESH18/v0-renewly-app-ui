import { Resend } from 'resend'

// Initialize Resend client - gracefully handle missing API key
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Renewly <noreply@renewly.app>'

/**
 * Helper to format subscription amount with currency symbol
 */
export function formatSubscriptionMoney(currency: string, amount: number): string {
  const symbol = currency === '₹' ? '₹' : currency
  return `${symbol}${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/**
 * Check if Resend is configured and available
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Send a password changed notification email
 */
export async function sendPasswordChangedEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping password change email')
    return { success: true } // Graceful degradation
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Your Renewly password was changed',
      html: passwordChangedTemplate(userName),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send password change email:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Send a security alert email (suspicious login, etc.)
 */
export async function sendSecurityAlertEmail(
  to: string,
  userName: string,
  alertType: 'new_device' | 'password_reset_requested' | 'email_changed' | 'account_locked',
  metadata?: { device?: string; location?: string; time?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping security alert email')
    return { success: true }
  }

  const subjects: Record<typeof alertType, string> = {
    new_device: 'New device signed into your Renewly account',
    password_reset_requested: 'Password reset requested for your Renewly account',
    email_changed: 'Your Renewly email address was changed',
    account_locked: 'Your Renewly account has been locked',
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: subjects[alertType],
      html: securityAlertTemplate(userName, alertType, metadata),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send security alert email:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Send email verification code
 */
export async function sendEmailVerificationCode(
  to: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping email verification')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${code} is your Renewly verification code`,
      html: emailVerificationTemplate(code),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send verification email:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping welcome email')
    return { success: true } // Graceful degradation
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Renewly',
      html: welcomeTemplate(userName),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send welcome email:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * Send subscription reminder email
 */
export async function sendSubscriptionReminderEmail(
  to: string,
  userName: string,
  subscriptionName: string,
  renewalDate: string,
  amount: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping reminder email')
    return { success: true }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Reminder: ${subscriptionName} renews on ${renewalDate}`,
      html: subscriptionReminderTemplate(userName, subscriptionName, renewalDate, amount),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send reminder email:', err)
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================================
// Email Templates
// ============================================================================

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background: linear-gradient(135deg, #0e1218 0%, #1a1f2e 100%); padding: 32px 24px; text-align: center; }
  .logo { color: #c7a36a; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
  .content { padding: 32px 24px; color: #333333; line-height: 1.6; }
  .footer { background-color: #f9f9f9; padding: 24px; text-align: center; color: #666666; font-size: 12px; }
  .button { display: inline-block; background-color: #c7a36a; color: #0e1218 !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #c7a36a; background-color: #f5f5f5; padding: 16px 24px; border-radius: 8px; display: inline-block; }
  .alert-box { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .security-box { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  h1 { color: #0e1218; margin: 0 0 16px 0; font-size: 24px; }
  p { margin: 0 0 16px 0; }
  .muted { color: #666666; font-size: 14px; }
`

function passwordChangedTemplate(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    <div class="content">
      <h1>Password Changed</h1>
      <p>Hi ${userName},</p>
      <p>Your Renewly account password was successfully changed.</p>
      <p>If you made this change, no further action is needed.</p>
      <div class="security-box">
        <strong>Didn't make this change?</strong>
        <p style="margin: 8px 0 0 0;">If you didn't change your password, your account may have been compromised. Please reset your password immediately and contact our support team.</p>
      </div>
      <p class="muted">This change was made on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.</p>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p>This is an automated security notification.</p>
    </div>
  </div>
</body>
</html>
`
}

function securityAlertTemplate(
  userName: string,
  alertType: 'new_device' | 'password_reset_requested' | 'email_changed' | 'account_locked',
  metadata?: { device?: string; location?: string; time?: string }
): string {
  const alertMessages: Record<typeof alertType, { title: string; message: string }> = {
    new_device: {
      title: 'New Device Sign-In',
      message: `A new device signed into your Renewly account.${metadata?.device ? ` Device: ${metadata.device}.` : ''}${metadata?.location ? ` Location: ${metadata.location}.` : ''}`,
    },
    password_reset_requested: {
      title: 'Password Reset Requested',
      message: 'A password reset was requested for your account. If you did not request this, please ignore this email or contact support if you have concerns.',
    },
    email_changed: {
      title: 'Email Address Changed',
      message: 'The email address associated with your Renewly account has been changed. If you did not make this change, please contact support immediately.',
    },
    account_locked: {
      title: 'Account Locked',
      message: 'Your Renewly account has been temporarily locked due to too many failed sign-in attempts. Please reset your password to regain access.',
    },
  }

  const alert = alertMessages[alertType]

  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    <div class="content">
      <h1>Security Alert: ${alert.title}</h1>
      <p>Hi ${userName},</p>
      <div class="security-box">
        <p style="margin: 0;">${alert.message}</p>
      </div>
      <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately by changing your password.</p>
      <p class="muted">Time: ${metadata?.time || new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p>This is an automated security notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`
}

function emailVerificationTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    <div class="content">
      <h1>Verify Your Email</h1>
      <p>Use the code below to verify your email address:</p>
      <div style="text-align: center; margin: 32px 0;">
        <div class="code">${code}</div>
      </div>
      <p class="muted">This code expires in 10 minutes.</p>
      <p>If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
    </div>
  </div>
</body>
</html>
`
}

function subscriptionReminderTemplate(
  userName: string,
  subscriptionName: string,
  renewalDate: string,
  amount: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    <div class="content">
      <h1>Upcoming Renewal Reminder</h1>
      <p>Hi ${userName},</p>
      <div class="alert-box">
        <p style="margin: 0;"><strong>${subscriptionName}</strong> will renew on <strong>${renewalDate}</strong> for <strong>${amount}</strong>.</p>
      </div>
      <p>Make sure you have sufficient funds or update your payment method if needed.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://renewly.app'}/app/dashboard" class="button">View in Renewly</a>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p>You're receiving this because you enabled renewal reminders.</p>
    </div>
  </div>
</body>
</html>
`
}

function welcomeTemplate(userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><style>${baseStyles}</style></head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Renewly</div>
    </div>
    <div class="content">
      <h1>Welcome to Renewly</h1>
      <p>Hi ${userName},</p>
      <p>Welcome to Renewly! We're thrilled to have you on board.</p>
      <p>With Renewly, you can:</p>
      <ul style="margin: 16px 0; padding-left: 24px;">
        <li>Track all your subscriptions in one place</li>
        <li>Get reminders before renewals so you never miss a payment</li>
        <li>Spot subscription leaks and duplicate charges</li>
        <li>View spending analytics by category</li>
        <li>Export your data anytime</li>
      </ul>
      <p>Start by adding your first subscription, and we'll help you take control of your digital life.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://renewly.app'}/app/dashboard" class="button">Open Dashboard</a>
      <div class="alert-box" style="margin-top: 24px;">
        <p style="margin: 0;"><strong>Free Plan Limit:</strong> The Free plan includes up to 2 subscriptions. Upgrade to Pro or Family for unlimited subscriptions and more features.</p>
      </div>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p>Questions? We're here to help!</p>
    </div>
  </div>
</body>
</html>
`
}
