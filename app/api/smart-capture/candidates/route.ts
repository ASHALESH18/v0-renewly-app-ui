import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withCache, CACHE_KEYS, CACHE_TTL, invalidateUserCaches } from '@/lib/redis'
import type { 
  CandidateStatus, 
} from '@/lib/smart-capture/types'

/**
 * GET /api/smart-capture/candidates
 * Fetch subscription candidates for the authenticated user
 * 
 * Query params:
 * - status: CandidateStatus | 'all' (default: 'all')
 * - source: CaptureSource | 'all' (default: 'all')
 * - limit: number (default: 50)
 * - offset: number (default: 0)
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

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const source = searchParams.get('source') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const skipCache = searchParams.get('fresh') === 'true'

    // Cache key includes status for filtered results
    const cacheKey = CACHE_KEYS.candidates(user.id, status)

    const fetchCandidates = async () => {
      // Build query
      let query = supabase
        .from('subscription_candidates')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply filters
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (source !== 'all') {
        query = query.eq('source', source)
      }

      const { data: candidates, error, count } = await query

      if (error) {
        console.error('[smart-capture] Error fetching candidates:', error)
        throw error
      }

      return {
        candidates: candidates || [],
        total: count || 0,
        limit,
        offset,
      }
    }

    // Use cache unless explicitly requesting fresh data
    const result = skipCache 
      ? await fetchCandidates()
      : await withCache(cacheKey, fetchCandidates, CACHE_TTL.short)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[smart-capture] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/smart-capture/candidates
 * Create a new candidate (mainly for manual entry or notification lab)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      source,
      providerName,
      planName,
      amount,
      currency,
      billingCycle,
      evidenceSnippet,
    } = body

    // Validate required fields
    if (!source || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields: source, providerName' },
        { status: 400 }
      )
    }

    // Create candidate
    const candidateData = {
      user_id: user.id,
      source,
      provider_name: providerName,
      plan_name: planName || null,
      amount: amount || null,
      currency: currency || 'INR',
      billing_cycle: billingCycle || 'unknown',
      confidence_score: 50, // Manual entries get medium confidence
      confidence_level: 'medium',
      status: 'new' as CandidateStatus,
      evidence_snippet: evidenceSnippet || null,
      tags: [],
      detected_at: new Date().toISOString(),
    }

    const { data: candidate, error } = await supabase
      .from('subscription_candidates')
      .insert(candidateData)
      .select()
      .single()

    if (error) {
      console.error('[smart-capture] Error creating candidate:', error)
      return NextResponse.json(
        { error: 'Failed to create candidate' },
        { status: 500 }
      )
    }

    // Invalidate caches after creating a new candidate
    await invalidateUserCaches(user.id)

    return NextResponse.json({ candidate }, { status: 201 })
  } catch (error) {
    console.error('[smart-capture] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
