'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { springs, staggerContainer, staggerItem, cinematicFadeInUp, magneticButtonVariants, useMotionPreferences } from '../motion'
import { DemoModal } from '@/components/demo-modal'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'

export function Hero() {
  const ref = useRef(null)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { prefersReducedMotion } = useMotionPreferences()
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })
  
  // Subtle parallax effect
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 lg:py-32">
      {/* Premium background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-graphite to-obsidian" />
      
      {/* Animated radial glow - breathing */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-3xl"
        animate={{ 
          opacity: prefersReducedMotion ? [0.3] : [0.3, 0.5, 0.3],
          scale: prefersReducedMotion ? [1] : [1, 1.15, 1]
        }}
        transition={{ duration: 10, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'easeInOut' }}
      />

      {/* Ambient gold sheen - slow diagonal sweep (desktop only) */}
      {!isMobile && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-transparent via-gold/[0.08] to-transparent opacity-0"
          animate={{ 
            opacity: prefersReducedMotion ? [0] : [0, 0.15, 0],
            x: prefersReducedMotion ? ['0%'] : ['-100%', '100%'],
          }}
          transition={{ duration: 14, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'linear' }}
        />
      )}

      {/* Moving light sweep for cinematic feel */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        animate={{ 
          x: prefersReducedMotion ? ['0%'] : ['0%', '100%', '-100%'],
          opacity: prefersReducedMotion ? [0] : [0, 0.5, 0]
        }}
        transition={{ duration: 12, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'linear' }}
      />

      {/* Ghosted subscription card silhouettes (desktop only) */}
      {!isMobile && (
        <>
          <motion.div 
            className="absolute top-1/4 left-1/3 w-64 h-40 rounded-2xl bg-gold/5 backdrop-blur-sm border border-gold/10 opacity-20"
            animate={{ 
              y: prefersReducedMotion ? [0] : [0, 20, 0],
              opacity: prefersReducedMotion ? [0.08] : [0.08, 0.15, 0.08]
            }}
            transition={{ duration: 16, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'easeInOut' }}
          />

          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-56 h-36 rounded-2xl bg-platinum/5 backdrop-blur-sm border border-platinum/10 opacity-20"
            animate={{ 
              y: prefersReducedMotion ? [0] : [0, -15, 0],
              opacity: prefersReducedMotion ? [0.06] : [0.06, 0.12, 0.06]
            }}
            transition={{ duration: 18, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </>
      )}

      {/* Renewal pulse line - occasional elegant trace (desktop only) */}
      {!isMobile && !prefersReducedMotion && (
        <motion.svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.8, delay: 8, repeat: Infinity, repeatDelay: 12 }}
        >
          <motion.path
            d="M 0 60% Q 25% 40%, 50% 50% T 100% 60%"
            stroke="url(#pulseGradient)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(199, 163, 106, 0)" />
              <stop offset="50%" stopColor="rgba(199, 163, 106, 0.8)" />
              <stop offset="100%" stopColor="rgba(199, 163, 106, 0)" />
            </linearGradient>
          </defs>
        </motion.svg>
      )}

      {/* Soft vignette breathing effect */}
      <motion.div 
        className="absolute inset-0 bg-radial-gradient pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 13, 0.4) 100%)'
        }}
        animate={{ opacity: prefersReducedMotion ? [0.3] : [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: prefersReducedMotion ? 0 : Infinity, ease: 'easeInOut' }}
      />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(rgba(199, 163, 106, 0.3) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(199, 163, 106, 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="relative z-10 max-w-4xl mx-auto text-center"
      >
        {/* Eyebrow with pulse */}
        <motion.div 
          variants={staggerItem}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
        >
          <motion.span 
            className="w-2 h-2 rounded-full bg-gold"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-sm text-gold font-medium">Now available on iOS and Android</span>
        </motion.div>

        {/* Headline with luxury masked reveal */}
        <motion.h1 
          variants={staggerItem}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold text-ivory tracking-tight leading-[1.1]"
        >
          {/* First line with blur reveal */}
          <span className="block overflow-hidden">
            <motion.span 
              className="block"
              initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            >
              Own every
            </motion.span>
          </span>
          
          {/* Emphasis word with gold light sweep */}
          <span className="block overflow-hidden mt-2 relative">
            <motion.span 
              className="block text-gold-gradient font-serif italic relative"
              initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            >
              renewal.
              
              {/* Gold light sweep across text */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.5, delay: 0.7, ease: 'easeInOut' }}
              />
            </motion.span>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          variants={staggerItem}
          className="mt-6 text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with elegance.
        </motion.p>

        {/* CTA buttons with magnetic hover */}
        <motion.div 
          variants={staggerItem}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/sign-in?next=/app/dashboard">
            <motion.button
              variants={magneticButtonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="w-full sm:w-auto px-8 py-4 rounded-xl gold-gradient text-obsidian font-semibold shadow-luxury flex items-center justify-center gap-2"
            >
              Start for free
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={springs.gentle}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          </Link>
          
          <motion.button
            onClick={() => setIsDemoOpen(true)}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-glass-border text-ivory font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            Watch demo
          </motion.button>
        </motion.div>

        {/* Premium device reveal with signature animation */}
        <motion.div
          initial={{ opacity: 0, y: 80, filter: 'blur(16px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
          className="mt-20 relative"
          style={{ y }}
        >
          {/* Soft glow backdrop layer */}
          <motion.div 
            className="absolute -inset-20 rounded-[60px] bg-gradient-to-b from-gold/10 to-transparent blur-3xl"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Phone mockup frame */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Premium frame with depth */}
            <motion.div 
              className="relative rounded-[40px] bg-gradient-to-br from-graphite to-obsidian border border-gold/20 p-3 shadow-luxury"
              animate={{ 
                boxShadow: [
                  '0 0 60px rgba(199, 163, 106, 0.1)',
                  '0 0 80px rgba(199, 163, 106, 0.15)',
                  '0 0 60px rgba(199, 163, 106, 0.1)'
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
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

                  {/* Total spend card - signature reveal anchor */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.88, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ delay: 0.9, duration: 0.6, ease: 'easeOut' }}
                    className="rounded-2xl bg-gradient-to-br from-slate/50 via-graphite to-slate/50 border border-gold/20 p-4 mb-4 relative overflow-hidden"
                  >
                    {/* Subtle shine effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <p className="text-xs text-platinum mb-1 relative">Monthly recurring</p>
                    <p className="text-2xl font-semibold text-gold relative">₹7,644</p>
                    <p className="text-xs text-emerald mt-1 relative">↓ 12% vs last month</p>
                  </motion.div>

                  {/* Subscription cards - cascade reveal */}
                  <div className="space-y-3">
                    {[
                      { name: 'Netflix', color: '#E50914', amount: '649' },
                      { name: 'Spotify', color: '#1DB954', amount: '119' },
                      { name: 'ChatGPT', color: '#10A37F', amount: '1,680' },
                    ].map((sub, i) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, x: -30, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        transition={{ 
                          delay: 1.1 + i * 0.15, 
                          duration: 0.5,
                          ease: 'easeOut'
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate/50 border border-glass-border/50 relative overflow-hidden"
                      >
                        {/* Card shimmer */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                        />
                        
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium shrink-0 relative"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name[0]}
                        </div>
                        <div className="flex-1 relative">
                          <p className="text-xs font-medium text-ivory">{sub.name}</p>
                          <p className="text-[10px] text-platinum">Renews in 5d</p>
                        </div>
                        <p className="text-xs font-medium text-ivory relative">₹{sub.amount}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Animated glow effect - signature moment */}
            <motion.div 
              className="absolute -inset-4 rounded-[48px] bg-gold/10 blur-3xl -z-10"
              animate={{ 
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.08, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Gold trace line animation - signature element */}
          <motion.div 
            className="absolute top-24 left-1/2 -translate-x-1/2 w-1 h-24 bg-gradient-to-b from-gold/40 via-gold/20 to-transparent rounded-full"
            animate={{ 
              height: [0, 96, 0],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </motion.div>
      </motion.div>

      {/* Demo Modal - lazy rendered */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        videoUrl="" // Configure with actual YouTube URL: "https://www.youtube.com/embed/VIDEO_ID"
        title="Renewly Demo"
        subtitle="A quick look at how Renewly helps you own every renewal."
      />
    </section>
  )
}
