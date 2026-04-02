'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Sparkles, ArrowLeft, X, Zap, Crown, Users, Building2 } from 'lucide-react'
import { springs } from '@/components/motion'
import { getAllPlans } from '@/lib/plans'
import { useRouter } from 'next/navigation'
import { getUpgradeDestination } from '@/lib/upgrade-flow'
import { useAuth } from '@/lib/hooks/use-auth'

export interface PlanSheetProps {
  onClose: () => void
  currentPlan?: 'free' | 'pro' | 'family' | 'enterprise'
}

export function PlanSelectionSheet({ onClose, currentPlan = 'free' }: PlanSheetProps) {
  const plans = getAllPlans()
  const [showComparison, setShowComparison] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  // If showing comparison view
  if (showComparison) {
    return <PlanComparisonView onBack={() => setShowComparison(false)} currentPlan={currentPlan} />
  }

  // If showing upgrade flow
  if (selectedPlan && selectedPlan !== currentPlan && selectedPlan !== 'enterprise') {
    return (
      <UpgradeFlowView
        planId={selectedPlan as 'pro' | 'family'}
        onBack={() => setSelectedPlan(null)}
        onClose={onClose}
      />
    )
  }

  // Enterprise contact flow
  if (selectedPlan === 'enterprise') {
    return (
      <EnterpriseContactView
        onBack={() => setSelectedPlan(null)}
        onClose={onClose}
      />
    )
  }

  const handlePlanClick = (planId: string) => {
    if (planId === currentPlan) return // Already on this plan
    setSelectedPlan(planId)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springs.gentle}
      className="space-y-4"
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          const isUpgrade = !isCurrentPlan && plan.id !== 'free'
          
          return (
            <motion.div
              key={plan.id}
              whileHover={!isCurrentPlan ? { scale: 1.02 } : {}}
              whileTap={!isCurrentPlan ? { scale: 0.98 } : {}}
              onClick={() => handlePlanClick(plan.id)}
              className={`p-4 rounded-xl border transition-all ${
                isCurrentPlan
                  ? 'bg-gold/10 border-gold/50 cursor-default'
                  : 'bg-secondary/50 border-border hover:border-gold/40 cursor-pointer active:bg-secondary/70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.badge === 'popular' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium">
                        <Sparkles className="w-3 h-3" />
                        Popular
                      </span>
                    )}
                    {isCurrentPlan && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{plan.description}</p>

                  <div className="flex items-baseline gap-2 mb-2">
                    {plan.price !== null ? (
                      <>
                        {plan.originalPrice && (
                          <span className="text-sm text-muted-foreground/50 line-through">
                            ₹{plan.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="text-lg font-semibold text-foreground">₹{plan.price.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-muted-foreground">/{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gold font-medium">{plan.priceText}</span>
                    )}
                  </div>

                  {plan.savings && (
                    <p className="text-xs text-gold/80 mb-2">
                      Save ₹{plan.savings.toLocaleString('en-IN')}/month
                    </p>
                  )}

                  {plan.extraNote && (
                    <p className="text-xs text-gold/70 mb-2 italic">
                      {plan.extraNote}
                    </p>
                  )}

                  <ul className="space-y-1">
                    {plan.features.slice(0, 2).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-gold shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 pt-1">
                  {isCurrentPlan ? (
                    <div className="rounded-full bg-gold/20 p-1.5">
                      <Check className="w-4 h-4 text-gold" />
                    </div>
                  ) : isUpgrade ? (
                    <div className="rounded-full bg-gold/10 p-1.5 group-hover:bg-gold/20 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gold" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
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

// Upgrade Flow View - shows when user selects Pro or Family
function UpgradeFlowView({
  planId,
  onBack,
  onClose,
}: {
  planId: 'pro' | 'family'
  onBack: () => void
  onClose: () => void
}) {
  const plans = getAllPlans()
  const plan = plans.find(p => p.id === planId)!
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const PlanIcon = planId === 'pro' ? Crown : Users

  const handleStartTrial = async () => {
    setIsProcessing(true)
    
    // Get the correct destination based on auth state
    const destination = getUpgradeDestination(planId, isAuthenticated)
    
    // Close modal and navigate
    onClose()
    router.push(destination)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={springs.gentle}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">Upgrade to {plan.name}</h3>
      </div>

      {/* Plan summary card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <PlanIcon className="w-6 h-6 text-gold" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-1">{plan.name} Plan</h4>
            <div className="flex items-baseline gap-2">
              {plan.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{plan.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-2xl font-bold text-gold">₹{plan.price?.toLocaleString('en-IN')}</span>
              <span className="text-sm text-muted-foreground">/{plan.period}</span>
            </div>
            {plan.savings && (
              <p className="text-sm text-emerald mt-1">Save ₹{plan.savings.toLocaleString('en-IN')}/month</p>
            )}
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-foreground">What&apos;s included:</h5>
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald" />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trial notice */}
      <div className="p-3 rounded-xl bg-emerald/10 border border-emerald/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald" />
          <p className="text-sm text-emerald font-medium">14-day free trial included</p>
        </div>
        <p className="text-xs text-emerald/80 mt-1 ml-6">No charge until trial ends. Cancel anytime.</p>
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartTrial}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-obsidian/30 border-t-obsidian rounded-full"
              />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Start Free Trial
            </>
          )}
        </motion.button>
        <p className="text-xs text-center text-muted-foreground">
          You&apos;ll be redirected to complete payment setup
        </p>
      </div>
    </motion.div>
  )
}

// Enterprise Contact View
function EnterpriseContactView({
  onBack,
  onClose,
}: {
  onBack: () => void
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to a CRM or email service
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-4"
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Request Received</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Our enterprise team will reach out within 1-2 business days to discuss your needs.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2.5 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
        >
          Done
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={springs.gentle}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-semibold text-foreground">Contact Sales</h3>
      </div>

      {/* Enterprise card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Enterprise Plan</h4>
            <p className="text-sm text-muted-foreground">Custom pricing for teams & organizations</p>
          </div>
        </div>
      </div>

      {/* Contact form */}
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
          disabled={!email || !company}
          className="w-full py-3.5 rounded-xl bg-gold text-obsidian font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request Demo
        </button>
      </form>
    </motion.div>
  )
}

// Premium check icon with subtle glow
function PremiumCheck() {
  return (
    <div className="relative mx-auto w-5 h-5">
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-emerald/30 blur-[6px]" />
      <div className="relative w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center border border-emerald/40">
        <Check className="w-3 h-3 text-emerald" strokeWidth={3} />
      </div>
    </div>
  )
}

// Muted unavailable icon - no glow, intentionally subdued
function MutedCross() {
  return (
    <div className="mx-auto w-5 h-5 rounded-full bg-muted/40 flex items-center justify-center">
      <X className="w-3 h-3 text-muted-foreground/30" strokeWidth={2} />
    </div>
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
            <tr className="border-b-2 border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Feature</th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={`text-center py-3 px-2 font-semibold ${
                    plan.id === currentPlan 
                      ? 'text-gold' 
                      : 'text-foreground'
                  }`}
                >
                  <span className="block">{plan.name}</span>
                  {plan.id === currentPlan && (
                    <span className="block text-[10px] font-medium text-emerald bg-emerald/10 rounded-full px-2 py-0.5 mt-1 mx-auto w-fit">
                      Current
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Row */}
            <tr className="border-b border-border/50 bg-gold/5">
              <td className="py-3 px-2 font-semibold text-foreground">Price</td>
              {plans.map((plan) => (
                <td key={plan.id} className="text-center py-3 px-2">
                  {plan.price !== null ? (
                    <span className="font-bold text-foreground">
                      ₹{plan.price}
                      <span className="font-normal text-muted-foreground text-xs">
                        /{plan.period === 'forever' ? '' : plan.period?.slice(0, 2)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gold font-semibold">Custom</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Feature Rows */}
            {featureMatrix.map((feature, idx) => (
              <tr 
                key={feature.name} 
                className={`border-b border-border/20 transition-colors hover:bg-muted/30 ${
                  idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'
                }`}
              >
                <td className="py-3 px-2 text-foreground/80 font-medium">{feature.name}</td>
                {(['free', 'pro', 'family', 'enterprise'] as const).map((planId) => {
                  const value = feature[planId]
                  return (
                    <td key={planId} className="text-center py-3 px-2">
                      {typeof value === 'boolean' ? (
                        value ? <PremiumCheck /> : <MutedCross />
                      ) : (
                        <span className={`text-xs font-medium ${
                          value === '-' 
                            ? 'text-muted-foreground/40' 
                            : value === 'Unlimited' || value === 'Dedicated'
                              ? 'text-emerald font-semibold'
                              : 'text-foreground'
                        }`}>
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
