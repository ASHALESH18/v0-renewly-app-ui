'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { springs, staggerContainer, staggerItem } from '../motion'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-graphite to-obsidian" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(199, 163, 106, 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(199, 163, 106, 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-3xl" />

      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        {/* Eyebrow */}
        <motion.div 
          variants={staggerItem}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-sm text-gold font-medium">Now available on iOS and Android</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          variants={staggerItem}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold text-ivory tracking-tight leading-[1.1]"
        >
          <span className="block">Own every</span>
          <span className="block text-gold-gradient font-serif italic">renewal.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          variants={staggerItem}
          className="mt-6 text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with elegance.
        </motion.p>

        {/* CTA buttons */}
        <motion.div 
          variants={staggerItem}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/app">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full sm:w-auto px-8 py-4 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury flex items-center justify-center gap-2"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-glass-border text-ivory font-medium flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Watch demo
          </motion.button>
        </motion.div>

        {/* App preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, ...springs.gentle }}
          className="mt-16 relative"
        >
          {/* Phone mockup frame */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Phone frame */}
            <div className="relative rounded-[40px] bg-graphite border border-glass-border p-3 shadow-luxury">
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-obsidian rounded-full" />
              
              {/* Screen */}
              <div className="rounded-[32px] bg-obsidian overflow-hidden aspect-[9/19.5]">
                {/* App preview content */}
                <div className="p-4 pt-10 h-full">
                  {/* Status bar placeholder */}
                  <div className="flex items-center justify-between text-xs text-platinum mb-6">
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 rounded-sm bg-platinum/50" />
                      <div className="w-4 h-2 rounded-sm bg-platinum/50" />
                      <div className="w-6 h-2 rounded-sm bg-platinum/50" />
                    </div>
                  </div>
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-platinum">Good morning,</p>
                      <p className="text-sm font-semibold text-ivory">Arjun</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-medium">
                      AM
                    </div>
                  </div>

                  {/* Total spend card */}
                  <div className="rounded-2xl bg-graphite border border-glass-border p-4 mb-4">
                    <p className="text-xs text-platinum mb-1">Monthly recurring</p>
                    <p className="text-2xl font-semibold text-gold">₹7,644</p>
                    <p className="text-xs text-emerald mt-1">↓ 12% vs last month</p>
                  </div>

                  {/* Subscription cards preview */}
                  <div className="space-y-3">
                    {[
                      { name: 'Netflix', color: '#E50914', amount: '649' },
                      { name: 'Spotify', color: '#1DB954', amount: '119' },
                      { name: 'ChatGPT', color: '#10A37F', amount: '1,680' },
                    ].map((sub, i) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate/50"
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-ivory">{sub.name}</p>
                          <p className="text-[10px] text-platinum">Renews in 5d</p>
                        </div>
                        <p className="text-xs font-medium text-ivory">₹{sub.amount}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 rounded-[48px] bg-gold/10 blur-2xl -z-10" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
