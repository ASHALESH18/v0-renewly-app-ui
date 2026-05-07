import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'

/**
 * GET /api/entitlements/current
 * 
 * Returns current user's effective entitlement information
 * Safe for client-side consumption - does not expose private data
 */
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const entitlement = await resolveEffectiveEntitlement(user.id)

    // Return safe subset for client consumption
    return NextResponse.json({
      userId: entitlement.userId,
      profilePlan: entitlement.profilePlan,
      effectivePlan: entitlement.effectivePlan,
      source: entitlement.source,
      isFamilyOwner: entitlement.isFamilyOwner,
      isFamilyMember: entitlement.isFamilyMember,
      familyGroupId: entitlement.familyGroupId,
      familyGroupStatus: entitlement.familyGroupStatus,
      removedFromFamily: entitlement.removedFromFamily,
      hasIndependentPaidPlan: entitlement.hasIndependentPaidPlan,
    })
  } catch (error) {
    console.error('[entitlements-api] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
