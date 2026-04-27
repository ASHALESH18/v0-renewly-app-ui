'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  Crown,
  Mail,
  Shield,
  Users,
} from 'lucide-react'
import { getAllPlans, getPlanPricing, type Plan, type PlanCurrency, type PlanType } from '@/lib/plans'
import { getCurrencySymbol } from '@/lib/currency'
import { getEffectiveCurrency } from '@/lib/pricing-display'
import { clearUpgradeIntent } from '@/lib/upgrade-flow'
import { RazorpayCheckout, useBillingStatus } from '@/components/razorpay-checkout'
import useStore from '@/lib/store'

type UpgradeStep = 'select-plan' | 'checkout' | 'success' | 'enterprise-contact'

type PaidPlanId = 'pro' | 'family' | 'enterprise'

const comparisonRows: Array<{ label: string; pro: string; family: string; enterprise: string }> = [
  { label: 'Subscription limit', pro: 'Unlimited', family: 'Unlimited shared', enterprise: 'Unlimited team' },
  { label: 'Advanced analytics', pro: 'Included', family: 'Included', enterprise: 'Advanced reporting' },
  { label: 'Renewal calendar', pro: 'Included', family: 'Shared calendar', enterprise: 'Team calendar' },
  { label: 'Members', pro: '1 user', family: 'Up to 4 members', enterprise: 'Custom seats' },
  { label: 'Support', pro: 'Priority', family: 'Priority', enterprise: 'Dedicated' },
]

function getPlanIcon(planId: string) {
  if (planId === 'pro') return Crown
  if (planId === 'family') return Users
  return Building2
}

function formatPlanPrice(plan: Plan, currency: PlanCurrency) {
  const pricing = getPlanPricing(plan.id, currency)
  const symbol = getCurrencySymbol(currency)

  if (!pricing) return 'Custom pricing'
  if (pricing.amount === null) return pricing.priceText || 'Custom pricing'
  if (pricing.amount === 0) return 'Free'

  return `${symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}/${pricing.period}`
}

function getOriginalPrice(plan: Plan, currency: PlanCurrency) {
  const pricing = getPlanPricing(plan.id, currency)
  if (!pricing?.originalAmount) return null
  return `${getCurrencySymbol(currency)}${pricing.originalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function getSavings(plan: Plan, currency: PlanCurrency) {
  const pricing = getPlanPricing(plan.id, currency)
  if (!pricing?.savings) return null
  return `${getCurrencySymbol(currency)}${pricing.savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const requestedPlan = searchParams.get('plan') as PaidPlanId | null
  const plans = getAllPlans().filter((plan) => plan.id !== 'free')
  const notificationSettings = useStore((state) => state.notificationSettings)
  const selectedCurrency = getEffectiveCurrency(
    notificationSettings?.currencyCode,
    notificationSettings?.locale
  )
  const billingStatus = useBillingStatus()
  const refreshPlan = useStore((state) => state.refreshPlanFromServer)
  const updatePlanLocally = useStore((state) => state.updatePlanLocally)
  const addToast = useStore((state) => state.addToast)

  const initialPlan = plans.some((plan) => plan.id === requestedPlan) ? requestedPlan : 'pro'
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId>(initialPlan as PaidPlanId)
  const [step, setStep] = useState<UpgradeStep>(requestedPlan === 'enterprise' ? 'enterprise-contact' : 'select-plan')

  useEffect(() => {
    clearUpgradeIntent()
  }, [])

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
  )

  const selectedPricing = getPlanPricing(selectedPlan.id, selectedCurrency)
  const selectedOriginal = getOriginalPrice(selectedPlan, selectedCurrency)
  const selectedSavings = getSavings(selectedPlan, selectedCurrency)
  const canUseRazorpay = selectedCurrency === 'INR' && billingStatus.configured

  const handleSelectPlan = (planId: string) => {
    const id = planId as PaidPlanId
    setSelectedPlanId(id)
    if (id === 'enterprise') {
      setStep('enterprise-contact')
    } else {
      setStep('select-plan')
    }
  }

  const handleContinue = () => {
    if (selectedPlanId === 'enterprise') {
      setStep('enterprise-contact')
      return
    }

    if (!canUseRazorpay) {
      addToast({
        type: 'info',
        title: 'Payment setup in progress',
        message:
          selectedCurrency === 'INR'
            ? 'Payment system is being configured. Please check back soon.'
            : `Checkout for ${selectedCurrency} is being configured. Pricing is shown correctly, but payment is not available yet.`,
      })
      return
    }

    setStep('checkout')
  }

  const handlePaymentSuccess = async (newPlanId: string) => {
    updatePlanLocally(newPlanId as 'pro' | 'family')
    await refreshPlan()
    setStep('success')
  }

  if (step === 'enterprise-contact') {
    return <EnterpriseContactView onBack={() => setStep('select-plan')} />
  }

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald/20">
            <Check className="h-10 w-10 text-emerald" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome to {selectedPlan.name}!</h1>
          <p className="text-muted-foreground">Your upgrade is complete. All {selectedPlan.name} features are now unlocked.</p>
          <button
            onClick={() => router.push('/app/dashboard')}
            className="w-full rounded-xl bg-gold py-3.5 font-semibold text-obsidian"
            type="button"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  if (step === 'checkout' && selectedPlanId !== 'enterprise') {
    const inrPricing = getPlanPricing(selectedPlanId as PlanType, 'INR')

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Complete Payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upgrading to {selectedPlan.name}</p>
          </div>

          <RazorpayCheckout
            planId={selectedPlanId as 'pro' | 'family'}
            planName={selectedPlan.name}
            amount={inrPricing?.amount || 0}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setStep('select-plan')}
            onError={(error) => {
              addToast({ type: 'error', title: 'Payment failed', message: error })
              setStep('select-plan')
            }}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/app/dashboard')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Choose a Plan</h1>
            <p className="text-sm text-muted-foreground">Compare plans and continue with the option that fits you.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id)
            const isSelected = selectedPlanId === plan.id
            const original = getOriginalPrice(plan, selectedCurrency)
            const savings = getSavings(plan, selectedCurrency)

            return (
              <motion.button
                key={plan.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(plan.id)}
                className={`relative rounded-2xl border p-5 text-left transition-all ${isSelected
                    ? 'border-gold bg-gold/10 shadow-luxury'
                    : 'border-border bg-card/80 hover:border-gold/40'
                  }`}
                type="button"
              >
                {plan.badge === 'popular' && (
                  <span className="absolute right-4 top-4 rounded-full bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-obsidian">
                    Popular
                  </span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  {original && <span className="text-sm text-muted-foreground line-through">{original}</span>}
                  <span className="text-2xl font-bold text-foreground">{formatPlanPrice(plan, selectedCurrency)}</span>
                </div>
                {savings && <p className="mt-2 text-sm font-medium text-emerald">Save {savings}/month</p>}
                {plan.extraNote && <p className="mt-2 text-xs text-muted-foreground">{plan.extraNote}</p>}
                <ul className="mt-4 space-y-2">
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-5">
          <h2 className="text-lg font-semibold text-foreground">Plan comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Feature</th>
                  <th className="py-3 px-4 font-medium">Pro</th>
                  <th className="py-3 px-4 font-medium">Family</th>
                  <th className="py-3 pl-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{row.label}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.pro}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.family}</td>
                    <td className="py-3 pl-4 text-muted-foreground">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-gold/8 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Selected plan</p>
              <p className="text-xl font-semibold text-foreground">{selectedPlan.name} — {formatPlanPrice(selectedPlan, selectedCurrency)}</p>
              {!canUseRazorpay && selectedPlanId !== 'enterprise' && (
                <p className="mt-2 flex items-center gap-2 text-sm text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  {selectedCurrency === 'INR'
                    ? 'Payment setup is in progress.'
                    : `Checkout for ${selectedCurrency} is being configured.`}
                </p>
              )}
            </div>
            <button
              onClick={handleContinue}
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3.5 font-semibold text-obsidian shadow-luxury disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {selectedPlanId === 'enterprise' ? (
                <Mail className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {selectedPlanId === 'enterprise' ? 'Contact Sales' : `Continue with ${selectedPlan.name}`}
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure checkout</span>
            <span>Cancel anytime</span>
            <Link href="/app/dashboard" className="hover:text-foreground">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function EnterpriseContactView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground" type="button">
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </button>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gold" />
          <h1 className="text-2xl font-semibold text-foreground">Enterprise</h1>
          <p className="mt-2 text-muted-foreground">Custom pricing, team controls, reporting, onboarding, and dedicated support.</p>
          <Link
            href="/contact-sales"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gold px-4 py-3 font-semibold text-obsidian"
          >
            Contact Sales
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-foreground">Loading...</div>}>
      <UpgradeContent />
    </Suspense>
  )
}
