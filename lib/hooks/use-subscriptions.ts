'use client'

import useSWR, { mutate } from 'swr'
import { useEffect } from 'react'
import useStore from '@/lib/store'
import type { Subscription, SubscriptionStatus, BillingCycle, SubscriptionCategory } from '@/lib/types'

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Defensively normalize subscription data from API
 * Handles both snake_case (from DB) and camelCase (from previous state)
 * Safely coerces types and skips malformed entries
 */
function normalizeSubscription(sub: Record<string, unknown>): Subscription | null {
  try {
    // Extract fields with support for both snake_case and camelCase
    const id = String(sub.id ?? '')
    const name = String(sub.name ?? 'Unknown Subscription')
    
    // Amount: coerce to number, default to 0
    const amount = (() => {
      const val = sub.amount ?? sub.amount
      const num = Number(val)
      return isNaN(num) || num < 0 ? 0 : num
    })()

    // Billing cycle: validate against known types
    const billingCycleRaw = sub.billing_cycle ?? sub.billingCycle ?? 'monthly'
    const validCycles: BillingCycle[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    const billingCycle = validCycles.includes(billingCycleRaw as BillingCycle) 
      ? (billingCycleRaw as BillingCycle)
      : 'monthly'

    // Renewal date: parse safely, skip if invalid
    const renewalDateRaw = sub.renewal_date ?? sub.renewalDate
    let renewalDate: string | undefined = undefined
    if (renewalDateRaw && typeof renewalDateRaw === 'string') {
      try {
        // Validate it's a valid date
        const parsed = new Date(renewalDateRaw)
        if (!isNaN(parsed.getTime())) {
          renewalDate = renewalDateRaw
        }
      } catch {
        // Invalid date, skip silently
      }
    }

    // Status: validate against known types
    const statusRaw = sub.status ?? 'active'
    const validStatuses: SubscriptionStatus[] = ['active', 'paused', 'unused', 'cancelled']
    const status = validStatuses.includes(statusRaw as SubscriptionStatus)
      ? (statusRaw as SubscriptionStatus)
      : 'active'

    // Category: validate and coerce
    const categoryRaw = sub.category ?? 'Other'
    const validCategories: SubscriptionCategory[] = [
      'Entertainment', 'Music', 'Productivity', 'Storage', 'AI & Tools',
      'Fitness', 'News & Magazines', 'Office', 'Other'
    ]
    const category = validCategories.includes(categoryRaw as SubscriptionCategory)
      ? (categoryRaw as SubscriptionCategory)
      : 'Other'

    // Currency: default to empty string if not provided
    const currency = String(sub.currency ?? '')

    // Optional string fields
    const icon = typeof sub.icon === 'string' ? sub.icon : (typeof sub.logo === 'string' ? sub.logo : undefined)
    const logo = typeof sub.logo === 'string' ? sub.logo : undefined
    const color = typeof sub.color === 'string' ? sub.color : undefined
    const description = typeof sub.description === 'string' ? sub.description : undefined
    const website = typeof sub.website === 'string' ? sub.website : undefined
    const notes = typeof sub.notes === 'string' ? sub.notes : undefined
    const paymentMethod = typeof sub.payment_method === 'string' ? sub.payment_method : undefined

    // Optional boolean fields
    const reminders = typeof sub.reminders === 'boolean' ? sub.reminders : undefined
    const isAutoRenew = typeof sub.is_auto_renew === 'boolean' ? sub.is_auto_renew : undefined

    // Optional number fields
    const reminderDays = typeof sub.reminder_days === 'number' ? sub.reminder_days : undefined
    const lastUsed = typeof sub.last_used === 'string' ? sub.last_used : undefined

    // Require critical fields
    if (!id || !name) {
      console.warn('[v0] Skipping malformed subscription (missing id or name)', sub)
      return null
    }

    return {
      id,
      name,
      category,
      amount,
      billingCycle,
      renewalDate,
      status,
      icon,
      logo,
      color,
      description,
      website,
      notes,
      paymentMethod,
      reminders,
      reminderDays,
      lastUsed,
      isAutoRenew,
      currency,
    }
  } catch (error) {
    console.warn('[v0] Error normalizing subscription:', error, sub)
    return null
  }
}

export function useSubscriptions() {
  const setSubscriptions = useStore((state) => state.setSubscriptions)
  
  // Fetch subscriptions from API
  const { data, error, isLoading, mutate: revalidate } = useSWR<{ subscriptions: Record<string, unknown>[] }>(
    '/api/subscriptions',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      onError: (err) => {
        console.error('[v0] Failed to fetch subscriptions:', err)
      },
    }
  )

  // Sync to store whenever data changes
  useEffect(() => {
    if (data?.subscriptions && Array.isArray(data.subscriptions)) {
      // Normalize all subscriptions, filter out malformed ones
      const normalized = data.subscriptions
        .map(normalizeSubscription)
        .filter((sub): sub is Subscription => sub !== null)
      
      // Only update if we have valid subscriptions
      if (normalized.length > 0 || data.subscriptions.length === 0) {
        setSubscriptions(normalized)
      } else {
        console.warn('[v0] All subscriptions were malformed, not updating store')
      }
    }
  }, [data, setSubscriptions])

  // Handle 401 errors gracefully - user may not be authenticated yet
  const isAuthError = error?.status === 401 || (error && error.message?.includes('401'))
  
  return {
    subscriptions: data?.subscriptions
      ? data.subscriptions
          .map(normalizeSubscription)
          .filter((sub): sub is Subscription => sub !== null)
      : [],
    isLoading,
    error: isAuthError ? null : error,
    isAuthError,
    revalidate,
  }
}

// Create a new subscription
export async function createSubscription(data: Partial<Subscription>) {
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'INR',
      billing_cycle: data.billingCycle,
      renewal_date: data.renewalDate,
      description: data.description,
      status: data.status,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to create subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}

// Update a subscription
export async function updateSubscription(id: string, data: Partial<Subscription>) {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      amount: data.amount,
      billing_cycle: data.billingCycle,
      renewal_date: data.renewalDate,
      description: data.description,
      status: data.status,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to update subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}

// Delete a subscription
export async function deleteSubscription(id: string) {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to delete subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}

// Create a new subscription
export async function createSubscription(data: Partial<Subscription>) {
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      amount: data.amount,
      currency: 'INR', // Could be from preferences
      billing_cycle: data.billingCycle,
      renewal_date: data.renewalDate,
      description: data.description,
      status: data.status,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to create subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}

// Update a subscription
export async function updateSubscription(id: string, data: Partial<Subscription>) {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      category: data.category,
      amount: data.amount,
      billing_cycle: data.billingCycle,
      renewal_date: data.renewalDate,
      description: data.description,
      status: data.status,
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to update subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}

// Delete a subscription
export async function deleteSubscription(id: string) {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to delete subscription')
  }

  // Revalidate the subscriptions list
  await mutate('/api/subscriptions')

  return res.json()
}
