// N2: Generate renewal reminder notifications with deduplication

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/supabase/repositories/notifications'
import { NOTIFICATION_TEMPLATES } from './notification-types'
import type { SubscriptionRow } from '@/lib/supabase/database.types'

interface RenewalWindow {
  type: 'renewal_7day' | 'renewal_3day' | 'renewal_1day' | 'renewal_today'
  daysAway: number
}

// N2: Determine which renewal window a subscription falls into
function getRenewalWindow(renewalDate: string): RenewalWindow | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const renewal = new Date(renewalDate)
  renewal.setHours(0, 0, 0, 0)
  
  const daysAway = Math.floor((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysAway === 7) return { type: 'renewal_7day', daysAway: 7 }
  if (daysAway === 3) return { type: 'renewal_3day', daysAway: 3 }
  if (daysAway === 1) return { type: 'renewal_1day', daysAway: 1 }
  if (daysAway === 0) return { type: 'renewal_today', daysAway: 0 }
  
  return null
}

// N2: Generate renewal reminders for subscriptions renewing within 7 days
export async function generateRenewalReminders(userId: string, subscriptions: SubscriptionRow[]) {
  const supabase = await createClient()
  const reminders = []
  
  for (const sub of subscriptions) {
    if (!sub.renewal_date || sub.status !== 'active') continue
    
    const window = getRenewalWindow(sub.renewal_date)
    if (!window) continue
    
    // Format renewal date for display
    const renewalDate = new Date(sub.renewal_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    
    const template = NOTIFICATION_TEMPLATES[window.type]
    const metadata = {
      subscription_id: sub.id,
      name: sub.name,
      amount: sub.amount,
      renewalDate,
      managed_plan: sub.managed_plan,
    }
    
    // N2: Dedup using (user_id, source, source_id) - source is 'renewal', source_id is subscription ID + window
    const sourceId = `${sub.id}:${window.type}`
    
    try {
      await createNotification({
        user_id: userId,
        type: window.type,
        source: 'renewal',
        source_id: sourceId,
        title: template.title(metadata),
        message: template.message(metadata),
        category: template.category,
        priority: template.priority,
        action_url: template.actionUrl?.(metadata),
        metadata,
        expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
      })
      
      reminders.push({
        subscription_id: sub.id,
        type: window.type,
        created: true,
      })
    } catch (error) {
      console.warn(`[N2] Failed to create renewal reminder for ${sub.id}:`, error)
    }
  }
  
  return reminders
}

// N2: Generate trial ending notifications
export async function generateTrialNotifications(userId: string, profile: { trial_ends_at?: string }) {
  if (!profile.trial_ends_at) return []
  
  const supabase = await createClient()
  const trialEnds = new Date(profile.trial_ends_at)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const daysAway = Math.floor((trialEnds.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  let notificationType: 'trial_ending_3day' | 'trial_ending_1day' | 'trial_ended' | null = null
  
  if (daysAway === 3) notificationType = 'trial_ending_3day'
  else if (daysAway === 1) notificationType = 'trial_ending_1day'
  else if (daysAway === 0) notificationType = 'trial_ended'
  
  if (!notificationType) return []
  
  const template = NOTIFICATION_TEMPLATES[notificationType]
  
  try {
    await createNotification({
      user_id: userId,
      type: notificationType,
      source: 'trial',
      source_id: `trial:${notificationType}`,
      title: template.title({}),
      message: template.message({}),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.({}),
      metadata: { trial_ends_at: profile.trial_ends_at },
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
    
    return [{ type: notificationType, created: true }]
  } catch (error) {
    console.warn('[N2] Failed to create trial notification:', error)
    return []
  }
}
