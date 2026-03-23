import Razorpay from 'razorpay'
import crypto from 'crypto'
import { isBillingConfigured } from '@/lib/billing-guards'

// Lazy initialization - only create instance when actually needed and configured
let _razorpayInstance: Razorpay | null = null

function getRazorpay(): Razorpay {
  if (!isBillingConfigured()) {
    throw new Error('Billing is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.')
  }
  
  if (!_razorpayInstance) {
    _razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
  }
  
  return _razorpayInstance
}

export interface CreateOrderParams {
  amount: number // In paise (₹1 = 100 paise)
  currency?: string
  receipt: string
  description: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  notes?: Record<string, string>
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(params: CreateOrderParams) {
  try {
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: params.amount,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      description: params.description,
      customer_notify: 1,
      notes: {
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        ...params.notes,
      },
    })

    return { success: true, order }
  } catch (error) {
    console.error('[v0] Create Razorpay order error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const text = `${orderId}|${paymentId}`
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex')

    return generated_signature === signature
  } catch (error) {
    console.error('[v0] Signature verification error:', error)
    return false
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const razorpay = getRazorpay()
    const payment = await razorpay.payments.fetch(paymentId)
    return { success: true, payment }
  } catch (error) {
    console.error('[v0] Fetch payment error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Create a subscription order (for monthly billing)
 */
export async function createSubscriptionOrder(params: CreateOrderParams) {
  // For now, use the same order creation as regular orders
  // In production, you might use Razorpay Subscriptions API
  return createRazorpayOrder(params)
}
