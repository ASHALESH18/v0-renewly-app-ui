/**
 * Safe billing configuration guards
 * Prevents app crashes when Razorpay env vars are missing
 */

export function isBillingConfigured(): boolean {
  return !!(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
  )
}

export function getBillingStatus(): {
  configured: boolean
  message: string
} {
  const configured = isBillingConfigured()
  
  return {
    configured,
    message: configured 
      ? 'Billing system is ready'
      : 'Billing setup in progress - please try again later'
  }
}

/**
 * Safe upgrade gate - returns fallback state if billing not configured
 */
export function canShowUpgradeFlow(): boolean {
  return isBillingConfigured()
}

/**
 * Safe checkout guard for server actions
 */
export function requireBillingConfiguration(): void {
  if (!isBillingConfigured()) {
    throw new Error('Billing system is not configured yet. Please check environment variables.')
  }
}
