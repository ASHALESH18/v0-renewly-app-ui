'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getAllPlans, getPlanPricing } from '@/lib/plans'
import { getCurrencySymbol, getCurrencyFromCountry } from '@/lib/currency'
import { getEffectiveCurrency } from '@/lib/pricing-display'
import { getUpgradeDestination, getStartedDestination } from '@/lib/upgrade-flow'
import { springs, staggerContainer, staggerItem, useMotionPreferences } from '../motion'
import { useAuth } from '@/lib/hooks/use-auth'
import useStore from '@/lib/store'

interface PricingProps {
  detectedCountry?: string | null
}

export function Pricing({ detectedCountry }: PricingProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const { isAuthenticated } = useAuth()
  const { shouldReduceAnimations } = useMotionPreferences()
  const notificationSettings = useStore((state) => state.notificationSettings)
  
  // Determine currency: user preference → detected country → locale → default
  let selectedCurrency = getEffectiveCurrency(
    notificationSettings?.currencyCode,
    notificationSettings?.locale
  )
  
  // If user has no preference and we detected their country, use that
  if (!notificationSettings?.currencyCode && detectedCountry) {
    selectedCurrency = getCurrencyFromCountry(detectedCountry)
  }
  
  const currencySymbol = getCurrencySymbol(selectedCurrency)
  const plans = getAllPlans()

  const getCtaHref = (planId: string): string => {
    if (planId === 'free') return getStartedDestination(isAuthenticated)
    if (planId === 'pro' || planId === 'family' || planId === 'enterprise') {
      return getUpgradeDestination(planId, isAuthenticated)
    }
    return '/auth/sign-up'
  }

  return (
    <section id="pricing" ref={ref} className="relative overflow-hidden bg-card/50 px-4 py-24 scroll-mt-24 dark:bg-graphite/50 lg:py-32">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-gold/[0.03] opacity-30 blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald/[0.03] opacity-25 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gold">Pricing</p>
          <h2 className="mb-3 text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl lg:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground md:text-base">
            Start free and upgrade when you need more. No hidden fees, no surprises.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4"
        >
          {plans.map((plan, index) => {
            const isPro = plan.id === 'pro'
            const isFamily = plan.id === 'family'
            const isFree = plan.id === 'free'
            const pricing = getPlanPricing(plan.id, selectedCurrency)

            return (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                whileHover={isPro || isFamily ? 'hover' : {}}
                initial={{ y: 0 }}
                className={`group relative flex cursor-pointer flex-col rounded-2xl p-6 transition-colors md:p-8 ${isPro
                    ? 'overflow-hidden border border-gold/30 bg-gradient-to-br from-secondary via-card to-secondary dark:from-slate dark:via-graphite dark:to-slate'
                    : isFamily
                      ? 'overflow-hidden border border-gold/40 bg-gradient-to-br from-secondary/80 via-card/80 to-secondary/80 dark:from-slate/80 dark:via-graphite/80 dark:to-slate/80'
                      : 'border border-glass-border bg-secondary/50 dark:bg-slate/50'
                  }`}
              >
                {(isPro || isFamily) && !shouldReduceAnimations && (
                  <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-gold/20 via-transparent to-gold/20 opacity-0 blur-lg transition-opacity group-hover:opacity-100" />
                )}

                {isPro && <div className="gold-gradient absolute left-0 right-0 top-0 h-1" />}
                {isFamily && <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-75" />}

                {plan.badge === 'popular' && (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                )}
                {isFamily && (
                  <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">
                    <span>👥</span>
                    Families
                  </div>
                )}

                <p className={`mb-2 text-sm ${isPro || isFamily ? 'text-gold' : 'text-platinum'}`}>
                  {plan.name}
                </p>

                <div className="mb-2 flex items-baseline gap-2">
                  {pricing && pricing.amount !== null ? (
                    <>
                      {pricing.originalAmount && (
                        <motion.span
                          className="text-lg text-platinum/50 line-through"
                          initial={{ opacity: 0 }}
                          animate={isInView ? { opacity: 1 } : {}}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        >
                          {currencySymbol}{pricing.originalAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </motion.span>
                      )}
                      <motion.span
                        className="text-4xl font-semibold text-foreground"
                        initial={{ opacity: 0, y: 8 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      >
                        {currencySymbol}{pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </motion.span>
                      <span className="text-platinum">/{pricing.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-gold">{pricing?.priceText || 'Custom pricing'}</span>
                  )}
                </div>

                {pricing?.savings && (
                  <motion.p
                    className="mb-4 text-xs text-gold/80"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                  >
                    Save {currencySymbol}{pricing.savings.toLocaleString('en-US', { maximumFractionDigits: 2 })}/month
                  </motion.p>
                )}

                {plan.extraNote && (
                  <motion.p
                    className="mb-4 text-xs italic text-gold/70"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                  >
                    {plan.extraNote}
                  </motion.p>
                )}

                <p className={`mb-6 text-sm ${isPro || isFamily ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>

                <Link href={getCtaHref(plan.id)}>
                  <motion.button
                    whileHover={{
                      scale: 1.03,
                      boxShadow: isPro || isFamily ? '0 16px 32px rgba(199, 163, 106, 0.2)' : undefined,
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`mb-8 w-full cursor-pointer rounded-xl py-3 font-medium transition-colors ${isPro || isFamily || plan.id === 'enterprise'
                        ? 'gold-gradient font-semibold text-obsidian shadow-luxury'
                        : isFree
                          ? 'border border-glass-border text-foreground hover:bg-glass'
                          : 'border border-glass-border text-foreground hover:bg-glass'
                      }`}
                    type="button"
                  >
                    {plan.cta || 'Get started'}
                  </motion.button>
                </Link>

                <div className="flex-1 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={feature}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.15 + featureIndex * 0.05 + 0.5, duration: 0.4 }}
                    >
                      <Check className={`mt-0.5 h-5 w-5 shrink-0 ${isPro || isFamily ? 'text-gold drop-shadow-[0_0_12px_rgba(199,163,106,0.4)]' :
                          plan.id === 'enterprise' ? 'text-[#6EE7D7]' :
                            'text-emerald'
                        }`} />
                      <span className={`text-sm ${isPro || isFamily ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature}
                      </span>
                    </motion.div>
                  ))}

                  {plan.limitations?.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-3">
                      <X className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>

                {isPro && <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gold/10 opacity-60 blur-2xl" />}
                {isFamily && <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-gold/15 opacity-50 blur-2xl" />}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
