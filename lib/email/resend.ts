import { Resend } from 'resend'

// Initialize Resend client - gracefully handle missing API key
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Renewly <contact@renewly.in>'
const REPLY_TO_EMAIL = 'contact@renewly.in'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.renewly.in'

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
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: 'Your Renewly password was changed',
      html: passwordChangedTemplate(userName),
      text: `Hi ${userName},\n\nYour password was recently changed. If this wasn't you, please reset your password immediately.\n\nRenewly Team`,
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
    return { success: false, error: 'Email service not configured' }
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
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: subjects[alertType],
      html: securityAlertTemplate(userName, alertType, metadata),
      text: securityAlertTextTemplate(userName, alertType, metadata),
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
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: `${code} is your Renewly verification code`,
      html: emailVerificationTemplate(code),
      text: `Your verification code is: ${code}`,
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
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: 'Welcome to Renewly',
      html: welcomeTemplate(userName),
      text: welcomeTemplateText(userName),
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
  amount: string,
  billingCycle?: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping reminder email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: `Renewal reminder: ${subscriptionName} renews soon`,
      html: subscriptionReminderTemplate(userName, subscriptionName, renewalDate, amount, billingCycle),
      text: subscriptionReminderTextTemplate(subscriptionName, renewalDate, amount, billingCycle),
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

/**
 * Send weekly summary email
 */
export async function sendWeeklySummaryEmail(
  to: string,
  userName: string,
  summaryData: {
    monthlySpend: string
    activeSubscriptionCount: number
    upcomingRenewals7Days: number
    upcomingRenewals30Days: number
    potentialSavings: string
    topCategory: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log('[v0] Resend not configured, skipping weekly summary email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO_EMAIL,
      to,
      subject: 'Your weekly Renewly summary',
      html: weeklySummaryTemplate(userName, summaryData),
      text: weeklySummaryTextTemplate(summaryData),
    })

    if (error) {
      console.error('[v0] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[v0] Failed to send weekly summary email:', err)
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
  amount: string,
  billingCycle?: string
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
        <p style="margin: 0;"><strong>${subscriptionName}</strong> will renew on <strong>${renewalDate}</strong> for <strong>${amount}</strong>${billingCycle ? ` (${billingCycle})` : ''}.</p>
      </div>
      <p>Make sure you have sufficient funds or update your payment method if needed.</p>
      <a href="${APP_URL}/app/dashboard" class="button">View in Renewly</a>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p style="margin: 8px 0 0 0;">You're receiving this because Email Notifications are enabled in Renewly.</p>
      <p style="margin: 8px 0 0 0;">You can turn off Email Notifications in <a href="${APP_URL}/app/settings?section=notifications" style="color: #c7a36a; text-decoration: none;">Settings</a>.</p>
    </div>
  </div>
</body>
</html>
`
}

function weeklySummaryTemplate(
  userName: string,
  summaryData: {
    monthlySpend: string
    activeSubscriptionCount: number
    upcomingRenewals7Days: number
    upcomingRenewals30Days: number
    potentialSavings: string
    topCategory: string
  }
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
      <h1>Your Weekly Renewly Summary</h1>
      <p>Hi ${userName},</p>
      <p>Here's your subscription overview for this week:</p>
      
      <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Monthly Spend</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.monthlySpend}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Active Subscriptions</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.activeSubscriptionCount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Renewals in 7 Days</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.upcomingRenewals7Days}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Renewals in 30 Days</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.upcomingRenewals30Days}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e5e5;">
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Potential Savings</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.potentialSavings}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-weight: 600; color: #0e1218;">Top Category</td>
          <td style="padding: 12px 0; text-align: right; color: #333333;">${summaryData.topCategory}</td>
        </tr>
      </table>
      
      <a href="${APP_URL}/app/dashboard" class="button">View Full Summary</a>
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p style="margin: 8px 0 0 0;">You're receiving this because Email Notifications are enabled in Renewly.</p>
      <p style="margin: 8px 0 0 0;">You can turn off Email Notifications in <a href="${APP_URL}/app/settings?section=notifications" style="color: #c7a36a; text-decoration: none;">Settings</a>.</p>
    </div>
  </div>
</body>
</html>
`
}
  const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL
  const hasRatingButtons = appStoreUrl || playStoreUrl

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
      <p>Welcome to Renewly — your subscription command center.</p>
      <p>You can now track your subscriptions, monitor renewal dates, understand your monthly spend, and spot subscriptions that may be quietly leaking money.</p>
      <p>To get started, add your first subscription and Renewly will begin organizing your dashboard, calendar, and renewal insights.</p>
      <p>Your Free plan lets you track up to 2 subscriptions. Upgrade anytime for unlimited tracking and premium insights.</p>
      <a href="${APP_URL}/app/dashboard" class="button">Open Dashboard</a>
      ${
        hasRatingButtons
          ? `
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 12px 0; color: #0e1218; font-size: 16px;">Help us grow</h3>
        <p style="margin: 0 0 16px 0; color: #666666; font-size: 14px;">We've put a lot of care into building Renewly. If it helps you stay on top of subscriptions, a quick rating would mean a lot.</p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${
            appStoreUrl
              ? `<a href="${appStoreUrl}" style="display: inline-block; background-color: #f5f5f5; color: #0e1218; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; border: 1px solid #e5e5e5;">Rate on App Store</a>`
              : ''
          }
          ${
            playStoreUrl
              ? `<a href="${playStoreUrl}" style="display: inline-block; background-color: #f5f5f5; color: #0e1218; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500; border: 1px solid #e5e5e5;">Rate on Google Play</a>`
              : ''
          }
        </div>
      </div>
      `
          : ''
      }
    </div>
    <div class="footer">
      <p>Renewly - Track your subscriptions smartly</p>
      <p style="margin: 8px 0 0 0;">Made in India with ❤️</p>
      <p style="margin: 8px 0 0 0;">You're receiving this because you created a Renewly account.</p>
      <p style="margin: 8px 0 0 0;"><a href="${APP_URL}/app/settings?section=notifications" style="color: #c7a36a; text-decoration: none;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
`
}

// ============================================================================
// Plain Text Templates
// ============================================================================

function welcomeTemplateText(userName: string): string {
  return `Welcome to Renewly

Hi ${userName},

Welcome to Renewly — your subscription command center.

You can now track your subscriptions, monitor renewal dates, understand your monthly spend, and spot subscriptions that may be quietly leaking money.

To get started, add your first subscription and Renewly will begin organizing your dashboard, calendar, and renewal insights.

Your Free plan lets you track up to 2 subscriptions. Upgrade anytime for unlimited tracking and premium insights.

Open Dashboard: ${APP_URL}/app/dashboard

---

Renewly - Track your subscriptions smartly
Made in India with ❤️

You're receiving this because you created a Renewly account.
Manage email preferences: ${APP_URL}/app/settings?section=notifications
`
}

function subscriptionReminderTextTemplate(
  subscriptionName: string,
  renewalDate: string,
  amount: string,
  billingCycle?: string
): string {
  return `Upcoming Renewal Reminder

${subscriptionName} will renew on ${renewalDate} for ${amount}${billingCycle ? ` (${billingCycle})` : ''}.

Make sure you have sufficient funds or update your payment method if needed.

View in Renewly: ${APP_URL}/app/dashboard

---

Renewly - Track your subscriptions smartly

You're receiving this because Email Notifications are enabled in Renewly.
You can turn off Email Notifications in Settings: ${APP_URL}/app/settings?section=notifications
Manage email preferences: ${APP_URL}/app/settings?section=notifications
`
}

function weeklySummaryTextTemplate(summaryData: {
  monthlySpend: string
  activeSubscriptionCount: number
  upcomingRenewals7Days: number
  upcomingRenewals30Days: number
  potentialSavings: string
  topCategory: string
}): string {
  return `Your Weekly Renewly Summary

Monthly Spend: ${summaryData.monthlySpend}
Active Subscriptions: ${summaryData.activeSubscriptionCount}
Renewals in 7 Days: ${summaryData.upcomingRenewals7Days}
Renewals in 30 Days: ${summaryData.upcomingRenewals30Days}
Potential Savings: ${summaryData.potentialSavings}
Top Category: ${summaryData.topCategory}

View Full Summary: ${APP_URL}/app/dashboard

---

Renewly - Track your subscriptions smartly

You're receiving this because Email Notifications are enabled in Renewly.
You can turn off Email Notifications in Settings: ${APP_URL}/app/settings?section=notifications
Manage email preferences: ${APP_URL}/app/settings?section=notifications
`
}

function securityAlertTextTemplate(
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

  return `SECURITY ALERT: ${alert.title}

Hi ${userName},

${alert.message}

If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately by changing your password.

Time: ${metadata?.time || new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

---

Renewly - Track your subscriptions smartly

This is an automated security notification. Please do not reply to this email.
If you need help, contact support at contact@renewly.in
`
}
