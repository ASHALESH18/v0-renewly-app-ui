'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'
import { PremiumModal, PremiumBottomSheet } from '@/components/premium-modal'
import { durations, easings } from '@/components/motion'
import { getPricingForPaywall, getEffectiveCurrency } from '@/lib/pricing-display'
import useStore from '@/lib/store'

interface SubscriptionLimitPaywallProps {
  isOpen: boolean
  onClose: () => void
  current?: number
  limit?: number
}

export function SubscriptionLimitPaywall({
  isOpen,
  onClose,
  current = 2,
  limit = 2,
}: SubscriptionLimitPaywallProps) {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const notificationSettings = useStore((state) => state.notificationSettings)
  const userCurrency = getEffectiveCurrency(
    notificationSettings?.currencyCode,
    notificationSettings?.locale
  )
  const pricing = getPricingForPaywall('pro', userCurrency)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleUpgrade = () => {
    onClose()
    router.push('/app/upgrade')
  }

  const content = (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground md:text-3xl">
          Unlock unlimited subscriptions
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You&apos;ve reached the limit on the Free plan. Upgrade now to track unlimited subscriptions and get premium features.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: durations.base, ease: easings.luxury, delay: 0.1 }}
        className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 p-4"
      >
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Pro Plan starts at
        </p>
        <p className="text-3xl font-bold text-foreground md:text-4xl">
          {pricing.amount !== null ? `${pricing.symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'Custom'}
          {pricing.amount !== null && (
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              /{pricing.period}
            </span>
          )}
        </p>
      </motion.div>

      <div className="rounded-lg border border-border/50 bg-muted/40 p-3 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">{current} / {limit}</span> subscriptions used on Free plan
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgrade}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3.5 font-semibold text-obsidian shadow-luxury transition-shadow hover:shadow-2xl"
          type="button"
        >
          <Zap className="h-5 w-5" />
          Upgrade to Pro
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full cursor-pointer rounded-xl border border-border px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted/50"
          type="button"
        >
          Maybe later
        </motion.button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <PremiumBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Upgrade to Pro"
        showCloseButton
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
      showCloseButton
    >
      {content}
    </PremiumModal>
  )
}
