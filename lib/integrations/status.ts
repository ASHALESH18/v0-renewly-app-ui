'use server'

/**
 * Integration status utilities for graceful degradation
 * Allows the app to function with or without third-party services
 */

export type IntegrationName = 'resend' | 'twilio' | 'stripe' | 'razorpay'

export interface IntegrationStatus {
  name: IntegrationName
  configured: boolean
  description: string
}

/**
 * Check if Resend email service is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Check if Twilio SMS service is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  )
}

/**
 * Check if Stripe payments is configured
 */
export function isStripeConfigured(): boolean {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

/**
 * Check if Razorpay payments is configured
 */
export function isRazorpayConfigured(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  )
}

/**
 * Get status of all integrations
 */
export async function getAllIntegrationStatuses(): Promise<IntegrationStatus[]> {
  return [
    {
      name: 'resend',
      configured: isResendConfigured(),
      description: 'Transactional emails (password changes, security alerts, reminders)',
    },
    {
      name: 'twilio',
      configured: isTwilioConfigured(),
      description: 'SMS verification and OTP codes',
    },
    {
      name: 'stripe',
      configured: isStripeConfigured(),
      description: 'International payment processing',
    },
    {
      name: 'razorpay',
      configured: isRazorpayConfigured(),
      description: 'India payment processing',
    },
  ]
}

/**
 * Get status of a specific integration
 */
export async function getIntegrationStatus(name: IntegrationName): Promise<IntegrationStatus> {
  const statuses = await getAllIntegrationStatuses()
  return statuses.find((s) => s.name === name) || {
    name,
    configured: false,
    description: 'Unknown integration',
  }
}
