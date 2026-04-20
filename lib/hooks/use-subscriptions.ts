'use client'

import useSWR, { mutate } from 'swr'
import { useEffect } from 'react'
import useStore from '@/lib/store'
import type { Subscription } from '@/lib/types'

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Map API response to store format
function mapSubscription(sub: Record<string, unknown>): Subscription {
  return {
    id: sub.id as string,
    name: sub.name as string,
    category: (sub.category as string) || 'Other',
    amount: sub.amount as number,
    billingCycle: (sub.billing_cycle as string) || 'monthly',
    renewalDate: sub.renewal_date as string | undefined,
    status: (sub.status as string) || 'active',
    icon: sub.icon as string | undefined,
    color: sub.color as string | undefined,
    description: sub.description as string | undefined,
    website: sub.website as string | undefined,
    notes: sub.notes as string | undefined,
    paymentMethod: sub.payment_method as string | undefined,
    reminders: sub.reminders as boolean | undefined,
    reminderDays: sub.reminder_days as number | undefined,
    lastUsed: sub.last_used as string | undefined,
    isAutoRenew: sub.is_auto_renew as boolean | undefined,
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
    }
  )

  // Sync to store whenever data changes
  useEffect(() => {
    if (data?.subscriptions) {
      const mapped = data.subscriptions.map(mapSubscription)
      setSubscriptions(mapped)
    }
  }, [data, setSubscriptions])

  return {
    subscriptions: data?.subscriptions?.map(mapSubscription) || [],
    isLoading,
    error,
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
