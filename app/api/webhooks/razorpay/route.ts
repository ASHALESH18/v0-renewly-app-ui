import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { isBillingConfigured } from '@/lib/billing-guards'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('[v0] RAZORPAY_WEBHOOK_SECRET not set, skipping signature verification')
    return true // Allow in development if secret not set
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return signature === expectedSignature
}

/**
 * POST /api/webhooks/razorpay
 * Handle Razorpay webhook events for reliable payment processing
 */
export async function POST(req: NextRequest) {
  try {
    if (!isBillingConfigured()) {
      return NextResponse.json(
        { error: 'Billing not configured' },
        { status: 503 }
      )
    }

    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('[v0] Invalid Razorpay webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(body)
    const eventType = event.event

    console.log('[v0] Razorpay webhook received:', eventType)

    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity)
        break

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity)
        break

      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity, event.payload.payment.entity)
        break

      default:
        console.log('[v0] Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[v0] Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(payment: any) {
  const orderId = payment.order_id
  const paymentId = payment.id

  console.log('[v0] Payment captured:', { orderId, paymentId })

  // Get the order from database
  const { data: orderData, error: orderError } = await supabase
    .from('billing_orders')
    .select('*')
    .eq('razorpay_order_id', orderId)
    .single()

  if (orderError || !orderData) {
    console.error('[v0] Order not found for payment:', orderId)
    return
  }

  // Already processed?
  if (orderData.status === 'completed') {
    console.log('[v0] Order already completed:', orderId)
    return
  }

  const planId = orderData.plan_id
  const userId = orderData.user_id

  // Update user profile with new plan
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      plan: planId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('[v0] Failed to update user plan:', updateError)
    return
  }

  // Update billing order status
  await supabase
    .from('billing_orders')
    .update({
      status: 'completed',
      razorpay_payment_id: paymentId,
      processed_at: new Date().toISOString(),
    })
    .eq('razorpay_order_id', orderId)

  // Create billing record
  await supabase.from('billing_records').insert({
    user_id: userId,
    razorpay_payment_id: paymentId,
    razorpay_order_id: orderId,
    plan_id: planId,
    amount: payment.amount,
    status: 'paid',
    notes: {
      method: payment.method,
      source: 'webhook',
    },
  })

  console.log('[v0] Successfully processed payment for user:', userId, 'plan:', planId)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(payment: any) {
  const orderId = payment.order_id

  console.log('[v0] Payment failed:', { orderId, error: payment.error_description })

  // Update order status
  await supabase
    .from('billing_orders')
    .update({
      status: 'failed',
      notes: {
        error_code: payment.error_code,
        error_description: payment.error_description,
      },
    })
    .eq('razorpay_order_id', orderId)
}

/**
 * Handle order paid event (alternative to payment.captured)
 */
async function handleOrderPaid(order: any, payment: any) {
  // This is a backup handler - payment.captured should handle most cases
  console.log('[v0] Order paid:', order.id)
  
  if (payment) {
    await handlePaymentCaptured(payment)
  }
}
