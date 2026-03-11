'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { AlertTriangle, TrendingDown, Sparkles } from 'lucide-react'
import { springs, ProgressRing } from '../motion'

export function LeakPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 lg:py-32 px-4 bg-obsidian relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={springs.gentle}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Signature Feature
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-ivory tracking-tight mb-6">
              The
              <span className="text-gold-gradient font-serif italic"> Leak Report</span>
            </h2>
            
            <p className="text-lg text-platinum leading-relaxed mb-8">
              A comprehensive analysis of your subscription portfolio. Discover hidden charges, 
              unused services, and opportunities to reclaim your money with our signature feature.
            </p>

            <div className="space-y-4">
              {[
                { title: 'Leak Score', desc: 'A holistic measure of your subscription health' },
                { title: 'AI Observations', desc: 'Intelligent insights tailored to your spending' },
                { title: 'Savings Potential', desc: 'Clear recommendations to reduce waste' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, ...springs.gentle }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-ivory">{item.title}</p>
                    <p className="text-sm text-platinum">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Leak Report Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, ...springs.gentle }}
            className="relative"
          >
            {/* The Leak Report Card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-graphite via-slate to-graphite border border-gold/20 p-6 md:p-8 shadow-luxury overflow-hidden">
              {/* Gold accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 gold-gradient" />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-sm text-platinum mb-1">Your Leak Report</p>
                  <p className="text-xs text-muted-foreground">March 2026</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald/20 text-emerald text-xs font-medium">
                  Healthy
                </div>
              </div>

              {/* Score ring */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <ProgressRing progress={72} size={160} strokeWidth={10} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span 
                      className="text-4xl font-semibold text-gold"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.5, ...springs.bouncy }}
                    >
                      72
                    </motion.span>
                    <span className="text-sm text-platinum">Leak Score</span>
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-obsidian/50 border border-glass-border">
                  <p className="text-xs text-platinum mb-1">Monthly Recurring</p>
                  <p className="text-xl font-semibold text-ivory">₹7,644</p>
                </div>
                <div className="p-4 rounded-xl bg-obsidian/50 border border-glass-border">
                  <p className="text-xs text-platinum mb-1">Yearly Projected</p>
                  <p className="text-xl font-semibold text-ivory">₹91,728</p>
                </div>
                <div className="p-4 rounded-xl bg-obsidian/50 border border-glass-border">
                  <p className="text-xs text-platinum mb-1">Active Subscriptions</p>
                  <p className="text-xl font-semibold text-ivory">9</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/20">
                  <p className="text-xs text-emerald mb-1">Possible Savings</p>
                  <p className="text-xl font-semibold text-emerald">₹2,398</p>
                </div>
              </div>

              {/* AI observation */}
              <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-ivory font-medium mb-1">AI Insight</p>
                    <p className="text-xs text-platinum">
                      You have 2 music streaming services with overlapping features. 
                      Consider keeping only Spotify to save ₹99/month.
                    </p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-2xl" />
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -5 }}
              animate={isInView ? { opacity: 1, y: 0, rotate: -5 } : {}}
              transition={{ delay: 0.6, ...springs.bouncy }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-xl gold-gradient text-obsidian text-sm font-semibold shadow-luxury"
            >
              Pro Feature
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
