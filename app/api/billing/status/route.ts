import { NextResponse } from 'next/server'
import { isBillingConfigured, getBillingStatus } from '@/lib/billing-guards'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing/status
 * Returns whether billing is configured and ready
 */
export async function GET() {
  const status = getBillingStatus()
  
  return NextResponse.json({
    configured: status.configured,
    message: status.message,
    razorpayKeyId: status.configured ? process.env.RAZORPAY_KEY_ID : null,
  })
}
