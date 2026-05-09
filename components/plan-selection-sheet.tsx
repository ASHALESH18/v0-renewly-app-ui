'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Users, Building2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAllPlans, getPlanPricing, type PlanCurrency } from '@/lib/plans'
import { getCurrencySymbol } from '@/lib/currency'
import { getEffectiveCurrency } from '@/lib/pricing-display'
import { getUpgradeDestination } from '@/lib/upgrade-flow'
import { useAuth } from '@/lib/hooks/use-auth'
import useStore from '@/lib/store'

export interface PlanSheetProps {
  onClose: () => void
  currentPlan?: 'free' | 'pro' | 'family' | 'enterprise'
}

const comparisonRows = [
  { label: 'Subscriptions', pro: 'Unlimited', family: 'Unlimited shared', enterprise: 'Unlimited team' },
  { label: 'Analytics', pro: 'Advanced', family: 'Advanced', enterprise: 'Team reporting' },
  { label: 'Calendar', pro: 'Included', family: 'Shared', enterprise: 'Team' },
  { label: 'Members', pro: '1 user', family: 'Owner + 4 invited members', enterprise: 'Custom' },
  { label: 'Support', pro: 'Priority', family: 'Priority', enterprise: 'Dedicated' },
]

function iconForPlan(planId: string) {
  if (planId === 'pro') return Crown
  if (planId === 'family') return Users
  return Building2
}

function formatPrice(planId: string, currency: PlanCurrency) {
  const pricing = getPlanPricing(planId as any, currency)
  const symbol = getCurrencySymbol(currency)

  if (!pricing) return 'Custom pricing'
  if (pricing.amount === null) return pricing.priceText || 'Custom pricing'
  if (pricing.amount === 0) return 'Free'

  return `${symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}/${pricing.period}`
}

export function PlanSelectionSheet({ onClose, currentPlan = 'free' }: PlanSheetProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const notificationSettings = useStore((state) => state.notificationSettings)
  const selectedCurrency = getEffectiveCurrency(
    notificationSettings?.currencyCode,
    notificationSettings?.locale
  )
  const currencySymbol = getCurrencySymbol(selectedCurrency)
  const plans = getAllPlans()

  const handlePlanSelect = (planId: string) => {
    if (planId === currentPlan) return
    onClose()
    router.push(getUpgradeDestination(planId as 'pro' | 'family' | 'enterprise', isAuthenticated))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-foreground">Choose a plan</h3>
        <p className="mt-1 text-sm text-muted-foreground">Compare options and upgrade when you are ready.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.filter((plan) => plan.id !== 'free').map((plan) => {
          const Icon = iconForPlan(plan.id)
          const isCurrent = currentPlan === plan.id
          const pricing = getPlanPricing(plan.id, selectedCurrency)

          return (
            <button
              key={plan.id}
              onClick={() => handlePlanSelect(plan.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${isCurrent
                  ? 'border-gold bg-gold/10'
                  : 'border-border bg-card/80 hover:border-gold/40'
                }`}
              type="button"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Icon className="h-5 w-5" />
                </div>
                {plan.badge === 'popular' && (
                  <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
                    <Sparkles className="h-3 w-3" /> Popular
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground">{plan.name}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              <div className="mt-3">
                <p className="text-lg font-semibold text-foreground">{formatPrice(plan.id, selectedCurrency)}</p>
                {pricing?.savings && (
                  <p className="mt-1 text-xs font-medium text-emerald">
                    Save {currencySymbol}{pricing.savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}/month
                  </p>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {isCurrent && <p className="mt-3 text-xs font-medium text-emerald">Current plan</p>}
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <h4 className="font-semibold text-foreground">Comparison</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Feature</th>
                <th className="px-3 py-2 font-medium">Pro</th>
                <th className="px-3 py-2 font-medium">Family</th>
                <th className="py-2 pl-3 font-medium">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.label}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.pro}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.family}</td>
                  <td className="py-2 pl-3 text-muted-foreground">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
