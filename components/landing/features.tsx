'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Calendar,
  Bell,
  PieChart,
  Shield,
  Smartphone,
  Zap,
  CreditCard,
  TrendingDown,
  Globe,
} from 'lucide-react'
import { springs, staggerContainer, staggerItem } from '../motion'

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'See every upcoming renewal at a glance. Never be surprised by an unexpected charge again.',
    color: '#C7A36A',
  },
  {
    icon: Bell,
    title: 'Timely Reminders',
    description: 'Custom alerts before each renewal. Cancel or keep, the choice is always yours.',
    color: '#2E5E52',
  },
  {
    icon: PieChart,
    title: 'Spend Analytics',
    description: 'Understand where your money flows with beautiful, insightful breakdowns.',
    color: '#C7A36A',
  },
  {
    icon: TrendingDown,
    title: 'Leak Detection',
    description: 'Our signature Leak Report identifies unused subscriptions and duplicate services.',
    color: '#7A3940',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track which cards and accounts are linked to each subscription.',
    color: '#BCC2CC',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Your financial data is encrypted and protected with enterprise-level security.',
    color: '#2E5E52',
  },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section
      id="features"
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 lg:py-36 scroll-mt-24"
    >
      {/* Refined ambient background - subtle and premium */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle gold orb - top left */}
        <motion.div
          className="absolute -top-[8%] -left-[8%] w-[600px] h-[600px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(176, 132, 64, 0.12) 0%, rgba(176, 132, 64, 0.03) 45%, transparent 70%)',
            filter: 'blur(80px)'
          }}
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.25, 0.4, 0.25]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Subtle emerald orb - bottom right */}
        <motion.div
          className="absolute -bottom-[12%] -right-[8%] w-[500px] h-[500px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(61, 107, 88, 0.10) 0%, rgba(61, 107, 88, 0.03) 45%, transparent 70%)',
            filter: 'blur(90px)'
          }}
          animate={{ 
            scale: [1, 1.12, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        
        {/* Center warmth */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(176, 132, 64, 0.04) 0%, transparent 60%)'
          }}
          animate={{ 
            scale: [1, 1.06, 1],
            opacity: [0.25, 0.4, 0.25]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header - refined premium treatment */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.08 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/8 border border-gold/15 mb-5"
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-gold"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <span className="text-xs text-gold font-medium tracking-wider uppercase">Features</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-[-0.02em] leading-tight">
            Everything you need to
            <br />
            <span className="text-gold-gradient font-serif italic">master your subscriptions</span>
          </h2>
          
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Powerful tools designed to give you complete control over your recurring expenses
          </motion.p>
        </motion.div>

        {/* Premium Features grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              custom={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="group relative"
            >
              <motion.div
                whileHover={{ 
                  y: -6,
                  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
                }}
                whileTap={{ y: -3, scale: 0.99 }}
                className="relative h-full p-6 lg:p-7 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/60 overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:border-gold/20"
              >
                {/* Animated hover glow - pulses subtly */}
                <motion.div
                  className="absolute -inset-4 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={hoveredIndex === index ? { 
                    opacity: [0, 0.6, 0.4],
                    scale: [0.95, 1.02, 1],
                  } : { opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{
                    background: `radial-gradient(ellipse at 30% 20%, ${feature.color}18 0%, transparent 55%)`
                  }}
                />
                
                {/* Top accent line - animated sweep */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ backgroundColor: feature.color }}
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '0%' }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </motion.div>
                
                {/* Icon with animated glow ring */}
                <div className="relative mb-5">
                  {/* Pulsing glow ring on hover */}
                  <motion.div
                    className="absolute -inset-3 rounded-2xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={hoveredIndex === index ? { 
                      opacity: [0, 0.5, 0.3],
                      scale: [0.9, 1.1, 1.05],
                    } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ 
                      background: `radial-gradient(circle, ${feature.color}40 0%, transparent 70%)`,
                      filter: 'blur(8px)'
                    }}
                  />
                  <motion.div 
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${feature.color}12` }}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <motion.div
                      animate={hoveredIndex === index ? { rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                    </motion.div>
                  </motion.div>
                </div>
                
                <motion.h3 
                  className="text-lg font-semibold text-foreground mb-2 transition-colors duration-150"
                  animate={hoveredIndex === index ? { color: feature.color } : {}}
                  transition={{ duration: 0.15 }}
                >
                  {feature.title}
                </motion.h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Subtle shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '200%' }}
                    transition={{ duration: 0.5, ease: 'easeInOut', delay: 0.05 }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Highlight section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.25, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 grid lg:grid-cols-2 gap-8 items-center"
        >
          <div>
            <motion.div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 text-emerald text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.28, duration: 0.25 }}
              whileHover={{ scale: 1.03 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Smartphone className="w-4 h-4" />
              </motion.div>
              Mobile-first design
            </motion.div>
            <motion.h3 
              className="text-2xl md:text-3xl font-semibold text-foreground mb-4"
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              Designed for your thumb.
              <br />
              <span className="text-platinum">Built for your wallet.</span>
            </motion.h3>
            <motion.p 
              className="text-platinum leading-relaxed mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.32, duration: 0.3 }}
            >
              Renewly is crafted as a premium mobile experience first. Every tap, swipe, and gesture
              feels natural and satisfying. Manage your financial life from anywhere.
            </motion.p>
            <div className="grid grid-cols-3 gap-8">
              {[
                { icon: Calendar, label: 'CALENDAR-FIRST', desc: 'Complete control over your renewal timeline' },
                { icon: TrendingDown, label: 'LEAK DETECTION', desc: 'Identify unused subscriptions automatically' },
                { icon: Globe, label: 'MULTI-CURRENCY', desc: 'Track subscriptions in any currency worldwide' },
              ].map((item, i) => (
                <motion.div 
                  key={item.label}
                  className="flex flex-col items-start"
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.35 + i * 0.05, duration: 0.25 }}
                >
                  <motion.div 
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gold/10 text-gold text-xs font-semibold mb-3"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(199, 163, 106, 0.18)' }}
                    transition={{ duration: 0.15 }}
                  >
                    <motion.div
                      whileHover={{ rotate: 15 }}
                      transition={{ duration: 0.15 }}
                    >
                      <item.icon className="w-4 h-4" />
                    </motion.div>
                    {item.label}
                  </motion.div>
                  <p className="text-sm text-platinum">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Feature highlight cards */}
            <div className="space-y-4">
              {[
                { icon: Zap, title: 'Instant Insights', desc: 'Real-time analysis of your spending patterns' },
                { icon: Bell, title: 'Smart Notifications', desc: 'Know exactly when and what to expect' },
                { icon: Shield, title: 'Privacy First', desc: 'Your data never leaves your device' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 dark:bg-slate/30 border border-glass-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-platinum">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
