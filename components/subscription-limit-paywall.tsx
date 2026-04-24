'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Check, Zap } from 'lucide-react'
import { PremiumModal, PremiumBottomSheet } from '@/components/premium-modal'
import { durations, easings } from '@/components/motion'

interface SubscriptionLimitPaywallProps {
  isOpen: boolean
  onClose: () => void
  current?: number
  limit?: number
}

/**
 * Premium paywall for subscription limit reached.
 * Desktop: modal, Mobile: bottom sheet
 * Matches Renewly's premium Glass aesthetic
 */
export function SubscriptionLimitPaywall({
  isOpen,
  onClose,
  current = 2,
  limit = 2,
}: SubscriptionLimitPaywallProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUpgrade = () => {
    onClose()
    router.push('/app/upgrade?plan=pro')
  }

  const benefitsVariants = {
    container: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
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

  const content = (
    <div className="space-y-6">
      {/* Usage indicator */}
      <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
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

      {/* Main benefits section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Unlock with Pro
        </h3>
        <motion.div
          variants={benefitsVariants.container}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {[
            'Unlimited subscriptions',
            'Smart inbox + automation',
            'Renewal intelligence & insights',
            'Priority support',
          ].map((benefit) => (
            <motion.div
              key={benefit}
              variants={benefitsVariants.item}
              className="flex items-start gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-emerald/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-emerald" />
              </div>
              <span className="text-sm text-muted-foreground">{benefit}</span>
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gold text-obsidian font-semibold shadow-luxury hover:shadow-2xl transition-shadow"
        >
          <Zap className="w-5 h-5" />
          Upgrade to Pro
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full px-4 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-colors"
        >
          Maybe later
        </motion.button>
      </div>

      {/* Optional: comparison link */}
      <p className="text-xs text-center text-muted-foreground">
        <button
          onClick={() => {
            onClose()
            router.push('/app/upgrade?plan=pro')
          }}
          className="text-gold hover:underline"
        >
          Compare plans
        </button>
      </p>
    </div>
  )

  // On mobile, use bottom sheet; on desktop, use modal
  if (isMobile) {
    return (
      <PremiumBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Upgrade to add more subscriptions"
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
      title="Upgrade to add more subscriptions"
      size="md"
      showCloseButton={true}
    >
      {content}
    </PremiumModal>
  )
}
