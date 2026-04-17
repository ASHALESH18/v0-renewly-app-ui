'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { springs, staggerContainer, staggerItem, premiumCardHover, badgeEntrance } from '../motion'
import { getAllPlans } from '@/lib/plans'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { getUpgradeDestination, getStartedDestination } from '@/lib/upgrade-flow'

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const { isAuthenticated } = useAuth()

  const plans = getAllPlans()

  // Get auth-aware CTA href for each plan
  const getCtaHref = (planId: string): string => {
    if (planId === 'free') {
      return getStartedDestination(isAuthenticated)
    }
    if (planId === 'pro' || planId === 'family' || planId === 'enterprise') {
      return getUpgradeDestination(planId, isAuthenticated)
    }
    return '/auth/sign-up'
  }

  return (
    <section id="pricing" ref={ref} className="py-24 lg:py-32 px-4 bg-card/50 dark:bg-graphite/50 relative overflow-hidden scroll-mt-24">
      {/* Subtle background elements */}
      <motion.div 
        className="absolute top-0 right-0 w-80 h-80 bg-gold/[0.03] rounded-full blur-[100px]"
        animate={{ 
          opacity: [0.25, 0.4, 0.25],
          scale: [1, 1.08, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-72 h-72 bg-emerald/[0.03] rounded-full blur-[80px]"
        animate={{ 
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header - refined */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-14"
        >
          <p className="text-gold text-xs font-medium tracking-wider uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground tracking-[-0.02em] mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm md:text-base">
            Start free and upgrade when you need more. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {plans.map((plan, index) => {
            const isPro = plan.id === 'pro'
            const isFamily = plan.id === 'family'
            const isFree = plan.id === 'free'
            
            return (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                whileHover={isPro || isFamily ? 'hover' : {}}
                initial={{ y: 0 }}
                className={`relative rounded-2xl p-6 md:p-8 flex flex-col cursor-pointer transition-colors group ${
                  isPro
                    ? 'bg-gradient-to-br from-secondary via-card to-secondary dark:from-slate dark:via-graphite dark:to-slate border border-gold/30 overflow-hidden'
                    : isFamily
                    ? 'bg-gradient-to-br from-secondary/80 via-card/80 to-secondary/80 dark:from-slate/80 dark:via-graphite/80 dark:to-slate/80 border border-gold/40 overflow-hidden'
                    : 'bg-secondary/50 dark:bg-slate/50 border border-glass-border'
                }`}
              >
                {/* Premium glow overlay on hover for Pro and Family */}
                {(isPro || isFamily) && (
                  <motion.div
                    className="absolute -inset-1 bg-gradient-to-r from-gold/20 via-transparent to-gold/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                    animate={{ 
                      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}

                {/* Gold accent for Pro */}
                {isPro && <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />}
                
                {/* Gold accent for Family - signature animation */}
                {isFamily && (
                  <motion.div 
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                    animate={{ 
                      opacity: [0.5, 1, 0.5],
                      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%']
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                
                {/* Popular badge */}
                {plan.badge === 'popular' && (
                  <motion.div 
                    variants={badgeEntrance}
                    initial="initial"
                    animate="animate"
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-3 h-3" />
                    </motion.div>
                    Most Popular
                  </motion.div>
                )}

                {/* Family Plan badge */}
                {isFamily && (
                  <motion.div 
                    variants={badgeEntrance}
                    initial="initial"
                    animate="animate"
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      👥
                    </motion.span>
                    Families
                  </motion.div>
                )}

                <p className={`text-sm mb-2 ${isPro || isFamily ? 'text-gold' : 'text-platinum'}`}>
                  {plan.name}
                </p>
                
                <div className="flex items-baseline gap-2 mb-2">
                  {plan.price !== null ? (
                    <>
                      {/* Old price struck through */}
                      {plan.originalPrice && (
                        <motion.span 
                          className="text-lg text-platinum/50 line-through"
                          initial={{ opacity: 0 }}
                          animate={isInView ? { opacity: 1 } : {}}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                        >
                          ₹{plan.originalPrice.toLocaleString('en-IN')}
                        </motion.span>
                      )}
                      
                      {/* Current price */}
                      <motion.span 
                        className={`text-4xl font-semibold ${isPro || isFamily ? 'text-foreground' : 'text-foreground'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                      >
                        ₹{plan.price.toLocaleString('en-IN')}
                      </motion.span>
                      <span className="text-platinum">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-gold">{plan.priceText}</span>
                  )}
                </div>

                {/* Savings note */}
                {plan.savings && (
                  <motion.p 
                    className="text-xs text-gold/80 mb-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                  >
                    Save ₹{plan.savings.toLocaleString('en-IN')}/month
                  </motion.p>
                )}

                {plan.yearlyPrice && (
                  <motion.p 
                    className="text-xs text-platinum mb-6"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.4, duration: 0.5 }}
                  >
                    or ₹{plan.yearlyPrice.toLocaleString('en-IN')}/year (save ₹{plan.yearlySavings})
                  </motion.p>
                )}
                
                <p className={`text-sm mb-6 ${isPro || isFamily ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>

                {/* Extra note for Family plan */}
                {plan.extraNote && (
                  <motion.p 
                    className="text-xs text-gold/70 mb-4 italic"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                  >
                    {plan.extraNote}
                  </motion.p>
                )}

                <Link href={getCtaHref(plan.id)}>
                  <motion.button
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: isPro || isFamily ? '0 16px 32px rgba(199, 163, 106, 0.2)' : undefined
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl font-medium mb-8 transition-colors cursor-pointer ${
                      isPro
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : isFamily
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : isFree
                        ? 'border border-glass-border text-foreground hover:bg-glass'
                        : plan.id === 'enterprise'
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : 'border border-glass-border text-foreground hover:bg-glass'
                    }`}
                  >
                    {plan.cta || 'Get started'}
                  </motion.button>
                </Link>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div 
                      key={feature} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: index * 0.15 + featureIndex * 0.05 + 0.5, duration: 0.4 }}
                    >
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isPro || isFamily ? 'text-gold drop-shadow-[0_0_12px_rgba(199,163,106,0.4)]' : 
                        plan.id === 'enterprise' ? 'text-[#6EE7D7] drop-shadow-[0_0_16px_rgba(110,231,215,0.6)] drop-shadow-[0_0_8px_rgba(110,231,215,0.4)] drop-shadow-[0_0_3px_rgba(110,231,215,0.8)]' :
                        'text-emerald'
                      }`} />
                      <span className={`text-sm ${isPro || isFamily ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                  
                  {plan.limitations?.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* Decorative glow for Pro */}
                {isPro && (
                  <motion.div 
                    className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-2xl"
                    animate={{ 
                      opacity: [0.4, 0.8, 0.4],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Decorative glow for Family */}
                {isFamily && (
                  <motion.div 
                    className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/15 blur-2xl"
                    animate={{ 
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.15, 1]
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
