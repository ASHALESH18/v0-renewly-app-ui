'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function createSubscription(data: {
  name: string
  category: string
  amount: number
  currency: string
  billingCycle: string
  nextRenewalDate: string
  description?: string
  notes?: string
}) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        name: data.name,
        category: data.category,
        price: data.amount,
        currency: data.currency,
        billing_cycle: data.billingCycle,
        next_renewal_date: data.nextRenewalDate,
        description: data.description,
        notes: data.notes,
        is_active: true,
      })
      .select()

    if (error) throw error

    revalidateTag('subscriptions')
    return { success: true, data: subscription }
  } catch (error) {
    console.error('[v0] Create subscription error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSubscription(id: string, data: Partial<{
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextRenewalDate: string
  notes?: string
}>) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('subscriptions')
      .update({
        name: data.name,
        price: data.amount,
        currency: data.currency,
        billing_cycle: data.billingCycle,
        next_renewal_date: data.nextRenewalDate,
        notes: data.notes,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidateTag('subscriptions')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update subscription error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteSubscription(id: string) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidateTag('subscriptions')
    return { success: true }
  } catch (error) {
    console.error('[v0] Delete subscription error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getSubscriptions() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_renewal_date', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('[v0] Get subscriptions error:', error)
    return { success: false, error: (error as Error).message }
  }
}
