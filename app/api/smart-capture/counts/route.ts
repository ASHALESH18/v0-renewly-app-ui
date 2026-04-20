import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/smart-capture/counts
 * Fetch inbox candidate counts by status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch counts by status using group by
    const { data: statusCounts, error } = await supabase
      .from('subscription_candidates')
      .select('status')
      .eq('user_id', user.id)

    if (error) {
      console.error('[smart-capture] Error fetching counts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch counts' },
        { status: 500 }
      )
    }

    // Aggregate counts
    const counts = {
      new: 0,
      review_needed: 0,
      added: 0,
      ignored: 0,
      error: 0,
      total: 0,
    }

    if (statusCounts) {
      for (const row of statusCounts) {
        const status = row.status as keyof typeof counts
        if (status in counts) {
          counts[status]++
        }
        counts.total++
      }
    }

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('[smart-capture] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
