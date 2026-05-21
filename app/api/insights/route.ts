import { NextResponse } from 'next/server'
import { generateAllInsights } from '@/lib/insights/insight-engine'
import type { InsightGenerationContext } from '@/lib/insights/insight-types'

/**
 * GET /api/insights
 * Generate insights for the current user based on their app data
 *
 * Returns partial insights if optional data sources fail
 * Never returns 500 - always returns 200 with whatever insights could be generated
 */
export async function GET() {
  try {
    // TODO: In production, fetch real user data from database
    // For now, return empty context as placeholder

    const context: InsightGenerationContext = {
      // Data would be fetched from:
      // - Supabase family_members, family_seat_addons
      // - subscriptions table
      // - smart_capture_candidates table
      // - integrations status
      // - analytics calculations
      preferences: {
        currency: 'INR',
        language: 'en',
      },
    }

    const insights = await generateAllInsights(context)

    return NextResponse.json({
      success: true,
      insights,
      generatedAt: new Date().toISOString(),
      count: insights.length,
    })
  } catch (error) {
    console.error('[Insights API] Error:', error)

    // Always return 200 with partial insights instead of failing
    return NextResponse.json({
      success: true,
      insights: [],
      generatedAt: new Date().toISOString(),
      warning: 'Partial insights generation',
    })
  }
}
