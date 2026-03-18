'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Check, X, Sparkles } from 'lucide-react'
import { springs, staggerContainer, staggerItem } from '../motion'
import { pricingPlans } from '@/lib/data'
import Link from 'next/link'

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

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
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {/* Free plan */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl bg-slate/50 border border-glass-border p-6 md:p-8"
          >
            <p className="text-sm text-platinum mb-2">Free</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-semibold text-ivory">₹0</span>
              <span className="text-platinum">/forever</span>
            </div>
            
            <p className="text-sm text-platinum mb-6">
              Perfect for getting started with subscription tracking.
            </p>

            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border border-glass-border text-ivory font-medium hover:bg-glass transition-colors mb-8"
              >
                Get started
              </motion.button>
            </Link>

            <div className="space-y-4">
              {pricingPlans[0].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
                  <span className="text-sm text-platinum">{feature}</span>
                </div>
              ))}
              {pricingPlans[0].limitations?.map((limitation) => (
                <div key={limitation} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{limitation}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            variants={staggerItem}
            className="relative rounded-2xl bg-gradient-to-br from-slate via-graphite to-slate border border-gold/30 p-6 md:p-8 overflow-hidden"
          >
            {/* Gold accent */}
            <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
            
            {/* Popular badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Most Popular
            </div>

            <p className="text-sm text-gold mb-2">Pro</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-semibold text-ivory">₹299</span>
              <span className="text-platinum">/month</span>
            </div>
            <p className="text-xs text-platinum mb-6">
              or ₹2,499/year (save 30%)
            </p>
            
            <p className="text-sm text-platinum mb-6">
              For those serious about mastering their finances.
            </p>

            <Link href="/app">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury mb-8"
              >
                Start 14-day trial
              </motion.button>
            </Link>

            <div className="space-y-4">
              {pricingPlans[1].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span className="text-sm text-ivory">{feature}</span>
                </div>
              ))}
            </div>

            {/* Decorative glow */}
            <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
          </motion.div>
        </motion.div>

          {/* Enterprise plan */}
          <motion.div
            variants={staggerItem}
            className="rounded-2xl bg-slate/50 border border-glass-border p-6 md:p-8 flex flex-col"
          >
            <p className="text-sm text-platinum mb-2">Enterprise</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-semibold text-ivory">Custom</span>
            </div>
            <p className="text-xs text-platinum mb-6">
              Pricing based on your team size
            </p>
            
            <p className="text-sm text-platinum mb-6">
              For teams and organizations that need advanced collaboration and security.
            </p>

            <Link href="/contact-sales">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border border-gold/50 text-gold font-medium hover:bg-gold/10 transition-colors mb-2"
              >
                Contact Sales
              </motion.button>
            </Link>

            <Link href="/request-demo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border border-glass-border text-platinum font-medium hover:bg-glass transition-colors mb-8"
              >
                Request Demo
              </motion.button>
            </Link>

            <div className="space-y-4">
              {pricingPlans[2].features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <span className="text-sm text-platinum">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
      </div>
    </section>
  )
}
