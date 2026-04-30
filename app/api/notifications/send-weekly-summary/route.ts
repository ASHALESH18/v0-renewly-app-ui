'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWeeklySummaryEmail, formatSubscriptionMoney } from '@/lib/email/resend'

/**
 * POST /api/notifications/send-weekly-summary
 *
 * Protected cron endpoint to send weekly subscription summary emails
 * Runs once per week (Monday) to send users their subscription summary
 *
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Server-side only
 * - Respects user email notification settings
 * - Dedupes summaries (one per user per week)
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[send-weekly-summary] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify CRON_SECRET
    const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || !cronSecret || cronSecret !== expectedSecret) {
      console.warn('[v0] Unauthorized cron call to send-weekly-summary')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all profiles with email notifications enabled
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(1000)

    if (profileError) throw profileError

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        processedProfiles: 0,
        sent: 0,
        message: 'No profiles found',
      })
    }

    let summariesSent = 0
    let processedProfiles = 0
    let skippedDisabledEmail = 0
    let skippedAlreadySent = 0

    // Calculate this week's date range for deduping
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    for (const profile of profiles) {
      try {
        processedProfiles++

        // Get user settings
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('email_notifications, currency_code')
          .eq('user_id', profile.id)
          .single()

        if (settingsError || !settings) {
          console.warn(`[v0] Could not fetch settings for ${profile.id}`)
          continue
        }

        // Skip if email notifications disabled
        if (!settings.email_notifications) {
          skippedDisabledEmail++
          continue
        }

        // Check if summary already sent this week
        const summaryKey = `${profile.id}-weekly-summary-${weekStartStr}`
        const { data: existingDelivery } = await supabase
          .from('notification_deliveries')
          .select('id')
          .eq('unique_key', summaryKey)
          .single()

        if (existingDelivery) {
          skippedAlreadySent++
          continue
        }

        // Get user's subscriptions for summary
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id, name, renewal_date, amount, currency, status, category, billing_cycle')
          .eq('user_id', profile.id)

        if (subError) {
          console.warn(`[v0] Could not fetch subscriptions for ${profile.id}`)
          continue
        }

        // Calculate summary metrics
        const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || []
        let monthlySpend = 0
        const upcomingRenewals7Days: string[] = []
        const upcomingRenewals30Days: string[] = []
        let categorySpends: Record<string, number> = {}

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (const sub of activeSubscriptions) {
          if (!sub.renewal_date || !sub.amount) continue

          // Calculate monthly spend
          if (sub.billing_cycle === 'monthly') {
            monthlySpend += sub.amount
          } else if (sub.billing_cycle === 'yearly') {
            monthlySpend += sub.amount / 12
          } else if (sub.billing_cycle === 'weekly') {
            monthlySpend += sub.amount * 4.33
          } else if (sub.billing_cycle === 'daily') {
            monthlySpend += sub.amount * 30
          }

          // Track category spending
          categorySpends[sub.category || 'Other'] = (categorySpends[sub.category || 'Other'] || 0) + sub.amount

          // Check upcoming renewals
          const renewalDate = new Date(sub.renewal_date)
          renewalDate.setHours(0, 0, 0, 0)

          if (isNaN(renewalDate.getTime())) continue

          const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntil > 0 && daysUntil <= 7) {
            upcomingRenewals7Days.push(sub.name)
          }
          if (daysUntil > 0 && daysUntil <= 30) {
            upcomingRenewals30Days.push(sub.name)
          }
        }

        // Find top category
        let topCategory = 'General'
        let topCategorySpend = 0
        for (const [category, spend] of Object.entries(categorySpends)) {
          if (spend > topCategorySpend) {
            topCategory = category
            topCategorySpend = spend
          }
        }

        // Calculate potential savings (paused/unused/cancelled)
        const inactiveSubscriptions = subscriptions?.filter(
          s => s.status === 'paused' || s.status === 'unused' || s.status === 'cancelled'
        ) || []
        let potentialSavings = 0
        for (const sub of inactiveSubscriptions) {
          if (sub.billing_cycle === 'monthly') {
            potentialSavings += sub.amount
          } else if (sub.billing_cycle === 'yearly') {
            potentialSavings += sub.amount / 12
          }
        }

        // Format amounts using currency
        const currency = settings.currency_code || 'USD'
        const monthlySpendStr = formatSubscriptionMoney(currency, monthlySpend)
        const potentialSavingsStr = formatSubscriptionMoney(currency, potentialSavings)

        // Send email
        const summaryData = {
          monthlySpend: monthlySpendStr,
          activeSubscriptionCount: activeSubscriptions.length,
          upcomingRenewals7Days: upcomingRenewals7Days.length,
          upcomingRenewals30Days: upcomingRenewals30Days.length,
          potentialSavings: potentialSavingsStr,
          topCategory,
        }

        const userName = profile.full_name || profile.email.split('@')[0]
        const emailResult = await sendWeeklySummaryEmail(profile.email, userName, summaryData)

        if (emailResult.success) {
          // Record delivery for deduping
          await supabase.from('notification_deliveries').insert({
            user_id: profile.id,
            subscription_id: null,
            channel: 'email',
            notification_type: 'weekly_summary',
            summary_week_start: weekStartStr,
            unique_key: summaryKey,
            sent_at: new Date().toISOString(),
          }).catch(err => {
            console.warn(`[v0] Could not record summary delivery: ${err.message}`)
          })

          summariesSent++
          console.log(`[v0] Weekly summary sent: ${profile.email}`)
        } else {
          console.warn(`[v0] Failed to send weekly summary: ${emailResult.error}`)
        }
      } catch (err) {
        console.error(`[v0] Error processing profile ${profile.id}:`, err)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      processedProfiles,
      sent: summariesSent,
      skippedDisabledEmail,
      skippedAlreadySent,
      message: `Processed ${processedProfiles} profiles, sent ${summariesSent} summaries`,
    })
  } catch (error) {
    console.error('[v0] Send weekly summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
