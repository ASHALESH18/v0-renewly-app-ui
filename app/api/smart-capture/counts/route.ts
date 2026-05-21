import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

/**
 * GET /api/smart-capture/counts
 * Fetch inbox candidate counts by status for the authenticated user.
 * Keep both added and confirmed keys so older UI code does not break.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = CACHE_KEYS.inboxCounts(user.id)

    const counts = await withCache(cacheKey, async () => {
      const { data: statusCounts, error } = await supabase
        .from('subscription_candidates')
        .select('status')
        .eq('user_id', user.id)

      if (error) {
        console.error('[smart-capture] Error fetching counts:', error)
        throw error
      }

      const result = {
        new: 0,
        review_needed: 0,
        added: 0,
        confirmed: 0,
        ignored: 0,
        error: 0,
        total: 0,
      }

      for (const row of statusCounts || []) {
        const status = String(row.status || 'new')
        if (status === 'confirmed' || status === 'added') {
          result.added += 1
          result.confirmed += 1
        } else if (status in result) {
          result[status as keyof typeof result] += 1
        }
        result.total += 1
      }

      return result
    }, CACHE_TTL.short)

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('[smart-capture] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
