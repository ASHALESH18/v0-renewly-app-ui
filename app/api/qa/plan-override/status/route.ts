'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/repositories/profile'

/**
 * GET /api/qa/plan-override/status
 * Returns whether QA mode is enabled for the current user
 * 
 * Security:
 * - Only works if QA_PLAN_OVERRIDE_ENABLED=true in server env
 * - Only works if Vercel env is preview/development (not production)
 * - Requires authentication
 * - Requires email allowlist
 * - Does NOT expose allowlist or secrets
 */
export async function GET() {
  try {
    // Check if QA override is enabled server-side
    const qaEnabled = process.env.QA_PLAN_OVERRIDE_ENABLED === 'true'
    const vercelEnv = process.env.VERCEL_ENV || 'development'

    // Deny in production
    if (vercelEnv === 'production') {
      return NextResponse.json(
        { enabled: false, currentPlan: null, emailAllowed: false },
        { status: 200 }
      )
    }

    if (!qaEnabled) {
      return NextResponse.json(
        { enabled: false, currentPlan: null, emailAllowed: false },
        { status: 200 }
      )
    }

    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { enabled: false, currentPlan: null, emailAllowed: false },
        { status: 200 }
      )
    }

    // Check email allowlist
    const allowlistStr = process.env.QA_PLAN_OVERRIDE_EMAILS || ''
    const allowlist = allowlistStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const emailAllowed = allowlist.includes(user.email?.toLowerCase() || '')

    // Get current plan
    const profile = await getProfile(user.id)
    const currentPlan = profile?.plan || 'free'

    return NextResponse.json(
      {
        enabled: emailAllowed,
        currentPlan,
        emailAllowed, // Redundant but explicit for clarity
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] QA status check error:', error)
    // Don't expose errors to client, just return disabled
    return NextResponse.json(
      { enabled: false, currentPlan: null, emailAllowed: false },
      { status: 200 }
    )
  }
}
