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
  ArrowRight
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 lg:py-40 scroll-mt-24"
    >
      {/* DRAMATIC: Full cinematic ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* DRAMATIC: Large animated gold orb - top left */}
        <motion.div
          className="absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(199, 163, 106, 0.2) 0%, rgba(199, 163, 106, 0.05) 40%, transparent 70%)',
            filter: 'blur(100px)'
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 80, 0],
            y: [0, 40, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* DRAMATIC: Emerald orb - bottom right */}
        <motion.div
          className="absolute -bottom-[15%] -right-[10%] w-[700px] h-[700px] rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(46, 94, 82, 0.18) 0%, rgba(46, 94, 82, 0.05) 45%, transparent 70%)',
            filter: 'blur(120px)'
          }}
          animate={{ 
            scale: [1, 1.25, 1],
            x: [0, -40, 0],
            y: [0, -60, 0],
            opacity: [0.25, 0.5, 0.25]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        
        {/* DRAMATIC: Center spotlight */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px]"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.08) 0%, transparent 60%)'
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* DRAMATIC: Light sweep */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(115deg, transparent 0%, rgba(199, 163, 106, 0.05) 25%, rgba(199, 163, 106, 0.1) 50%, rgba(199, 163, 106, 0.05) 75%, transparent 100%)',
            transform: 'skewX(-15deg)'
          }}
          animate={{ x: ['-150%', '150%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 8 }}
        />
        
        {/* Grid pattern - more visible */}
        <div 
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(199, 163, 106, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(199, 163, 106, 0.6) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header with premium treatment */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6"
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-gold"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gold font-medium tracking-wide uppercase">Features</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-tight">
            Everything you need to
            <br />
            <span className="text-gold-gradient font-serif italic">master your subscriptions</span>
          </h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="mt-6 text-lg text-platinum max-w-2xl mx-auto"
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
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative"
            >
              <motion.div
                whileHover={{ 
                  y: -10,
                  boxShadow: `0 32px 64px -16px ${feature.color}30, 0 0 0 1px ${feature.color}20`
                }}
                transition={{ duration: 0.4 }}
                className="relative h-full p-7 lg:p-9 rounded-3xl bg-card/80 backdrop-blur-2xl border border-glass-border overflow-hidden shadow-card"
              >
                {/* DRAMATIC: Multi-layer hover glow effect */}
                <motion.div
                  className="absolute -inset-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `radial-gradient(circle at top left, ${feature.color}25 0%, transparent 50%)`
                  }}
                />
                <motion.div
                  className="absolute -inset-4 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-700"
                  style={{
                    background: `radial-gradient(circle at bottom right, ${feature.color}15 0%, transparent 50%)`
                  }}
                />
                
                {/* DRAMATIC: Top accent line - thicker */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: feature.color }}
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* DRAMATIC: Icon with multi-layer glow */}
                <div className="relative mb-6">
                  <motion.div
                    className="absolute -inset-3 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500"
                    style={{ backgroundColor: `${feature.color}50` }}
                  />
                  <motion.div
                    className="absolute -inset-1 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                    style={{ backgroundColor: `${feature.color}40` }}
                  />
                  <div 
                    className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${feature.color}18` }}
                  >
                    <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-platinum text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Learn more link */}
                <motion.div
                  className="flex items-center gap-2 text-sm font-medium text-gold opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ x: -10 }}
                  whileHover={{ x: 0 }}
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Highlight section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, ...springs.gentle }}
          className="mt-20 grid lg:grid-cols-2 gap-8 items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 text-emerald text-sm font-medium mb-4">
              <Smartphone className="w-4 h-4" />
              Mobile-first design
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Designed for your thumb.
              <br />
              <span className="text-platinum">Built for your wallet.</span>
            </h3>
            <p className="text-platinum leading-relaxed mb-6">
              Renewly is crafted as a premium mobile experience first. Every tap, swipe, and gesture
              feels natural and satisfying. Manage your financial life from anywhere.
            </p>
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gold/10 text-gold text-xs font-semibold mb-3">
                  <Calendar className="w-4 h-4" />
                  CALENDAR-FIRST
                </div>
                <p className="text-sm text-platinum">Complete control over your renewal timeline</p>
              </div>
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gold/10 text-gold text-xs font-semibold mb-3">
                  <TrendingDown className="w-4 h-4" />
                  LEAK DETECTION
                </div>
                <p className="text-sm text-platinum">Identify unused subscriptions automatically</p>
              </div>
              <div className="flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gold/10 text-gold text-xs font-semibold mb-3">
                  <Globe className="w-4 h-4" />
                  MULTI-CURRENCY
                </div>
                <p className="text-sm text-platinum">Track subscriptions in any currency worldwide</p>
              </div>
            </div>
          </div>

          <div className="relative">
            {/* Feature highlight cards */}
            <div className="space-y-4">
              {[
                { icon: Zap, title: 'Instant Insights', desc: 'Real-time analysis of your spending patterns' },
                { icon: Bell, title: 'Smart Notifications', desc: 'Know exactly when and what to expect' },
                { icon: Shield, title: 'Privacy First', desc: 'Your data never leaves your device' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.1, ...springs.gentle }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 dark:bg-slate/30 border border-glass-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-platinum">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
