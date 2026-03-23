'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Check } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { springs } from '@/lib/motion'

export interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'subscription-limit' | 'feature-gated' | 'plan-expired'
  currentLimit?: number
  maxLimit?: number
}

export function UpgradePrompt({
  isOpen,
  onClose,
  reason = 'subscription-limit',
  currentLimit,
  maxLimit,
}: UpgradePromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'family'>('pro')

  const getReason Text = () => {
    switch (reason) {
      case 'subscription-limit':
        return `You've reached the ${maxLimit}-subscription limit on your Free plan`
      case 'feature-gated':
        return 'This feature is only available on Pro plan and above'
      case 'plan-expired':
        return 'Your trial period has ended'
      default:
        return 'Upgrade your plan to unlock more features'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={springs.gentle}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-slate rounded-2xl border border-glass-border p-8 shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-platinum hover:text-ivory transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                    <Zap className="w-5 h-5 text-obsidian" />
                  </div>
                  <h2 className="text-2xl font-semibold text-ivory">Upgrade to Pro</h2>
                </motion.div>
                <p className="text-platinum">{getReasonText()}</p>
              </div>

              {/* Plan comparison */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Pro */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === 'pro'
                      ? 'border-gold bg-gold/5'
                      : 'border-glass-border hover:border-gold/50'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-ivory mb-2">Pro</h3>
                  <p className="text-sm text-gold mb-4 font-medium">₹149/month</p>
                  <ul className="space-y-2">
                    {[
                      'Unlimited subscriptions',
                      'Advanced analytics',
                      'Leak Report',
                      'Priority support',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-platinum">
                        <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Family */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setSelectedPlan('family')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedPlan === 'family'
                      ? 'border-gold bg-gold/5'
                      : 'border-glass-border hover:border-gold/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-ivory">Family</h3>
                    <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">Popular</span>
                  </div>
                  <p className="text-sm text-gold mb-4 font-medium">₹299/month</p>
                  <ul className="space-y-2">
                    {[
                      'Everything in Pro',
                      'Up to 4 family members',
                      'Shared dashboard',
                      'Family reports',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-platinum">
                        <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-4"
              >
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-glass-border text-ivory font-medium hover:bg-glass transition-colors"
                >
                  Maybe later
                </button>
                <Link
                  href={`/app/upgrade?plan=${selectedPlan}`}
                  className="flex-1"
                >
                  <button className="w-full px-6 py-3 rounded-xl gold-gradient text-obsidian font-semibold hover:shadow-luxury transition-shadow">
                    Upgrade now
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
