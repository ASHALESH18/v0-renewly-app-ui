import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { applyDueFamilyLifecycleActions } from '@/lib/family/family-lifecycle-processor'

/**
 * POST /api/family/lifecycle/apply-scheduled
 * 
 * QA/Admin only endpoint to apply due Family lifecycle actions (cancellation, downgrade).
 * 
 * Protected by QA_PLAN_OVERRIDE_ENABLED + QA_PLAN_OVERRIDE_EMAILS
 * 
 * Body (optional):
 * {
 *   familyGroupId?: string  // Process only this group
 *   dryRun?: boolean         // Simulate without persisting
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check QA mode is enabled
    if (process.env.QA_PLAN_OVERRIDE_ENABLED !== 'true') {
      return NextResponse.json(
        {
          error: 'QA mode not enabled',
          message: 'This endpoint is only available in QA/Preview mode',
        },
        { status: 403 }
      )
    }

    // Check user is in allowed QA emails
    const qaEmailsStr = process.env.QA_PLAN_OVERRIDE_EMAILS || ''
    const qaEmails = qaEmailsStr.split(',').map((e) => e.trim().toLowerCase())

    if (!qaEmails.includes(user.email?.toLowerCase() || '')) {
      console.warn(
        `[apply-scheduled] Unauthorized QA user attempted access: ${user.email}`
      )
      return NextResponse.json(
        {
          error: 'Not in QA allowlist',
          message: 'Your email is not configured for QA family lifecycle testing',
        },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { familyGroupId, dryRun } = body

    console.log(
      `[apply-scheduled] QA user ${user.email} requesting lifecycle enforcement`,
      { familyGroupId, dryRun }
    )

    // Apply due actions
    const result = await applyDueFamilyLifecycleActions({
      familyGroupId,
      dryRun,
    })

    console.log(
      `[apply-scheduled] Lifecycle enforcement complete`,
      {
        success: result.success,
        processedCount: result.processedGroupIds.length,
        cancelledCount: result.cancelledGroupIds.length,
        downgradedCount: result.downgradedGroupIds.length,
        skippedCount: result.skippedGroupIds.length,
        errorCount: result.errors.length,
      }
    )

    // Report honest success: true only if no errors
    const success = result.errors.length === 0

    return NextResponse.json(
      {
        success,
        processedGroupIds: result.processedGroupIds,
        cancelledGroupIds: result.cancelledGroupIds,
        downgradedGroupIds: result.downgradedGroupIds,
        skippedGroupIds: result.skippedGroupIds,
        errors: result.errors,
        mode: dryRun ? 'dry-run' : 'applied',
      },
      { status: success ? 200 : 207 }
    )
  } catch (error) {
    console.error('[apply-scheduled] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
