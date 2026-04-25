'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Zap, ArrowRight } from 'lucide-react'
import { PremiumModal, PremiumBottomSheet } from '@/components/premium-modal'
import { durations, easings } from '@/components/motion'
import { getPricingForPaywall } from '@/lib/pricing-display'

interface SubscriptionLimitPaywallProps {
  isOpen: boolean
  onClose: () => void
  current?: number
  limit?: number
  userCurrency?: string
}

/**
 * Premium paywall for subscription limit reached (Free plan → Pro upgrade)
 * Desktop: modal, Mobile: bottom sheet
 * Shows starting price, value proposition, and strong CTAs
 */
export function SubscriptionLimitPaywall({
  isOpen,
  onClose,
  current = 2,
  limit = 2,
  userCurrency = 'INR',
}: SubscriptionLimitPaywallProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const pricing = getPricingForPaywall(userCurrency)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUpgrade = () => {
    onClose()
    // Route to upgrade page WITHOUT plan preselection so user can see all options
    router.push('/app/upgrade')
  }

  const handleComparePlans = () => {
    onClose()
    // Route to full upgrade flow to see all plans (same destination as Upgrade button)
    // User will see plan selection/comparison interface
    router.push('/app/upgrade')
  }

  const benefitsVariants = {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.15,
        },
      },
    },
    item: {
      initial: { opacity: 0, x: -12 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { duration: durations.base, ease: easings.silk },
      },
    },
  }

  const benefits = [
    'Unlimited subscriptions',
    'Smart renewal calendar',
    'Leak Report & security insights',
    'Advanced analytics & reports',
  ]

  const content = (
    <div className="space-y-6">
      {/* Heading with strong value prop */}
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
          Unlock unlimited subscriptions
        </h2>
        <p className="text-base text-muted-foreground">
          You&apos;ve reached the {limit} subscription limit on the Free plan. Upgrade to Pro to track unlimited subscriptions and unlock premium features.
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
          Pro Plan Starting Price
        </p>
        <p className="text-3xl md:text-4xl font-bold text-foreground">
          {pricing.symbol}{pricing.amount}
          <span className="text-lg font-normal text-muted-foreground ml-2">
            /{pricing.period}
          </span>
        </p>
      </motion.div>

      {/* Usage indicator */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-semibold text-foreground">{current} / {limit}</span> subscriptions used on Free plan
        </p>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: durations.reveal, ease: easings.luxury }}
            className="h-full bg-gold rounded-full"
          />
        </div>
      </div>

      {/* Premium features section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          What you&apos;ll unlock
        </h3>
        <motion.div
          variants={benefitsVariants.container}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit}
              variants={benefitsVariants.item}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald" />
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
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

      {/* Compare plans link */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleComparePlans}
        className="w-full flex items-center justify-center gap-2 text-gold hover:text-gold/80 font-medium text-sm transition-colors cursor-pointer group"
      >
        Compare all plans
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </motion.button>
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
