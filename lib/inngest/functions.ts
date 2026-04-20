import { inngest } from './client'
import { createClient } from '@/lib/supabase/server'
import { invalidateUserCaches } from '@/lib/redis'

// Process incoming email and extract subscription candidates
export const processEmail = inngest.createFunction(
  { id: 'process-email', name: 'Process Email for Subscriptions' },
  { event: 'smart-capture/email.received' },
  async ({ event, step }) => {
    const { userId, accountId, emailId, from, subject, body, receivedAt, provider } = event.data

    // Step 1: Create ingestion event
    const ingestionEvent = await step.run('create-ingestion-event', async () => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('ingestion_events')
        .insert({
          user_id: userId,
          account_id: accountId,
          source_type: 'email',
          source_provider: provider,
          external_id: emailId,
          raw_content: { from, subject, body },
          metadata: { receivedAt },
          status: 'processing',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    // Step 2: Parse email content for subscription info
    const parseResult = await step.run('parse-email', async () => {
      // Known subscription email patterns
      const patterns = {
        receipt: /receipt|invoice|payment|charged|billing/i,
        subscription: /subscription|renewal|recurring|monthly|annual|yearly/i,
        trial: /trial|free trial|trial ending|trial expires/i,
        cancellation: /cancel|cancelled|cancellation|unsubscribe/i,
      }

      // Check if this looks like a subscription-related email
      const content = `${subject} ${body}`.toLowerCase()
      const isSubscriptionRelated = 
        patterns.receipt.test(content) ||
        patterns.subscription.test(content) ||
        patterns.trial.test(content)

      if (!isSubscriptionRelated) {
        return { isCandidate: false, reason: 'not_subscription_related' }
      }

      // Extract provider name from sender
      const providerMatch = from.match(/@([^.]+)\./)
      const providerName = providerMatch ? providerMatch[1] : from.split('@')[1]?.split('.')[0] || 'Unknown'

      // Extract amount using regex
      const amountPatterns = [
        /\$([0-9]+(?:\.[0-9]{2})?)/,
        /USD\s*([0-9]+(?:\.[0-9]{2})?)/,
        /([0-9]+(?:\.[0-9]{2})?)\s*USD/,
        /€([0-9]+(?:,[0-9]{2})?)/,
        /£([0-9]+(?:\.[0-9]{2})?)/,
      ]

      let amount: number | null = null
      let currency = 'USD'
      
      for (const pattern of amountPatterns) {
        const match = content.match(pattern)
        if (match) {
          amount = parseFloat(match[1].replace(',', '.'))
          if (pattern.source.includes('€')) currency = 'EUR'
          if (pattern.source.includes('£')) currency = 'GBP'
          break
        }
      }

      // Detect billing cycle
      let billingCycle = 'monthly'
      if (/annual|yearly|year|12.?month/i.test(content)) {
        billingCycle = 'yearly'
      } else if (/weekly|week/i.test(content)) {
        billingCycle = 'weekly'
      } else if (/quarter/i.test(content)) {
        billingCycle = 'quarterly'
      }

      // Calculate confidence
      let confidence = 0.5
      if (amount) confidence += 0.2
      if (patterns.receipt.test(content)) confidence += 0.15
      if (patterns.subscription.test(content)) confidence += 0.1
      if (providerName !== 'Unknown') confidence += 0.05
      confidence = Math.min(confidence, 0.99)

      // Detect tags
      const tags: string[] = []
      if (patterns.trial.test(content)) tags.push('trial')
      if (patterns.cancellation.test(content)) tags.push('cancellation')
      if (/upgrade|premium|pro/i.test(content)) tags.push('upgrade')
      if (/renew/i.test(content)) tags.push('renewal')

      return {
        isCandidate: true,
        providerName,
        amount,
        currency,
        billingCycle,
        confidence,
        tags,
        isTrial: patterns.trial.test(content),
      }
    })

    // Step 3: Create candidate if applicable
    if (parseResult.isCandidate) {
      await step.run('create-candidate', async () => {
        const supabase = await createClient()
        
        const { error } = await supabase
          .from('subscription_candidates')
          .insert({
            user_id: userId,
            ingestion_event_id: ingestionEvent.id,
            provider_name: parseResult.providerName,
            amount: parseResult.amount,
            currency: parseResult.currency,
            billing_cycle: parseResult.billingCycle,
            confidence_score: parseResult.confidence,
            tags: parseResult.tags,
            is_trial: parseResult.isTrial,
            evidence: {
              from,
              subject,
              snippet: body.substring(0, 500),
            },
            status: 'new',
          })

        if (error) throw error

        // Update ingestion event status
        await supabase
          .from('ingestion_events')
          .update({ status: 'processed' })
          .eq('id', ingestionEvent.id)

        // Invalidate caches
        await invalidateUserCaches(userId)
      })
    } else {
      // Mark as skipped
      await step.run('mark-skipped', async () => {
        const supabase = await createClient()
        await supabase
          .from('ingestion_events')
          .update({ 
            status: 'skipped',
            metadata: { ...ingestionEvent.metadata, skipReason: parseResult.reason }
          })
          .eq('id', ingestionEvent.id)
      })
    }

    return { success: true, isCandidate: parseResult.isCandidate }
  }
)

// Process notification lab submission
export const processNotification = inngest.createFunction(
  { id: 'process-notification', name: 'Process Notification for Subscriptions' },
  { event: 'smart-capture/notification.received' },
  async ({ event, step }) => {
    const { userId, title, body, appName, receivedAt, source } = event.data

    // Step 1: Create ingestion event
    const ingestionEvent = await step.run('create-ingestion-event', async () => {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('ingestion_events')
        .insert({
          user_id: userId,
          source_type: 'notification',
          source_provider: source,
          raw_content: { title, body, appName },
          metadata: { receivedAt },
          status: 'processing',
        })
        .select()
        .single()

      if (error) throw error
      return data
    })

    // Step 2: Parse notification
    const parseResult = await step.run('parse-notification', async () => {
      const content = `${title} ${body}`.toLowerCase()
      
      // Check for subscription indicators
      const isSubscriptionRelated = 
        /charged|payment|receipt|subscription|renewal|trial/i.test(content)

      if (!isSubscriptionRelated) {
        return { isCandidate: false, reason: 'not_subscription_related' }
      }

      // Extract amount
      const amountMatch = content.match(/\$([0-9]+(?:\.[0-9]{2})?)/)
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null

      // Detect billing cycle
      let billingCycle = 'monthly'
      if (/annual|yearly/i.test(content)) billingCycle = 'yearly'

      // Calculate confidence (notifications are generally lower confidence)
      let confidence = 0.4
      if (amount) confidence += 0.2
      if (/charged|payment/i.test(content)) confidence += 0.15
      confidence = Math.min(confidence, 0.85)

      return {
        isCandidate: true,
        providerName: appName || 'Unknown App',
        amount,
        currency: 'USD',
        billingCycle,
        confidence,
        tags: ['notification'],
        isTrial: /trial/i.test(content),
      }
    })

    // Step 3: Create candidate if applicable
    if (parseResult.isCandidate) {
      await step.run('create-candidate', async () => {
        const supabase = await createClient()
        
        await supabase
          .from('subscription_candidates')
          .insert({
            user_id: userId,
            ingestion_event_id: ingestionEvent.id,
            provider_name: parseResult.providerName,
            amount: parseResult.amount,
            currency: parseResult.currency,
            billing_cycle: parseResult.billingCycle,
            confidence_score: parseResult.confidence,
            tags: parseResult.tags,
            is_trial: parseResult.isTrial,
            evidence: { title, body, appName },
            status: 'new',
          })

        await supabase
          .from('ingestion_events')
          .update({ status: 'processed' })
          .eq('id', ingestionEvent.id)

        await invalidateUserCaches(userId)
      })
    }

    return { success: true, isCandidate: parseResult.isCandidate }
  }
)

// Scheduled sync for Gmail accounts
export const syncGmailAccounts = inngest.createFunction(
  { id: 'sync-gmail-accounts', name: 'Sync Gmail Accounts' },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step }) => {
    const supabase = await createClient()
    
    // Get all active Gmail accounts
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('id, user_id')
      .eq('provider', 'gmail')
      .eq('status', 'active')

    if (!accounts?.length) return { synced: 0 }

    // Trigger sync for each account
    for (const account of accounts) {
      await step.sendEvent(`sync-gmail-${account.id}`, {
        name: 'smart-capture/sync.gmail',
        data: {
          userId: account.user_id,
          accountId: account.id,
        },
      })
    }

    return { synced: accounts.length }
  }
)

// Scheduled sync for Outlook accounts
export const syncOutlookAccounts = inngest.createFunction(
  { id: 'sync-outlook-accounts', name: 'Sync Outlook Accounts' },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step }) => {
    const supabase = await createClient()
    
    // Get all active Outlook accounts
    const { data: accounts } = await supabase
      .from('connected_accounts')
      .select('id, user_id')
      .eq('provider', 'outlook')
      .eq('status', 'active')

    if (!accounts?.length) return { synced: 0 }

    // Trigger sync for each account
    for (const account of accounts) {
      await step.sendEvent(`sync-outlook-${account.id}`, {
        name: 'smart-capture/sync.outlook',
        data: {
          userId: account.user_id,
          accountId: account.id,
        },
      })
    }

    return { synced: accounts.length }
  }
)

// Export all functions
export const functions = [
  processEmail,
  processNotification,
  syncGmailAccounts,
  syncOutlookAccounts,
]
