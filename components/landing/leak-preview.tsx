'use client'

import { motion, useInView, useSpring, useTransform } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown, Sparkles } from 'lucide-react'
import { springs, ProgressRing } from '../motion'
import { getLeakStatusConfig } from '@/lib/leak-status-config'

// Animated number counter component
function AnimatedNumber({ 
  value, 
  prefix = '', 
  suffix = '',
  isInView,
  delay = 0,
  className = ''
}: { 
  value: number
  prefix?: string
  suffix?: string
  isInView: boolean
  delay?: number
  className?: string
}) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const springValue = useSpring(0, { stiffness: 80, damping: 20 })
  const displayValue = useTransform(springValue, (v) => Math.round(v))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      const timeout = setTimeout(() => {
        springValue.set(value)
        setHasAnimated(true)
      }, delay * 1000)
      return () => clearTimeout(timeout)
    }
  }, [isInView, value, delay, springValue, hasAnimated])

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (v) => setDisplay(v))
    return () => unsubscribe()
  }, [displayValue])

  return (
    <span className={className}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </span>
  )
}

export function LeakPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 lg:py-32 px-4 bg-secondary dark:bg-obsidian relative overflow-hidden">
      {/* Animated background glow */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -24, filter: 'blur(4px)' }}
            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.05, duration: 0.25 }}
              whileHover={{ scale: 1.03 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              Signature Feature
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.08, duration: 0.3 }}
            >
              The
              <motion.span 
                className="text-gold-gradient font-serif italic"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.15, duration: 0.3 }}
              > Leak Report</motion.span>
            </motion.h2>
            
            <motion.p 
              className="text-lg text-platinum leading-relaxed mb-8"
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.12, duration: 0.3 }}
            >
              A comprehensive analysis of your subscription portfolio. Discover hidden charges, 
              unused services, and opportunities to reclaim your money with our signature feature.
            </motion.p>

            <div className="space-y-4">
              {[
                { title: 'Leak Score', desc: 'A holistic measure of your subscription health' },
                { title: 'AI Observations', desc: 'Intelligent insights tailored to your spending' },
                { title: 'Savings Potential', desc: 'Clear recommendations to reduce waste' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -12 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 group cursor-pointer"
                >
                  <motion.div 
                    className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center mt-0.5 relative"
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Pulse ring on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gold/30"
                      initial={{ scale: 1, opacity: 0 }}
                      whileHover={{ scale: 1.8, opacity: [0, 0.5, 0] }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-gold"
                      animate={isInView ? { scale: [0, 1.2, 1] } : {}}
                      transition={{ delay: 0.25 + i * 0.06, duration: 0.2 }}
                    />
                  </motion.div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-gold transition-colors duration-150">{item.title}</p>
                    <p className="text-sm text-platinum">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Leak Report Card */}
          <motion.div
            initial={{ opacity: 0, x: 28, filter: 'blur(4px)' }}
            animate={isInView ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
            transition={{ delay: 0.1, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            {/* The Leak Report Card */}
            <motion.div 
              className="relative rounded-3xl bg-gradient-to-br from-card via-secondary to-card dark:from-graphite dark:via-slate dark:to-graphite border border-gold/20 p-6 md:p-8 shadow-luxury overflow-hidden"
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              {/* Animated gold accent line */}
              <motion.div 
                className="absolute top-0 left-0 right-0 h-1 gold-gradient"
                initial={{ scaleX: 0, originX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              />
              
              {/* Header */}
              <motion.div 
                className="flex items-start justify-between mb-8"
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15, duration: 0.25 }}
              >
                <div>
                  <p className="text-sm text-platinum mb-1">Your Leak Report</p>
                  <p className="text-xs text-muted-foreground">March 2026</p>
                </div>
                {(() => {
                  const statusConfig = getLeakStatusConfig(72) // Stable score for preview
                  return (
                    <motion.div 
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} ${statusConfig.glowStrength}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.2, duration: 0.2, type: 'spring', stiffness: 400 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {statusConfig.label}
                    </motion.div>
                  )
                })()}
              </motion.div>

              {/* Score ring */}
              <div className="flex items-center justify-center mb-8">
                <motion.div 
                  className="relative"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ delay: 0.2, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <ProgressRing progress={72} size={160} strokeWidth={10} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedNumber 
                      value={72} 
                      isInView={isInView} 
                      delay={0.3}
                      className="text-4xl font-semibold text-gold"
                    />
                    <motion.span 
                      className="text-sm text-platinum"
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.35, duration: 0.2 }}
                    >
                      Leak Score
                    </motion.span>
                  </div>
                </motion.div>
              </div>

              {/* Metrics grid with staggered entrance */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Monthly Recurring', value: 7644, prefix: '₹', isHighlight: false },
                  { label: 'Yearly Projected', value: 91728, prefix: '₹', isHighlight: false },
                  { label: 'Active Subscriptions', value: 9, prefix: '', isHighlight: false },
                  { label: 'Possible Savings', value: 2398, prefix: '₹', isHighlight: true },
                ].map((metric, i) => (
                  <motion.div 
                    key={metric.label}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      metric.isHighlight 
                        ? 'bg-emerald/10 border-emerald/20 hover:bg-emerald/15 hover:border-emerald/30' 
                        : 'bg-muted dark:bg-obsidian/50 border-glass-border hover:bg-muted/80 hover:border-gold/15'
                    }`}
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ delay: 0.28 + i * 0.04, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -2, scale: 1.02 }}
                  >
                    <p className={`text-xs mb-1 ${metric.isHighlight ? 'text-emerald' : 'text-platinum'}`}>
                      {metric.label}
                    </p>
                    <p className={`text-xl font-semibold ${metric.isHighlight ? 'text-emerald' : 'text-foreground'}`}>
                      <AnimatedNumber 
                        value={metric.value} 
                        prefix={metric.prefix}
                        isInView={isInView} 
                        delay={0.35 + i * 0.04}
                      />
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* AI observation with animated entrance */}
              <motion.div 
                className="p-4 rounded-xl bg-gold/5 border border-gold/20 group hover:bg-gold/8 hover:border-gold/30 transition-all duration-200 cursor-pointer"
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.45, duration: 0.25 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <AlertTriangle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-foreground font-medium mb-1 group-hover:text-gold transition-colors duration-150">AI Insight</p>
                    <p className="text-xs text-platinum">
                      You have 2 music streaming services with overlapping features. 
                      Consider keeping only Spotify to save ₹99/month.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Animated decorative elements */}
              <motion.div 
                className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-gold/10 blur-2xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Floating badge with bounce */}
            <motion.div
              initial={{ opacity: 0, y: 16, rotate: -8, scale: 0.85 }}
              animate={isInView ? { opacity: 1, y: 0, rotate: -5, scale: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
              whileHover={{ scale: 1.08, rotate: -3, y: -2 }}
              className="absolute -top-4 -right-4 px-4 py-2 rounded-xl gold-gradient text-obsidian text-sm font-semibold shadow-luxury cursor-pointer"
            >
              Pro Feature
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
