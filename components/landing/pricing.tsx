'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { springs, staggerContainer, staggerItem, premiumCardHover, badgeEntrance } from '../motion'
import { getAllPlans } from '@/lib/plans'
import Link from 'next/link'

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const plans = getAllPlans()

  return (
    <section ref={ref} className="py-24 lg:py-32 px-4 bg-graphite relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-96 h-96 bg-emerald/5 rounded-full blur-3xl"
        animate={{ 
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
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
                    ? 'bg-gradient-to-br from-slate via-graphite to-slate border border-gold/30 overflow-hidden'
                    : isFamily
                    ? 'bg-gradient-to-br from-slate/80 via-graphite/80 to-slate/80 border border-gold/40 overflow-hidden'
                    : 'bg-slate/50 border border-glass-border'
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
                        className={`text-4xl font-semibold ${isPro || isFamily ? 'text-ivory' : 'text-ivory'}`}
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
                
                <p className={`text-sm mb-6 ${isPro || isFamily ? 'text-ivory' : 'text-platinum'}`}>
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

                <Link href={plan.ctaHref || '/auth/sign-up'}>
                  <motion.button
                    whileHover={{ 
                      scale: 1.03,
                      boxShadow: isPro || isFamily ? '0 16px 32px rgba(199, 163, 106, 0.2)' : undefined
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-3 rounded-xl font-medium mb-8 transition-colors ${
                      isPro
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : isFamily
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : isFree
                        ? 'border border-glass-border text-ivory hover:bg-glass'
                        : plan.id === 'enterprise'
                        ? 'gold-gradient text-obsidian font-semibold shadow-luxury'
                        : 'border border-glass-border text-ivory hover:bg-glass'
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
                        isPro || isFamily ? 'text-gold' : 'text-emerald'
                      }`} />
                      <span className={`text-sm ${isPro || isFamily ? 'text-ivory' : 'text-platinum'}`}>
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
