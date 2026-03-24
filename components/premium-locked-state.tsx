'use client'

import { motion } from 'framer-motion'
import { Lock, Crown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { PlanType } from '@/lib/plan-capabilities'

interface PremiumLockedStateProps {
  featureName: string
  description?: string
  requiredPlan?: PlanType
  currentPlan?: PlanType
}

export function PremiumLockedState({
  featureName,
  description,
  requiredPlan = 'pro',
  currentPlan = 'free',
}: PremiumLockedStateProps) {
  const planNames: Record<PlanType, string> = {
    free: 'Free',
    pro: 'Pro',
    family: 'Family',
    enterprise: 'Enterprise',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12"
    >
      {/* Blurred background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Lock icon with glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl scale-150" />
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30">
          <Lock className="w-10 h-10 text-gold" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-2xl md:text-3xl font-serif text-ivory text-center mb-3"
      >
        {featureName} is a Premium Feature
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-platinum/80 text-center max-w-md mb-2"
      >
        {description || `Upgrade to ${planNames[requiredPlan]} to unlock ${featureName.toLowerCase()} and take control of your subscriptions.`}
      </motion.p>

      {/* Current plan indicator */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-platinum/50 mb-8"
      >
        Your current plan: <span className="text-platinum">{planNames[currentPlan]}</span>
      </motion.p>

      {/* Upgrade CTA */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/#pricing">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-gold/90 text-obsidian font-semibold shadow-lg shadow-gold/20 cursor-pointer"
          >
            <Crown className="w-5 h-5" />
            <span>Upgrade to {planNames[requiredPlan]}</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </Link>
      </motion.div>

      {/* Feature preview hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xs text-platinum/40 mt-6 text-center"
      >
        Pro and Family plans include advanced analytics, leak reports, and unlimited subscriptions
      </motion.p>
    </motion.div>
  )
}
