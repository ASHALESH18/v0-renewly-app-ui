'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Shield, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { initiateUpgrade, processPayment } from '@/lib/supabase/billing-actions'
import type { PlanType } from '@/lib/plan-capabilities'

declare global {
  interface Window {
    Razorpay: any
  }
}

export type CheckoutState = 
  | 'idle'
  | 'loading-razorpay'
  | 'creating-order'
  | 'checkout-open'
  | 'verifying-payment'
  | 'success'
  | 'cancelled'
  | 'failed'

interface RazorpayCheckoutProps {
  planId: PlanType
  planName: string
  amount: number // in rupees
  onSuccess: (planId: string) => void
  onCancel: () => void
  onError: (error: string) => void
}

/**
 * Load Razorpay SDK script dynamically
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/**
 * Razorpay Checkout Component
 * Handles the complete payment flow with real Razorpay integration
 */
export function RazorpayCheckout({
  planId,
  planName,
  amount,
  onSuccess,
  onCancel,
  onError,
}: RazorpayCheckoutProps) {
  const [state, setState] = useState<CheckoutState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null)

  // Load Razorpay key from server
  useEffect(() => {
    async function fetchBillingStatus() {
      try {
        const res = await fetch('/api/billing/status')
        const data = await res.json()
        if (data.configured && data.razorpayKeyId) {
          setRazorpayKeyId(data.razorpayKeyId)
        }
      } catch (err) {
        console.error('[v0] Failed to fetch billing status:', err)
      }
    }
    fetchBillingStatus()
  }, [])

  const startCheckout = useCallback(async () => {
    if (!razorpayKeyId) {
      setErrorMessage('Billing system is not configured yet. Please try again later.')
      setState('failed')
      return
    }

    try {
      // Step 1: Load Razorpay SDK
      setState('loading-razorpay')
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Failed to load payment gateway')
      }

      // Step 2: Create order on server
      setState('creating-order')
      const orderResult = await initiateUpgrade(planId)
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      // Step 3: Open Razorpay checkout
      setState('checkout-open')
      
      const options = {
        key: razorpayKeyId,
        amount: orderResult.amount,
        currency: 'INR',
        name: 'Renewly',
        description: `Upgrade to ${planName} Plan`,
        order_id: orderResult.orderId,
        handler: async function (response: any) {
          // Step 4: Verify payment on server
          setState('verifying-payment')
          
          try {
            const verifyResult = await processPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            )

            if (verifyResult.success) {
              setState('success')
              onSuccess(planId)
            } else {
              throw new Error(verifyResult.error || 'Payment verification failed')
            }
          } catch (err) {
            setErrorMessage((err as Error).message)
            setState('failed')
            onError((err as Error).message)
          }
        },
        modal: {
          ondismiss: function () {
            setState('cancelled')
            onCancel()
          },
          escape: true,
          animation: true,
        },
        prefill: {
          // Will be filled from server-side user data
        },
        theme: {
          color: '#C7A36A', // Renewly gold
        },
        notes: {
          plan_id: planId,
        },
      }

      const razorpay = new window.Razorpay(options)
      
      razorpay.on('payment.failed', function (response: any) {
        setErrorMessage(response.error?.description || 'Payment failed')
        setState('failed')
        onError(response.error?.description || 'Payment failed')
      })

      razorpay.open()
    } catch (err) {
      setErrorMessage((err as Error).message)
      setState('failed')
      onError((err as Error).message)
    }
  }, [razorpayKeyId, planId, planName, onSuccess, onCancel, onError])

  // Auto-start checkout when component mounts and key is available
  useEffect(() => {
    if (state === 'idle' && razorpayKeyId) {
      startCheckout()
    }
  }, [state, razorpayKeyId, startCheckout])

  return (
    <div className="space-y-4">
      <CheckoutStateDisplay 
        state={state} 
        planName={planName} 
        errorMessage={errorMessage}
        onRetry={startCheckout}
        onCancel={onCancel}
      />
    </div>
  )
}

/**
 * Display component for different checkout states
 */
function CheckoutStateDisplay({
  state,
  planName,
  errorMessage,
  onRetry,
  onCancel,
}: {
  state: CheckoutState
  planName: string
  errorMessage: string | null
  onRetry: () => void
  onCancel: () => void
}) {
  switch (state) {
    case 'idle':
    case 'loading-razorpay':
      return (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm text-muted-foreground">Loading payment gateway...</p>
        </div>
      )

    case 'creating-order':
      return (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm text-muted-foreground">Preparing your order...</p>
        </div>
      )

    case 'checkout-open':
      return (
        <div className="flex flex-col items-center gap-3 py-6">
          <CreditCard className="w-8 h-8 text-gold" />
          <p className="text-sm text-muted-foreground">Complete payment in the popup window</p>
          <p className="text-xs text-muted-foreground/70">Do not close this page</p>
        </div>
      )

    case 'verifying-payment':
      return (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying your payment...</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Shield className="w-3 h-3" />
            <span>Secure verification in progress</span>
          </div>
        </div>
      )

    case 'success':
      return (
        <div className="flex flex-col items-center gap-3 py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-emerald" />
          </motion.div>
          <p className="text-lg font-semibold text-foreground">Payment Successful!</p>
          <p className="text-sm text-muted-foreground">Welcome to {planName}</p>
        </div>
      )

    case 'cancelled':
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <XCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">Payment Cancelled</p>
          <p className="text-sm text-muted-foreground text-center">
            No charges were made. You can try again whenever you&apos;re ready.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm bg-gold text-obsidian rounded-lg font-medium hover:bg-gold/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )

    case 'failed':
      return (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">Payment Failed</p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {errorMessage || 'Something went wrong. Please try again.'}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm bg-gold text-obsidian rounded-lg font-medium hover:bg-gold/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )

    default:
      return null
  }
}

/**
 * Hook to check if billing is configured
 */
export function useBillingStatus() {
  const [status, setStatus] = useState<{
    configured: boolean
    loading: boolean
    message: string
  }>({
    configured: false,
    loading: true,
    message: '',
  })

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/billing/status')
        const data = await res.json()
        setStatus({
          configured: data.configured,
          loading: false,
          message: data.message,
        })
      } catch {
        setStatus({
          configured: false,
          loading: false,
          message: 'Failed to check billing status',
        })
      }
    }
    check()
  }, [])

  return status
}
