'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { generateAllInsights } from '@/lib/insights/insight-engine'
import type { InsightGenerationContext } from '@/lib/insights/insight-types'

/**
 * GET /api/insights
 * Generate insights for the current user based on their real app data
 *
 * Returns partial insights if optional data sources fail
 * Never returns 500 - always returns 200 with whatever insights could be generated
 */
export async function GET() {
  const warnings: string[] = []

  try {
    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Insights API] Missing Supabase env vars')
      return NextResponse.json(
        { success: false, error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch subscriptions (excluding cancelled)
    let subscriptions = []
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')

      if (error) {
        console.error('[Insights API] Subscriptions error:', error)
        warnings.push('Could not fetch subscriptions')
      } else {
        subscriptions = data || []
      }
    } catch (err) {
      console.error('[Insights API] Subscriptions exception:', err)
      warnings.push('Subscription fetch failed')
    }

    // Fetch Family context
    let familyStatus = null
    try {
      // Get user email for Family context
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      const userEmail = profile?.email || user.email

      // Check if user is Family owner
      const { data: ownedFamily } = await supabase
        .from('family_groups')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (ownedFamily) {
        // Fetch family members and invites
        const { data: members } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_group_id', ownedFamily.id)

        const { data: invites } = await supabase
          .from('family_invites')
          .select('*')
          .eq('family_group_id', ownedFamily.id)
          .eq('status', 'pending')

        const { data: seatAddons } = await supabase
          .from('family_seat_addons')
          .select('*')
          .eq('family_group_id', ownedFamily.id)
          .neq('status', 'cancelled')

        familyStatus = {
          familyGroup: ownedFamily,
          members: members || [],
          pendingInvites: invites || [],
          seatAddons: seatAddons || [],
          isOwner: true,
        }
      } else {
        // Check if user is Family member
        const { data: membership } = await supabase
          .from('family_members')
          .select('*, family_groups(*)')
          .eq('user_id', user.id)
          .maybeSingle()

        if (membership) {
          familyStatus = {
            familyGroup: membership.family_groups,
            membership,
            isOwner: false,
          }
        }
      }
    } catch (err) {
      console.error('[Insights API] Family context error:', err)
      warnings.push('Could not fetch family context')
    }

    // Fetch Smart Inbox candidates (optional table)
    let candidates = []
    try {
      const { data, error } = await supabase
        .from('subscription_candidates')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      if (!error && data) {
        candidates = data
      }
    } catch (err) {
      // subscription_candidates table might not exist yet, that's ok
      console.debug('[Insights API] Candidates fetch skipped')
    }

    // Get user preferences
    let preferences = { currency: 'INR', language: 'en' }
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('currency_code, language')
        .eq('user_id', user.id)
        .maybeSingle()

      if (settings) {
        preferences = {
          currency: settings.currency_code || 'INR',
          language: settings.language || 'en',
        }
      }
    } catch (err) {
      console.debug('[Insights API] Preferences fetch skipped')
    }

    // Build context for insight generation
    const context: InsightGenerationContext = {
      subscriptions,
      familyStatus,
      candidates,
      preferences,
    }

    const insights = await generateAllInsights(context)

    const response = {
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
      count: insights.length,
    }

    if (warnings.length > 0) {
      return NextResponse.json({ ...response, warnings })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Insights API] Unexpected error:', error)

    // Always return 200 with partial insights instead of failing
    return NextResponse.json({
      success: true,
      insights: [],
      generatedAt: new Date().toISOString(),
      warning: 'Could not generate insights',
    })
  }
}
