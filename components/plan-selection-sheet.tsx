'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Sparkles, ArrowLeft, X } from 'lucide-react'
import { springs } from '@/components/motion'
import { getAllPlans } from '@/lib/plans'
import Link from 'next/link'
export interface PlanSheetProps {
  onClose: () => void
  currentPlan?: 'free' | 'pro' | 'family' | 'enterprise'
}

export function PlanSelectionSheet({ onClose, currentPlan = 'free' }: PlanSheetProps) {
  const plans = getAllPlans()
  const [showComparison, setShowComparison] = useState(false)

  // If showing comparison view
  if (showComparison) {
    return <PlanComparisonView onBack={() => setShowComparison(false)} currentPlan={currentPlan} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springs.gentle}
      className="space-y-4"
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${currentPlan === plan.id
                ? 'bg-gold/10 border-gold/50'
                : 'bg-slate/30 border-glass-border hover:border-gold/30'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-ivory">{plan.name}</h3>
                  {plan.badge === 'popular' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Popular
                    </span>
                  )}
                </div>
                <p className="text-xs text-platinum mb-2">{plan.description}</p>

                <div className="flex items-baseline gap-2 mb-2">
                  {plan.price !== null ? (
                    <>
                      {/* Old price struck through */}
                      {plan.originalPrice && (
                        <span className="text-sm text-platinum/50 line-through">
                          ₹{plan.originalPrice.toLocaleString('en-IN')}
                        </span>
                      )}

                      {/* Current price */}
                      <span className="text-lg font-semibold text-ivory">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-platinum">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gold font-medium">{plan.priceText}</span>
                  )}
                </div>

                {/* Savings note */}
                {plan.savings && (
                  <p className="text-xs text-gold/80 mb-2">
                    Save ₹{plan.savings.toLocaleString('en-IN')}/month
                  </p>
                )}

                {/* Extra note for Family plan */}
                {plan.extraNote && (
                  <p className="text-xs text-gold/70 mb-2 italic">
                    {plan.extraNote}
                  </p>
                )}

                <ul className="space-y-1">
                  {plan.features.slice(0, 2).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-platinum">
                      <Check className="w-3 h-3 text-gold shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="shrink-0 pt-1">
                {currentPlan === plan.id && (
                  <div className="rounded-full bg-gold/20 p-1">
                    <Check className="w-4 h-4 text-gold" />
                  </div>
                )}
                {currentPlan !== plan.id && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Enterprise action */}
            {plan.id === 'enterprise' && plan.ctaHref && (
              <Link href={plan.ctaHref} className="block mt-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-lg border border-gold/50 text-gold text-sm font-medium hover:bg-gold/10 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                >
                  {plan.cta}
                </motion.button>
              </Link>
            )}
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Need help choosing?{' '}
          <button
            onClick={() => setShowComparison(true)}
            className="text-gold hover:underline cursor-pointer"
          >
            View comparison
          </button>
        </p>
      </div>
    </motion.div>
  )
}

// Plan Comparison View Component
function PlanComparisonView({
  onBack,
  currentPlan
}: {
  onBack: () => void
  currentPlan: string
}) {
  const plans = getAllPlans()

  // Feature comparison matrix
  const featureMatrix = [
    { name: 'Subscriptions', free: 'Up to 2', pro: 'Unlimited', family: 'Unlimited', enterprise: 'Unlimited' },
    { name: 'Analytics Dashboard', free: false, pro: true, family: true, enterprise: true },
    { name: 'Leak Report', free: false, pro: true, family: true, enterprise: true },
    { name: 'Multi-currency', free: false, pro: true, family: true, enterprise: true },
    { name: 'Renewal Calendar', free: 'Basic', pro: 'Smart', family: 'Shared', enterprise: 'Shared' },
    { name: 'Export (CSV/JSON)', free: false, pro: true, family: true, enterprise: true },
    { name: 'Family Members', free: '-', pro: '-', family: 'Up to 4', enterprise: 'Unlimited' },
    { name: 'Shared Dashboard', free: false, pro: false, family: true, enterprise: true },
    { name: 'Team Analytics', free: false, pro: false, family: false, enterprise: true },
    { name: 'Admin Controls', free: false, pro: false, family: false, enterprise: true },
    { name: 'Audit Logs', free: false, pro: false, family: false, enterprise: true },
    { name: 'Priority Support', free: false, pro: true, family: true, enterprise: 'Dedicated' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={springs.gentle}
      className="space-y-4"
    >
      {/* Header with back button */}
      <div className="flex items-center gap-3 pb-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">Plan Comparison</h3>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Feature</th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={`text-center py-3 px-2 font-semibold ${plan.id === currentPlan ? 'text-gold' : 'text-foreground'
                    }`}
                >
                  {plan.name}
                  {plan.id === currentPlan && (
                    <span className="block text-xs font-normal text-gold/70">Current</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Row */}
            <tr className="border-b border-border/50 bg-muted/30">
              <td className="py-3 px-2 font-medium text-foreground">Price</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-3 px-2">
                  {plan.price !== null ? (
                    <span className="font-semibold text-foreground">
                      ₹{plan.price}/{plan.period === 'forever' ? '' : plan.period?.slice(0, 2)}
                    </span>
                  ) : (
                    <span className="text-gold font-medium">Custom</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Feature Rows */}
            {featureMatrix.map((feature, idx) => (
              <tr key={feature.name} className={`border-b border-border/30 ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                <td className="py-2.5 px-2 text-muted-foreground">{feature.name}</td>
                {(['free', 'pro', 'family', 'enterprise'] as const).map((planId) => {
                  const value = feature[planId]
                  return (
                    <td key={planId} className="text-center py-2.5 px-2">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-4 h-4 text-emerald mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className={`text-xs ${value === '-' ? 'text-muted-foreground/50' : 'text-foreground'}`}>
                          {value}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs text-center text-muted-foreground mb-3">
          All paid plans include a 14-day free trial
        </p>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors"
        >
          Choose a Plan
        </button>
      </div>
    </motion.div>
  )
}
