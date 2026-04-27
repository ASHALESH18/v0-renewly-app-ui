'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionReminderEmail, formatSubscriptionMoney } from '@/lib/email/resend'
import { getDaysUntilRenewal } from '@/lib/subscription-math'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/notifications/send-reminders
 * 
 * Protected cron endpoint to send subscription reminder emails
 * Runs daily to check for upcoming renewals and send emails
 * 
 * Security:
 * - Requires CRON_SECRET in Authorization header
 * - Server-side only
 * - Respects user email notification settings
 * - Dedupes reminders (never sends same reminder twice)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const cronSecret = request.headers.get('Authorization')?.replace('Bearer ', '')
    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret || !cronSecret || cronSecret !== expectedSecret) {
      console.warn('[v0] Unauthorized cron call to send-reminders')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all profiles with email notifications enabled
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1000) // Process in batches if needed

    if (profileError) throw profileError

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        sent: 0,
        message: 'No profiles found',
      })
    }

    let remindersSent = 0
    let processedProfiles = 0

    for (const profile of profiles) {
      try {
        processedProfiles++

        // Get user settings to check if email notifications are enabled
        const { data: settings, error: settingsError } = await supabase
          .from('user_settings')
          .select('email_notifications, reminder_days')
          .eq('user_id', profile.id)
          .single()

        if (settingsError || !settings) {
          console.warn(`[v0] Could not fetch settings for ${profile.id}`)
          continue
        }

        // Skip if email notifications are disabled
        if (!settings.email_notifications) {
          continue
        }

        const reminderDays = settings.reminder_days || 3

        // Get user's subscriptions
        const { data: subscriptions, error: subError } = await supabase
          .from('subscriptions')
          .select('id, name, renewal_date, amount, currency, status, user_id')
          .eq('user_id', profile.id)
          .eq('status', 'active')

        if (subError) {
          console.warn(`[v0] Could not fetch subscriptions for ${profile.id}`)
          continue
        }

        if (!subscriptions || subscriptions.length === 0) {
          continue
        }

        // Check each subscription for upcoming renewals
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (const sub of subscriptions) {
          try {
            if (!sub.renewal_date) continue

            // Calculate days until renewal
            const renewalDate = new Date(sub.renewal_date)
            renewalDate.setHours(0, 0, 0, 0)

            if (isNaN(renewalDate.getTime())) continue

            const daysUntil = Math.ceil(
              (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )

            // Only send reminders for specified reminder days
            if (daysUntil !== reminderDays) {
              continue
            }

            // Check if reminder was already sent (deduping)
            const reminderKey = `${profile.id}-${sub.id}-email-${today.toISOString().split('T')[0]}`
            const { data: existingDelivery, error: deliveryError } = await supabase
              .from('notification_deliveries')
              .select('id')
              .eq('unique_key', reminderKey)
              .single()

            if (existingDelivery) {
              // Reminder already sent today, skip
              continue
            }

            // Format amount with currency
            const amount = formatSubscriptionMoney(sub.currency || 'USD', Number(sub.amount || 0))

            // Send email
            const emailResult = await sendSubscriptionReminderEmail(
              profile.email,
              profile.email.split('@')[0],
              sub.name || 'Unknown',
              renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              amount
            )

            if (emailResult.success) {
              // Record delivery for deduping
              await supabase.from('notification_deliveries').insert({
                user_id: profile.id,
                subscription_id: sub.id,
                channel: 'email',
                reminder_date: today.toISOString().split('T')[0],
                unique_key: reminderKey,
                sent_at: new Date().toISOString(),
              }).catch(err => {
                console.warn(`[v0] Could not record delivery: ${err.message}`)
              })

              remindersSent++
              console.log(`[v0] Reminder sent: ${profile.email} for ${sub.name}`)
            } else {
              console.warn(`[v0] Failed to send reminder: ${emailResult.error}`)
            }
          } catch (err) {
            console.error(`[v0] Error processing subscription ${sub.id}:`, err)
            continue
          }
        }
      } catch (err) {
        console.error(`[v0] Error processing profile ${profile.id}:`, err)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedProfiles,
      sent: remindersSent,
      message: `Processed ${processedProfiles} profiles, sent ${remindersSent} reminders`,
    })
  } catch (error) {
    console.error('[v0] Send reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}
