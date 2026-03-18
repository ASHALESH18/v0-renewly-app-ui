'use client'

import { motion } from 'framer-motion'
import { Check, ChevronRight, Sparkles } from 'lucide-react'
import { springs } from '@/components/motion'
import { getAllPlans } from '@/lib/plans'
import Link from 'next/link'

export interface PlanSheetProps {
  onClose: () => void
  currentPlan?: 'free' | 'pro' | 'family' | 'enterprise'
}

export function PlanSelectionSheet({ onClose, currentPlan = 'free' }: PlanSheetProps) {
  const plans = getAllPlans()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="rounded-2xl bg-slate/50 border border-glass-border p-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-ivory">Choose Your Plan</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-ivory transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              currentPlan === plan.id
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
                
                <div className="flex items-baseline gap-1 mb-2">
                  {plan.price !== null ? (
                    <>
                      <span className="text-lg font-semibold text-ivory">₹{plan.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-platinum">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gold font-medium">{plan.priceText}</span>
                  )}
                </div>

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

      <div className="pt-4 border-t border-glass-border">
        <p className="text-xs text-muted-foreground text-center">
          Need help choosing? <a href="/help" className="text-gold hover:underline">View comparison</a>
        </p>
      </div>
    </motion.div>
  )
}
