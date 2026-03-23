'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { createRazorpayOrder, verifyPaymentSignature, getPaymentDetails } from '@/lib/razorpay/server'
import { plans } from '@/lib/plans'
import type { PlanType } from '@/lib/plan-capabilities'
import { isBillingConfigured } from '@/lib/billing-guards'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Get plan details
    const plan = plans.find(p => p.id === planId)
    if (!plan || plan.price === null) throw new Error('Invalid plan')

    // Create Razorpay order (amount in paise)
    const amountInPaise = plan.price * 100
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
      amount: amountInPaise,
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
      amount: payment.amount || orderData.amount,
      status: 'paid',
      notes: {
        method: payment.method,
        description: payment.description,
      },
    })

    if (billingError) {
      console.warn('[v0] Could not create billing record:', billingError)
    }

    revalidateTag('profile')
    revalidateTag('billing')

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
