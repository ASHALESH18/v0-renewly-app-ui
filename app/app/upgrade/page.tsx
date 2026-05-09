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
import { mapSubscriptionRowToUI } from '@/lib/supabase/mappers'
import { RazorpayCheckout, useBillingStatus } from '@/components/razorpay-checkout'
import useStore from '@/lib/store'

type UpgradeStep = 'select-plan' | 'checkout' | 'success' | 'enterprise-contact'
type PaidPlanId = 'pro' | 'family' | 'enterprise'

const comparisonRows: Array<{ label: string; pro: string; family: string; enterprise: string }> = [
  { label: 'Subscription limit', pro: 'Unlimited', family: 'Unlimited shared', enterprise: 'Unlimited team' },
  { label: 'Advanced analytics', pro: 'Included', family: 'Included', enterprise: 'Advanced reporting' },
  { label: 'Renewal calendar', pro: 'Included', family: 'Shared calendar', enterprise: 'Team calendar' },
  { label: 'Members', pro: '1 user', family: 'Owner + 4 included members', enterprise: 'Custom seats' },
  { label: 'Extra members', pro: 'Not available', family: 'Up to 4 extra members at ₹99 / $1.49 each', enterprise: 'Custom seats' },
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

  return `${symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}/${pricing.period}`
}

function getOriginalPrice(plan: Plan, currency: PlanCurrency) {
  const pricing = getPlanPricing(plan.id, currency)
  if (!pricing?.originalAmount) return null
  return `${getCurrencySymbol(currency)}${pricing.originalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

function getSavings(plan: Plan, currency: PlanCurrency) {
  const pricing = getPlanPricing(plan.id, currency)
  if (!pricing?.savings) return null
  return `${getCurrencySymbol(currency)}${pricing.savings.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
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
  const setSubscriptions = useStore((state) => state.setSubscriptions)

  const initialPlan = plans.some((plan) => plan.id === requestedPlan) ? requestedPlan : 'pro'
  const [selectedPlanId, setSelectedPlanId] = useState<PaidPlanId>(initialPlan as PaidPlanId)
  const [step, setStep] = useState<UpgradeStep>(requestedPlan === 'enterprise' ? 'enterprise-contact' : 'select-plan')
  const [qaStatus, setQaStatus] = useState<{ enabled: boolean; currentPlan: string | null; emailAllowed: boolean } | null>(null)
  const [qaLoading, setQaLoading] = useState(false)

  useEffect(() => {
    clearUpgradeIntent()

    const fetchQaStatus = async () => {
      try {
        const res = await fetch('/api/qa/plan-override/status')
        if (res.ok) {
          const data = await res.json()
          setQaStatus(data)
        }
      } catch (err) {
        console.error('[v0] Failed to fetch QA status:', err)
      }
    }

    fetchQaStatus()
  }, [])

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || plans[0],
    [plans, selectedPlanId]
  )

  const inrPricing = getPlanPricing(selectedPlan.id, 'INR')
  const canUseRazorpay = billingStatus.configured && inrPricing && inrPricing.amount !== null

  const handleSelectPlan = (planId: string) => {
    const id = planId as PaidPlanId
    setSelectedPlanId(id)
    if (id === 'enterprise') {
      setStep('enterprise-contact')
    } else {
      setStep('select-plan')
    }
  }

  const refreshSubscriptionsFromServer = async () => {
    try {
      const response = await fetch('/api/subscriptions', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        // Handle both { subscriptions: [] } and direct array responses
        const rows = Array.isArray(data?.subscriptions)
          ? data.subscriptions
          : Array.isArray(data)
            ? data
            : []

        const { isDisplayableSubscription } = await import('@/lib/billing/subscription-display-utils')
        const subscriptions = rows
          .map(mapSubscriptionRowToUI)
          .filter(isDisplayableSubscription)
        setSubscriptions(subscriptions)
      }
    } catch (error) {
      console.error('[v0] Error refreshing subscriptions:', error)
    }
  }

  const handleContinue = () => {
    if (selectedPlanId === 'enterprise') {
      setStep('enterprise-contact')
    } else if (canUseRazorpay) {
      setStep('checkout')
    }
  }

  // Helper to get plan-change context for user-facing flow
  const getPlanChangeInfo = (currentPlan: string | null, selectedId: string) => {
    if (currentPlan === 'pro' && selectedId === 'family') {
      return {
        title: 'Upgrade to Family',
        message: 'Family access starts immediately after checkout. Your dashboard should show Renewly Family and replace the Renewly Pro billing card.',
      }
    }
    if (currentPlan === 'family' && selectedId === 'pro') {
      return {
        title: 'Schedule downgrade to Pro',
        message: 'Your Family plan remains active until the current renewal date. Your dashboard should continue showing Renewly Family until then, with a downgrade notice. Renewly Pro should start after the Family period ends.',
      }
    }
    return null
  }

  const handleQaPlanOverride = async (plan: 'free' | 'pro' | 'family') => {
    // Show QA confirmation for force downgrade from Family
    if (qaStatus?.currentPlan === 'family' && (plan === 'pro' || plan === 'free')) {
      const confirmed = window.confirm(
        `This is a QA force override. It will immediately switch the test account to ${plan}. Real customer downgrades should keep Family active until the renewal date.\n\nContinue?`
      )
      if (!confirmed) return
    }

    try {
      setQaLoading(true)
      const res = await fetch('/api/qa/plan-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast({
          type: 'error',
          title: 'QA override failed',
          message: data.error || 'Failed to set plan',
        })
        return
      }

      updatePlanLocally(plan)
      await refreshPlan()
      await refreshSubscriptionsFromServer()

      const syncMessage = data.sync === 'failed'
        ? 'Plan updated but sync failed. Try Resync Current Plan.'
        : `QA plan set to ${plan}`

      addToast({
        type: data.sync === 'failed' ? 'warning' : 'success',
        title: 'QA plan updated',
        message: syncMessage,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'QA override error',
        message: (error as Error).message || 'An error occurred',
      })
    } finally {
      setQaLoading(false)
    }
  }

  const handlePaymentSuccess = async (newPlanId: string) => {
    updatePlanLocally(newPlanId as 'pro' | 'family')
    await refreshPlan()
    await refreshSubscriptionsFromServer()
    setStep('success')
  }

  const handleQaResync = async () => {
    try {
      setQaLoading(true)
      const res = await fetch('/api/qa/resync-renewly-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok) {
        addToast({
          type: 'error',
          title: 'Resync failed',
          message: data.error || 'Failed to resync subscriptions',
        })
        return
      }

      await refreshSubscriptionsFromServer()

      addToast({
        type: 'success',
        title: 'Renewly subscription resynced',
        message: `Resync completed for ${data.plan} plan`,
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Resync error',
        message: (error as Error).message || 'An error occurred',
      })
    } finally {
      setQaLoading(false)
    }
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
    const checkoutPricing = getPlanPricing(selectedPlanId as PlanType, 'INR')

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
            amount={checkoutPricing?.amount || 0}
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
                  <span className="text-xl font-bold text-foreground">{formatPlanPrice(plan, selectedCurrency)}</span>
                  {savings && <span className="text-xs text-emerald">Save {savings}</span>}
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-6">
          <h3 className="text-lg font-semibold text-foreground">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
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
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Selected plan</p>
              <p className="text-xl font-semibold text-foreground">{selectedPlan.name}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Display price: {formatPlanPrice(selectedPlan, selectedCurrency)}
                </p>
                {selectedCurrency !== 'INR' && (
                  <p className="text-sm text-muted-foreground">
                    Checkout in INR: {inrPricing && inrPricing.amount !== null ? `₹${inrPricing.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/month` : 'Contact sales'}
                  </p>
                )}
              </div>
              {!canUseRazorpay && selectedPlanId !== 'enterprise' && (
                <p className="mt-3 flex items-center gap-2 text-sm text-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  Razorpay keys are not configured yet.
                </p>
              )}
            </div>
            <button
              onClick={handleContinue}
              disabled={!canUseRazorpay && selectedPlanId !== 'enterprise'}
              className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3.5 font-semibold text-obsidian shadow-luxury disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
            >
              {selectedPlanId === 'enterprise' ? (
                <Mail className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
              {(() => {
                if (selectedPlanId === 'enterprise') return 'Contact Sales'
                if (qaStatus?.currentPlan === 'pro' && selectedPlanId === 'family') {
                  return `Upgrade to Family — ₹${inrPricing?.amount || 0}/month`
                }
                if (qaStatus?.currentPlan === 'family' && selectedPlanId === 'pro') {
                  return `Schedule Downgrade — ₹${inrPricing?.amount || 0}/month`
                }
                return `Continue — ${inrPricing && inrPricing.amount !== null ? `₹${inrPricing.amount}/month` : 'Contact Sales'}`
              })()}
            </button>

            {getPlanChangeInfo(qaStatus?.currentPlan || null, selectedPlanId) && (
              <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  {getPlanChangeInfo(qaStatus?.currentPlan || null, selectedPlanId)?.title}
                </p>
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  {getPlanChangeInfo(qaStatus?.currentPlan || null, selectedPlanId)?.message}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure checkout</span>
            <span>Cancel anytime</span>
            <Link href="/app/dashboard" className="hover:text-foreground">Back to Dashboard</Link>
          </div>
        </div>

        {qaStatus?.enabled && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-4">
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">QA Mode — force plan state for testing</p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Current test plan: {qaStatus.currentPlan || 'unknown'}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 leading-relaxed">
                These buttons immediately force the account plan for Preview QA. They do not simulate real customer billing lifecycle, renewal dates, scheduled downgrades, or period-end cancellation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['free', 'pro', 'family'].map((plan) => (
                <button
                  key={plan}
                  onClick={() => handleQaPlanOverride(plan as 'free' | 'pro' | 'family')}
                  disabled={qaLoading || qaStatus.currentPlan === plan}
                  className="text-sm px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-700 hover:bg-amber-400/40 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {qaLoading ? 'Setting...' : `Force ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
                </button>
              ))}
              <button
                onClick={handleQaResync}
                disabled={qaLoading}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-400/20 text-blue-700 hover:bg-blue-400/40 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {qaLoading ? 'Resyncing...' : 'Resync Current Plan'}
              </button>
            </div>
          </div>
        )}
      </div>
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
