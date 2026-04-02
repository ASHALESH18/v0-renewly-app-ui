'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Crown, Users, Building2, ArrowLeft, Zap, CreditCard, Shield } from 'lucide-react'
import { getAllPlans } from '@/lib/plans'
import { springs } from '@/components/motion'
import { Suspense, useState } from 'react'
import { clearUpgradeIntent } from '@/lib/upgrade-flow'
import Link from 'next/link'

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('plan') as 'pro' | 'family' | 'enterprise' | null
  const plans = getAllPlans()
  const plan = plans.find(p => p.id === planId)
  
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm')
  
  // Clear any stored upgrade intent since we're now processing it
  if (typeof window !== 'undefined') {
    clearUpgradeIntent()
  }
  
  const PlanIcon = planId === 'pro' ? Crown : planId === 'family' ? Users : Building2

  const handleStartTrial = async () => {
    setStep('processing')
    
    // Simulate processing - in production this redirects to Stripe/Razorpay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setStep('success')
  }

  // No plan specified - show plan selection
  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <h1 className="text-2xl font-semibold text-foreground">Choose a Plan</h1>
          <p className="text-muted-foreground">Select a plan to upgrade to</p>
          
          <div className="space-y-3">
            {plans.filter(p => p.id !== 'free').map((p) => (
              <Link key={p.id} href={`/app/upgrade?plan=${p.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
              </Link>
            ))}
          </div>
          
          <Link href="/app/dashboard" className="block text-sm text-muted-foreground hover:text-foreground">
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    )
  }

  // Success state
  if (step === 'success') {
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
          
          <h1 className="text-2xl font-semibold text-foreground">Welcome to {plan.name}!</h1>
          <p className="text-muted-foreground">
            Your 14-day free trial has started. Enjoy all {plan.name} features!
          </p>
          
          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20 text-left">
            <p className="text-sm text-emerald font-medium">Trial Details</p>
            <ul className="mt-2 space-y-1 text-sm text-emerald/80">
              <li>• Trial ends in 14 days</li>
              <li>• No charge during trial period</li>
              <li>• Cancel anytime from Settings</li>
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

  // Processing state
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto rounded-full border-4 border-gold/20 border-t-gold"
          />
          <h2 className="text-xl font-semibold text-foreground">Setting up your trial...</h2>
          <p className="text-muted-foreground">This only takes a moment</p>
        </motion.div>
      </div>
    )
  }

  // Confirm state - main upgrade view
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
            <h1 className="text-xl font-semibold text-foreground">Upgrade to {plan.name}</h1>
            <p className="text-sm text-muted-foreground">Start your 14-day free trial</p>
          </div>
        </div>

        {/* Plan card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gold/20 flex items-center justify-center">
              <PlanIcon className="w-7 h-7 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{plan.name} Plan</h2>
              <div className="flex items-baseline gap-2 mt-1">
                {plan.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{plan.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="text-3xl font-bold text-gold">
                  ₹{plan.price?.toLocaleString('en-IN')}
                </span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>
              {plan.savings && (
                <p className="text-sm text-emerald mt-1">
                  Save ₹{plan.savings.toLocaleString('en-IN')}/month
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Includes everything in {plan.name}:</h3>
          <div className="grid gap-2">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-emerald" />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trial info */}
        <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-emerald" />
            <span className="text-sm font-medium text-emerald">14-day free trial</span>
          </div>
          <p className="text-xs text-emerald/80 ml-6">
            Try {plan.name} free for 14 days. No charge until trial ends. Cancel anytime.
          </p>
        </div>

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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartTrial}
          className="w-full py-4 rounded-xl bg-gold text-obsidian font-semibold flex items-center justify-center gap-2 shadow-luxury"
        >
          <Zap className="w-5 h-5" />
          Start Free Trial
        </motion.button>

        <p className="text-xs text-center text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
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
