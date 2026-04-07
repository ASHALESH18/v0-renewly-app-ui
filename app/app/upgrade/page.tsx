'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Crown, Users, Building2, ArrowLeft, Zap, CreditCard, Shield, Mail, AlertCircle } from 'lucide-react'
import { getAllPlans } from '@/lib/plans'
import { springs } from '@/components/motion'
import { Suspense, useState, useEffect } from 'react'
import { clearUpgradeIntent } from '@/lib/upgrade-flow'
import { RazorpayCheckout, useBillingStatus } from '@/components/razorpay-checkout'
import useStore from '@/lib/store'
import Link from 'next/link'

type UpgradeStep = 
  | 'select-plan'
  | 'confirm'
  | 'checkout'
  | 'success'
  | 'enterprise-contact'

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('plan') as 'pro' | 'family' | 'enterprise' | null
  const plans = getAllPlans()
  const plan = plans.find(p => p.id === planId)
  
  const [step, setStep] = useState<UpgradeStep>(planId ? 'confirm' : 'select-plan')
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planId)
  
  const billingStatus = useBillingStatus()
  const refreshPlan = useStore((s) => s.refreshPlanFromServer)
  const updatePlanLocally = useStore((s) => s.updatePlanLocally)
  const addToast = useStore((s) => s.addToast)
  
  // Clear any stored upgrade intent since we're now processing it
  useEffect(() => {
    clearUpgradeIntent()
  }, [])
  
  // Enterprise should go to contact flow
  useEffect(() => {
    if (planId === 'enterprise') {
      setStep('enterprise-contact')
    }
  }, [planId])
  
  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  const PlanIcon = selectedPlanId === 'pro' ? Crown : selectedPlanId === 'family' ? Users : Building2

  const handlePlanSelect = (id: string) => {
    setSelectedPlanId(id)
    if (id === 'enterprise') {
      setStep('enterprise-contact')
    } else {
      setStep('confirm')
    }
  }

  const handleStartCheckout = () => {
    if (!billingStatus.configured) {
      addToast({
        type: 'error',
        title: 'Billing not available',
        message: 'Payment system is being set up. Please try again later.',
      })
      return
    }
    setStep('checkout')
  }

  const handlePaymentSuccess = async (newPlanId: string) => {
    // Update plan locally for immediate UI feedback
    updatePlanLocally(newPlanId as 'pro' | 'family')
    
    // Refresh from server to ensure consistency
    await refreshPlan()
    
    setStep('success')
  }

  const handlePaymentCancel = () => {
    setStep('confirm')
  }

  const handlePaymentError = (error: string) => {
    addToast({
      type: 'error',
      title: 'Payment failed',
      message: error,
    })
    setStep('confirm')
  }

  // Plan selection view
  if (step === 'select-plan') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Choose a Plan</h1>
            <p className="text-muted-foreground mt-2">Select the plan that works for you</p>
          </div>
          
          <div className="space-y-3">
            {plans.filter(p => p.id !== 'free').map((p) => (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlanSelect(p.id)}
                className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-gold/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    {p.id === 'pro' ? <Crown className="w-5 h-5 text-gold" /> :
                     p.id === 'family' ? <Users className="w-5 h-5 text-gold" /> :
                     <Building2 className="w-5 h-5 text-gold" />}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {p.price !== null ? `₹${p.price}/${p.period}` : p.priceText}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Link href="/app/dashboard" className="block text-sm text-muted-foreground hover:text-foreground text-center">
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    )
  }

  // Enterprise contact view
  if (step === 'enterprise-contact') {
    return <EnterpriseContactView onBack={() => setStep('select-plan')} />
  }

  // Success view
  if (step === 'success' && selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto rounded-full bg-emerald/20 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-emerald" />
          </motion.div>
          
          <h1 className="text-2xl font-semibold text-foreground">Welcome to {selectedPlan.name}!</h1>
          <p className="text-muted-foreground">
            Your upgrade is complete. All {selectedPlan.name} features are now unlocked.
          </p>
          
          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20 text-left">
            <p className="text-sm text-emerald font-medium">What&apos;s unlocked:</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald/80">
              {selectedPlan.features.slice(0, 3).map((feature, i) => (
                <li key={i}>• {feature}</li>
              ))}
            </ul>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/app/dashboard')}
            className="w-full py-3.5 rounded-xl bg-gold text-obsidian font-semibold"
          >
            Go to Dashboard
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Checkout view - actual payment
  if (step === 'checkout' && selectedPlan && selectedPlanId && selectedPlanId !== 'enterprise') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Complete Payment</h2>
            <p className="text-sm text-muted-foreground mt-1">Upgrading to {selectedPlan.name}</p>
          </div>
          
          <RazorpayCheckout
            planId={selectedPlanId as 'pro' | 'family'}
            planName={selectedPlan.name}
            amount={selectedPlan.price || 0}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
            onError={handlePaymentError}
          />
        </motion.div>
      </div>
    )
  }

  // No plan selected but we're past selection
  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">No plan selected</p>
          <button 
            onClick={() => setStep('select-plan')}
            className="mt-4 text-gold hover:underline"
          >
            Choose a plan
          </button>
        </div>
      </div>
    )
  }

  // Confirm view - main upgrade page
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.gentle}
        className="max-w-lg w-full space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Upgrade to {selectedPlan.name}</h1>
            <p className="text-sm text-muted-foreground">Unlock all {selectedPlan.name} features</p>
          </div>
        </div>

        {/* Plan card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center">
              <PlanIcon className="w-7 h-7 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{selectedPlan.name} Plan</h2>
              <div className="flex items-baseline gap-2 mt-1">
                {selectedPlan.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{selectedPlan.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-3xl font-bold text-gold">
                  ₹{selectedPlan.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-muted-foreground">/{selectedPlan.period}</span>
              </div>
              {selectedPlan.savings && (
                <p className="text-sm text-emerald mt-1">
                  Save ₹{selectedPlan.savings.toLocaleString('en-IN')}/month
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Includes everything in {selectedPlan.name}:</h3>
          <div className="grid gap-2">
            {selectedPlan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing status warning */}
        {billingStatus.loading ? (
          <div className="p-3 rounded-xl bg-muted/50 border border-border animate-pulse">
            <p className="text-sm text-muted-foreground">Checking payment availability...</p>
          </div>
        ) : !billingStatus.configured ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Payment setup in progress</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                  Our payment system is being configured. Please check back soon or contact support.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-emerald" />
              <span className="text-sm font-medium text-emerald">Secure payment</span>
            </div>
            <p className="text-xs text-emerald/80 ml-6">
              Your payment is processed securely via Razorpay. Cancel anytime from Settings.
            </p>
          </div>
        )}

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secure checkout</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: billingStatus.configured ? 1.02 : 1 }}
          whileTap={{ scale: billingStatus.configured ? 0.98 : 1 }}
          onClick={handleStartCheckout}
          disabled={!billingStatus.configured || billingStatus.loading}
          className="w-full py-4 rounded-xl bg-gold text-obsidian font-semibold flex items-center justify-center gap-2 shadow-luxury disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard className="w-5 h-5" />
          {billingStatus.loading ? 'Loading...' : billingStatus.configured ? 'Proceed to Payment' : 'Payment unavailable'}
        </motion.button>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}

// Enterprise contact view
function EnterpriseContactView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // In production, this would send to a CRM or email service
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-emerald" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Request Received</h2>
          <p className="text-muted-foreground">
            Our enterprise team will reach out within 1-2 business days to discuss your needs.
          </p>
          <Link href="/app/dashboard">
            <button className="px-6 py-3 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-foreground">Contact Sales</h2>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Enterprise Plan</h3>
              <p className="text-sm text-muted-foreground">Custom pricing for teams & organizations</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Acme Inc."
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <button
            type="submit"
            disabled={!email || !company || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Request Demo'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}
