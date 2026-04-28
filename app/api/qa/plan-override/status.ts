import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'

/**
 * GET /api/qa/plan-override/status
 * 
 * Returns QA status for the current user.
 * Used by Settings to determine if user can use QA plan overrides.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if QA mode is enabled in environment
    const qaEnabled = process.env.NEXT_PUBLIC_QA_ENABLED === 'true'

    // Allowlist check: for now, allow all users in QA mode
    // In production, you'd check a database table or environment variable
    const allowedEmails = (process.env.QA_ALLOWED_EMAILS || '').split(',').map(e => e.trim())
    const isAllowlisted = allowedEmails.length === 0 || allowedEmails.includes(user.email || '')

    return NextResponse.json({
      enabled: qaEnabled && isAllowlisted,
      emailAllowed: isAllowlisted,
      currentPlan: user.user_metadata?.plan || 'free',
      userEmail: user.email,
    })
  } catch (error) {
    console.error('[v0] QA status error:', error)
    return NextResponse.json(
      { error: 'Failed to get QA status', enabled: false, emailAllowed: false },
      { status: 500 }
    )
  }
}
