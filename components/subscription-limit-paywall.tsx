'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { PremiumModal, PremiumBottomSheet } from '@/components/premium-modal'
import { durations, easings } from '@/components/motion'
import { getPricingForPaywall } from '@/lib/pricing-display'
import useStore from '@/lib/store'
import type { PlanCurrency } from '@/lib/plans'

interface SubscriptionLimitPaywallProps {
  isOpen: boolean
  onClose: () => void
  current?: number
  limit?: number
}

/**
 * Premium paywall for subscription limit reached (Free plan → Pro upgrade)
 * Desktop: modal, Mobile: bottom sheet
 * Shows starting price, value proposition, and strong CTAs
 * Uses user's selected currency from settings
 */
export function SubscriptionLimitPaywall({
  isOpen,
  onClose,
  current = 2,
  limit = 2,
}: SubscriptionLimitPaywallProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const userCurrency = (notificationSettings?.currencyCode || 'INR') as PlanCurrency
  const pricing = getPricingForPaywall('pro', userCurrency)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUpgrade = () => {
    onClose()
    // Route to upgrade page to see all plans and comparison
    router.push('/app/upgrade')
  }

  const content = (
    <div className="space-y-5">
      {/* Heading with strong value prop */}
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
          Unlock unlimited subscriptions
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You&apos;ve reached the limit on the Free plan. Upgrade now to track unlimited subscriptions and get premium features.
        </p>
      </div>

      {/* Starting price highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: durations.base, ease: easings.luxury, delay: 0.1 }}
        className="p-4 rounded-xl bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/20"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">
          Pro Plan starts at
        </p>
        <p className="text-3xl md:text-4xl font-bold text-foreground">
          {pricing.symbol}{pricing.amount !== null ? pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'Custom'}
          {pricing.amount !== null && (
            <span className="text-lg font-normal text-muted-foreground ml-2">
              /{pricing.period}
            </span>
          )}
        </p>
      </motion.div>

      {/* Usage indicator - minimal */}
      <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
          <span className="font-semibold text-foreground">{current} / {limit}</span> subscriptions used on Free plan
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgrade}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gold text-obsidian font-semibold shadow-luxury hover:shadow-2xl transition-shadow cursor-pointer"
        >
          <Zap className="w-5 h-5" />
          Upgrade to Pro
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-colors cursor-pointer"
        >
          Maybe later
        </motion.button>
      </div>
    </div>
  )

  // On mobile, use bottom sheet; on desktop, use modal
  if (isMobile) {
    return (
      <PremiumBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Upgrade to Pro"
        showCloseButton={true}
      >
        {content}
      </PremiumBottomSheet>
    )
  }

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade to Pro"
      size="md"
      showCloseButton={true}
    >
      {content}
    </PremiumModal>
  )
}
