'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { 
  Calendar, 
  Bell, 
  PieChart, 
  Shield, 
  Smartphone, 
  Zap,
  CreditCard,
  TrendingDown,
  Globe
} from 'lucide-react'
import { springs, staggerContainer, staggerItem } from '../motion'

const features = [
  {
    icon: Calendar,
    title: 'Smart Calendar',
    description: 'See every upcoming renewal at a glance. Never be surprised by an unexpected charge again.',
  },
  {
    icon: Bell,
    title: 'Timely Reminders',
    description: 'Custom alerts before each renewal. Cancel or keep, the choice is always yours.',
  },
  {
    icon: PieChart,
    title: 'Spend Analytics',
    description: 'Understand where your money flows with beautiful, insightful breakdowns.',
  },
  {
    icon: TrendingDown,
    title: 'Leak Detection',
    description: 'Our signature Leak Report identifies unused subscriptions and duplicate services.',
  },
  {
    icon: CreditCard,
    title: 'Payment Tracking',
    description: 'Track which cards and accounts are linked to each subscription.',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'Your financial data is encrypted and protected with enterprise-level security.',
  },
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 lg:py-32 px-4 bg-graphite relative overflow-hidden scroll-mt-24">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald/5 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={springs.gentle}
          className="text-center mb-16"
        >
          <p className="text-gold text-sm font-medium tracking-wide uppercase mb-4">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold text-ivory tracking-tight">
            Everything you need to
            <br />
            <span className="text-gold-gradient">master your subscriptions</span>
          </h2>
        </motion.div>

        {/* Features grid */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? 'animate' : 'initial'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={staggerItem}
              custom={index}
              whileHover={{ y: -4, transition: springs.gentle }}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group p-6 rounded-2xl bg-slate/50 border border-glass-border hover:border-gold/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                <feature.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-ivory mb-2">
                {feature.title}
              </h3>
              <p className="text-platinum text-sm leading-relaxed">
                {feature.description}
              </p>
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
            <h3 className="text-2xl md:text-3xl font-semibold text-ivory mb-4">
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
                  className="flex items-start gap-4 p-4 rounded-xl bg-slate/30 border border-glass-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-medium text-ivory">{item.title}</p>
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
