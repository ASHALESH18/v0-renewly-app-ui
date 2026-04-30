'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createRazorpayOrder, verifyPaymentSignature, getPaymentDetails } from '@/lib/razorpay/server'
import { getPlan, getPlanPricing, type PlanType } from '@/lib/plans'
import { isBillingConfigured } from '@/lib/billing-guards'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'

/**
 * Get Supabase client for billing operations
 * Initializes inside function calls, not at module level, to avoid build-time errors
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Initiate upgrade by creating a Razorpay order
 */
export async function initiateUpgrade(planId: PlanType) {
  try {
    // Check if billing is configured before attempting any payment operations
    if (!isBillingConfigured()) {
      return {
        success: false,
        error: 'Billing setup in progress. Please try again later or contact support.',
      }
    }

    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    
    const supabase = getSupabaseClient()

    // Get user profile for email and current plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, plan')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    // Prevent downgrade
    const planHierarchy = { free: 0, pro: 1, family: 2, enterprise: 3 }
    if (
      planHierarchy[planId as PlanType] <=
      planHierarchy[profile.plan as PlanType]
    ) {
      throw new Error('Cannot downgrade to same or lower plan')
    }

    // Get plan details - use getPlanPricing for consistent multi-currency support
    const plan = getPlan(planId)
    if (!plan) throw new Error('Invalid plan')

    // For Razorpay, we only support INR for now
    const pricing = getPlanPricing(planId, 'INR')
    if (!pricing || pricing.amount === null) {
      throw new Error('Plan pricing not available for Razorpay checkout')
    }

    // Convert to paise (1 rupee = 100 paise)
    const amountInPaise = pricing.amount * 100

    const orderResult = await createRazorpayOrder({
      amount: amountInPaise,
      receipt: `upgrade-${user.id}-${planId}-${Date.now()}`,
      description: `Upgrade to Renewly ${plan.name} Plan`,
      customerName: profile.email.split('@')[0],
      customerEmail: profile.email,
      notes: {
        user_id: user.id,
        plan_id: planId,
        upgrade_from: profile.plan,
      },
    })

    if (!orderResult.success) throw new Error(orderResult.error)

    // Store order in database for verification later
    const { error: orderError } = await supabase.from('billing_orders').insert({
      user_id: user.id,
      razorpay_order_id: orderResult.order.id,
      plan_id: planId,
      amountInPaise,
      status: 'created',
      notes: {
        upgrade_from: profile.plan,
      },
    })

    if (orderError) {
      console.warn('[v0] Could not store order in database:', orderError)
      // Continue anyway - order exists in Razorpay
    }

    return {
      success: true,
      orderId: orderResult.order.id,
      amount: amountInPaise,
      planId,
      planName: plan.name,
    }
  } catch (error) {
    console.error('[v0] Initiate upgrade error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Verify and process payment
 */
export async function processPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    // Billing must be configured to process payments
    if (!isBillingConfigured()) {
      return {
        success: false,
        error: 'Billing system is not available. Please contact support.',
      }
    }

    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature)
    if (!isValid) throw new Error('Invalid payment signature')

    // Fetch payment details
    const paymentResult = await getPaymentDetails(paymentId)
    if (!paymentResult.success) throw new Error('Could not fetch payment details')

    const payment = paymentResult.payment as any

    // Get the order from database to know which plan to upgrade to
    const { data: orderData, error: orderError } = await supabase
      .from('billing_orders')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError) throw new Error('Order not found')

    const planId = orderData.plan_id

    // Update user profile with new plan
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Update billing order status
    const { error: statusError } = await supabase
      .from('billing_orders')
      .update({
        status: 'completed',
        razorpay_payment_id: paymentId,
        processed_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', orderId)

    if (statusError) {
      console.warn('[v0] Could not update order status:', statusError)
    }

    // Create billing record
    const { error: billingError } = await supabase.from('billing_records').insert({
      user_id: user.id,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      plan_id: planId,
      amount: payment.amount || orderData.amountInPaise,
      status: 'paid',
      notes: {
        method: payment.method,
        description: payment.description,
      },
    })

    if (billingError) {
      console.warn('[v0] Could not create billing record:', billingError)
    }

    // Sync system-managed Renewly subscription
    if (planId === 'pro' || planId === 'family') {
      try {
        // Get user email for sync
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single()

        if (!profileError && profile) {
          // Calculate period end from payment
          const periodStart = new Date()
          const periodEnd = new Date(periodStart)
          periodEnd.setMonth(periodEnd.getMonth() + 1)
          const periodEndStr = periodEnd.toISOString().split('T')[0]

          await syncRenewlyBillingSubscriptionForPlan({
            userId: user.id,
            email: profile.email,
            plan: planId,
            currentPeriodEnd: periodEndStr,
          })
        }
      } catch (syncError) {
        console.warn('[v0] Could not sync Renewly subscription:', syncError)
        // Don't fail payment if sync fails
      }
    }

    revalidateTag('profile')
    revalidateTag('billing')
    revalidateTag(`subscriptions:${user.id}`)

    return {
      success: true,
      planId,
      message: 'Payment successful! Your plan has been upgraded.',
    }
  } catch (error) {
    console.error('[v0] Process payment error:', error)
    return { success: false, error: (error as Error).message }
  }
}
