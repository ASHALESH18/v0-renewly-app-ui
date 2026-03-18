'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { springs, staggerContainer, staggerItem } from '../motion'
import { getAllPlans } from '@/lib/plans'
import Link from 'next/link'

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const plans = getAllPlans()

  return (
    <section ref={ref} className="py-24 lg:py-32 px-4 bg-graphite relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={springs.gentle}
          className="text-center mb-16"
        >
          <p className="text-gold text-sm font-medium tracking-wide uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-ivory tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-platinum max-w-xl mx-auto">
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
          {plans.map((plan) => {
            const isPro = plan.id === 'pro'
            const isFree = plan.id === 'free'
            
            return (
              <motion.div
                key={plan.id}
                variants={staggerItem}
                className={`relative rounded-2xl p-6 md:p-8 flex flex-col ${
                  isPro
                    ? 'bg-gradient-to-br from-slate via-graphite to-slate border border-gold/30 overflow-hidden'
                    : 'bg-slate/50 border border-glass-border'
                }`}
              >
                {/* Gold accent for Pro */}
                {isPro && <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />}
                
                {/* Popular badge */}
                {plan.badge === 'popular' && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <p className={`text-sm mb-2 ${isPro ? 'text-gold' : 'text-platinum'}`}>
                  {plan.name}
                </p>
                
                <div className="flex items-baseline gap-1 mb-2">
                  {plan.price !== null ? (
                    <>
                      <span className={`text-4xl font-semibold ${isPro ? 'text-ivory' : 'text-ivory'}`}>
                        ₹{plan.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-platinum">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-semibold text-gold">{plan.priceText}</span>
                  )}
                </div>

                {plan.yearlyPrice && (
                  <p className="text-xs text-platinum mb-6">
                    or ₹{plan.yearlyPrice.toLocaleString('en-IN')}/year (save ₹{plan.yearlySavings})
                  </p>
                )}
                
                <p className={`text-sm mb-6 ${isPro ? 'text-ivory' : 'text-platinum'}`}>
                  {plan.description}
                </p>

                <Link href={plan.ctaHref || '/auth/sign-up'}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-xl font-medium mb-8 transition-colors ${
                      isPro
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : isFree
                        ? 'border border-glass-border text-ivory hover:bg-glass'
                        : plan.id === 'enterprise'
                        ? 'border border-gold/50 text-gold hover:bg-gold/10'
                        : 'border border-glass-border text-ivory hover:bg-glass'
                    }`}
                  >
                    {plan.cta || 'Get started'}
                  </motion.button>
                </Link>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${
                        isPro ? 'text-gold' : 'text-emerald'
                      }`} />
                      <span className={`text-sm ${isPro ? 'text-ivory' : 'text-platinum'}`}>
                        {feature}
                      </span>
                    </div>
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
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
