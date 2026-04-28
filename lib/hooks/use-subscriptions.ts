'use client'

import useSWR, { mutate } from 'swr'
import { useEffect, useMemo } from 'react'
import useStore from '@/lib/store'
import type { Subscription, SubscriptionStatus, BillingCycle, SubscriptionCategory } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }

  return res.json()
}

function normalizeSubscription(sub: Record<string, unknown>): Subscription | null {
  try {
    const id = String(sub.id ?? '')
    const name = String(sub.name ?? 'Unknown Subscription')

    const amount = (() => {
      const num = Number(sub.amount ?? 0)
      return Number.isFinite(num) && num >= 0 ? num : 0
    })()

    const billingCycleRaw = sub.billing_cycle ?? sub.billingCycle ?? 'monthly'
    const validCycles: BillingCycle[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    const billingCycle = validCycles.includes(billingCycleRaw as BillingCycle)
      ? (billingCycleRaw as BillingCycle)
      : 'monthly'

    const renewalDateRaw = sub.renewal_date ?? sub.renewalDate
    let renewalDate: string | undefined = undefined

    if (typeof renewalDateRaw === 'string' && renewalDateRaw.trim()) {
      const parsed = new Date(renewalDateRaw)
      if (!Number.isNaN(parsed.getTime())) {
        renewalDate = renewalDateRaw
      }
    }

    const statusRaw = sub.status ?? 'active'
    const validStatuses: SubscriptionStatus[] = ['active', 'paused', 'unused', 'cancelled']
    const status = validStatuses.includes(statusRaw as SubscriptionStatus)
      ? (statusRaw as SubscriptionStatus)
      : 'active'

    const categoryRaw = sub.category ?? 'Other'
    const validCategories: SubscriptionCategory[] = [
      'Streaming',
      'Entertainment', // legacy
      'Music',
      'Productivity',
      'Cloud & Storage',
      'Storage', // legacy
      'AI & Tools',
      'Fitness',
      'News & Media',
      'News & Magazines', // legacy
      'Gaming',
      'Utilities',
      'Services',
      'Home Services', // legacy
      'Finance',
      'Shopping',
      'Education',
      'Security',
      'Office', // legacy
      'Other',
    ]
    const category = validCategories.includes(categoryRaw as SubscriptionCategory)
      ? (categoryRaw as SubscriptionCategory)
      : typeof categoryRaw === 'string' && categoryRaw.trim()
        ? (categoryRaw.trim() as SubscriptionCategory)
        : 'Other'

    const currency = String(sub.currency ?? 'INR')

    const icon = typeof sub.icon === 'string'
      ? sub.icon
      : typeof sub.logo === 'string'
        ? sub.logo
        : undefined

    const logo = typeof sub.logo === 'string' ? sub.logo : undefined
    const color = typeof sub.color === 'string' ? sub.color : undefined
    const description = typeof sub.description === 'string' ? sub.description : undefined
    const website = typeof sub.website === 'string' ? sub.website : undefined
    const notes = typeof sub.notes === 'string' ? sub.notes : undefined

    const paymentMethod =
      typeof sub.payment_method === 'string'
        ? sub.payment_method
        : typeof sub.paymentMethod === 'string'
          ? sub.paymentMethod
          : undefined

    const reminders = typeof sub.reminders === 'boolean' ? sub.reminders : undefined
    const isAutoRenew =
      typeof sub.is_auto_renew === 'boolean'
        ? sub.is_auto_renew
        : typeof sub.isAutoRenew === 'boolean'
          ? sub.isAutoRenew
          : undefined

    const reminderDays =
      typeof sub.reminder_days === 'number'
        ? sub.reminder_days
        : typeof sub.reminderDays === 'number'
          ? sub.reminderDays
          : undefined

    const lastUsed =
      typeof sub.last_used === 'string'
        ? sub.last_used
        : typeof sub.lastUsed === 'string'
          ? sub.lastUsed
          : undefined

    // System-managed subscription fields (F1.1+F2)
    const isSystemManaged =
      typeof sub.is_system_managed === 'boolean'
        ? sub.is_system_managed
        : typeof sub.isSystemManaged === 'boolean'
          ? sub.isSystemManaged
          : false

    const managedPlan =
      typeof sub.managed_plan === 'string'
        ? (sub.managed_plan as 'pro' | 'family')
        : typeof sub.managedPlan === 'string'
          ? (sub.managedPlan as 'pro' | 'family')
          : undefined

    const systemSource =
      typeof sub.system_source === 'string'
        ? (sub.system_source as 'renewly_billing')
        : typeof sub.systemSource === 'string'
          ? (sub.systemSource as 'renewly_billing')
          : undefined

    const managedSubscriptionKey =
      typeof sub.managed_subscription_key === 'string'
        ? sub.managed_subscription_key
        : typeof sub.managedSubscriptionKey === 'string'
          ? sub.managedSubscriptionKey
          : undefined

    const billingOwnerUserId =
      typeof sub.billing_owner_user_id === 'string'
        ? sub.billing_owner_user_id
        : typeof sub.billingOwnerUserId === 'string'
          ? sub.billingOwnerUserId
          : undefined

    const familyGroupId =
      typeof sub.family_group_id === 'string'
        ? sub.family_group_id
        : typeof sub.familyGroupId === 'string'
          ? sub.familyGroupId
          : undefined

    const coveredByFamily =
      typeof sub.covered_by_family === 'boolean'
        ? sub.covered_by_family
        : typeof sub.coveredByFamily === 'boolean'
          ? sub.coveredByFamily
          : false

    const systemMetadata =
      typeof sub.system_metadata === 'object' && sub.system_metadata !== null
        ? (sub.system_metadata as Record<string, unknown>)
        : typeof sub.systemMetadata === 'object' && sub.systemMetadata !== null
          ? (sub.systemMetadata as Record<string, unknown>)
          : undefined

    if (!id || !name) {
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
      isSystemManaged,
      managedPlan,
      systemSource,
      managedSubscriptionKey,
      billingOwnerUserId,
      familyGroupId,
      coveredByFamily,
      systemMetadata,
    }
  } catch (error) {
    console.warn('[subscriptions] normalize failed', error, sub)
    return null
  }
}

export function useSubscriptions() {
  const setSubscriptions = useStore((state) => state.setSubscriptions)

  const { data, error, isLoading, mutate: revalidate } = useSWR<{ subscriptions?: Record<string, unknown>[] }>(
    '/api/subscriptions',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
    }
  )

  const normalizedSubscriptions = useMemo(() => {
    const rawSubscriptions = Array.isArray(data?.subscriptions) ? data!.subscriptions : []

    return rawSubscriptions
      .map(normalizeSubscription)
      .filter((sub): sub is Subscription => sub !== null)
  }, [data])

  useEffect(() => {
    if (!data) return

    // Always write a safe array to the store.
    // This prevents stale broken data from staying in Zustand/local storage.
    setSubscriptions(normalizedSubscriptions)
  }, [data, normalizedSubscriptions, setSubscriptions])

  return {
    subscriptions: normalizedSubscriptions,
    isLoading,
    error,
    revalidate,
  }
}

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

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(payload?.error || 'Failed to create subscription')
  }

  await mutate('/api/subscriptions')
  return payload
}

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

  await mutate('/api/subscriptions')
  return res.json()
}

export async function deleteSubscription(id: string) {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    throw new Error('Failed to delete subscription')
  }

  await mutate('/api/subscriptions')
  return res.json()
}
