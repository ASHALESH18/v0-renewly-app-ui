'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { springs, staggerContainer, staggerItem, cinematicFadeInUp, magneticButtonVariants, useMotionPreferences } from '../motion'
import { DemoModal } from '@/components/demo-modal'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'

export function Hero() {
  const ref = useRef(null)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const { prefersReducedMotion } = useMotionPreferences()
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })
  
  // Multi-plane parallax for depth system
  const yFar = useTransform(scrollYProgress, [0, 1], [0, -30])
  const yMid = useTransform(scrollYProgress, [0, 1], [0, -60])
  const yNear = useTransform(scrollYProgress, [0, 1], [0, -100])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Trigger reveal sequence after mount
    const timer = setTimeout(() => setIsLoaded(true), 100)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearTimeout(timer)
    }
  }, [])
  
  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 lg:py-32">
      
      {/* ============================================ */}
      {/* LAYER A: FAR DEPTH PLANE - Matte Black Base */}
      {/* ============================================ */}
      <motion.div 
        className="absolute inset-0 pointer-events-none" 
        aria-hidden="true"
        style={{ y: prefersReducedMotion ? 0 : yFar }}
      >
        {/* Base gradient - obsidian to graphite */}
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-[#0D0D10] to-obsidian" />
        
        {/* Deep volumetric haze - subtle depth atmosphere */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 80% at 50% 40%, rgba(199, 163, 106, 0.03) 0%, transparent 60%)'
          }}
          animate={prefersReducedMotion ? {} : { 
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Subtle grid texture - brushed metal feel */}
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `linear-gradient(rgba(199, 163, 106, 0.4) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(199, 163, 106, 0.4) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }} 
        />
      </motion.div>

      {/* ============================================ */}
      {/* LAYER B: MID DEPTH PLANE - Ghost Glass Panels */}
      {/* ============================================ */}
      {!isMobile && (
        <motion.div 
          className="absolute inset-0 pointer-events-none" 
          aria-hidden="true"
          style={{ y: prefersReducedMotion ? 0 : yMid }}
        >
          {/* Volumetric light field - directional champagne sweep */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(199, 163, 106, 0.04) 30%, transparent 60%)'
            }}
            animate={prefersReducedMotion ? {} : { 
              opacity: [0.3, 0.6, 0.3],
              x: ['-5%', '5%', '-5%'],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Secondary light sweep - cross direction */}
          <motion.div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(-45deg, transparent 40%, rgba(199, 163, 106, 0.025) 50%, transparent 60%)'
            }}
            animate={prefersReducedMotion ? {} : { 
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          />

          {/* Ghost glass panel 1 - premium financial card silhouette */}
          <motion.div 
            className="absolute top-[18%] left-[12%] w-72 h-44 rounded-3xl"
            style={{
              background: 'linear-gradient(145deg, rgba(199, 163, 106, 0.04) 0%, rgba(199, 163, 106, 0.01) 100%)',
              border: '1px solid rgba(199, 163, 106, 0.06)',
              backdropFilter: 'blur(1px)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.02)'
            }}
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={isLoaded ? { 
              opacity: prefersReducedMotion ? 0.08 : [0.06, 0.1, 0.06],
              y: prefersReducedMotion ? 0 : [0, 12, 0],
              rotate: prefersReducedMotion ? -2 : [-2, -1, -2]
            } : {}}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            {/* Card inner structure hint */}
            <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-gold/[0.04]" />
            <div className="absolute top-5 left-16 w-24 h-2 rounded bg-platinum/[0.03]" />
            <div className="absolute top-9 left-16 w-16 h-1.5 rounded bg-platinum/[0.02]" />
            <div className="absolute bottom-4 right-4 w-14 h-5 rounded-lg bg-gold/[0.03]" />
          </motion.div>

          {/* Ghost glass panel 2 - insight card silhouette */}
          <motion.div 
            className="absolute bottom-[22%] right-[10%] w-64 h-40 rounded-3xl"
            style={{
              background: 'linear-gradient(155deg, rgba(229, 228, 226, 0.03) 0%, rgba(229, 228, 226, 0.01) 100%)',
              border: '1px solid rgba(229, 228, 226, 0.05)',
              backdropFilter: 'blur(1px)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.015)'
            }}
            initial={{ opacity: 0, y: -20, rotate: 1.5 }}
            animate={isLoaded ? { 
              opacity: prefersReducedMotion ? 0.06 : [0.05, 0.09, 0.05],
              y: prefersReducedMotion ? 0 : [0, -10, 0],
              rotate: prefersReducedMotion ? 1.5 : [1.5, 2.5, 1.5]
            } : {}}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
          >
            {/* Chart hint */}
            <div className="absolute bottom-6 left-4 right-4 h-12 flex items-end gap-1">
              {[0.4, 0.6, 0.3, 0.8, 0.5, 0.7, 0.9].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-platinum/[0.03]" style={{ height: `${h * 100}%` }} />
              ))}
            </div>
          </motion.div>

          {/* Ghost glass panel 3 - small metric chip */}
          <motion.div 
            className="absolute top-[35%] right-[18%] w-36 h-20 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(199, 163, 106, 0.035) 0%, transparent 100%)',
              border: '1px solid rgba(199, 163, 106, 0.04)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isLoaded ? { 
              opacity: prefersReducedMotion ? 0.05 : [0.04, 0.08, 0.04],
              scale: prefersReducedMotion ? 1 : [1, 1.02, 1],
            } : {}}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          >
            <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-gold/[0.04]" />
            <div className="absolute bottom-3 right-3 w-12 h-3 rounded bg-platinum/[0.03]" />
          </motion.div>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* LAYER C: NEAR DEPTH PLANE - Spotlight & Focus */}
      {/* ============================================ */}
      <motion.div 
        className="absolute inset-0 pointer-events-none" 
        aria-hidden="true"
        style={{ y: prefersReducedMotion ? 0 : yNear }}
      >
        {/* Central spotlight - hero product focus */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.08) 0%, rgba(199, 163, 106, 0.02) 40%, transparent 70%)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isLoaded ? { 
            opacity: prefersReducedMotion ? 0.6 : [0.5, 0.8, 0.5],
            scale: prefersReducedMotion ? 1 : [1, 1.08, 1]
          } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Soft vignette - cinematic framing */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(10, 10, 13, 0.5) 100%)'
          }}
          animate={prefersReducedMotion ? {} : { 
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ============================================ */}
      {/* SIGNATURE RENEWAL INTELLIGENCE PATH */}
      {/* ============================================ */}
      {!isMobile && !prefersReducedMotion && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          aria-hidden="true"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="renewalPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(199, 163, 106, 0)" />
              <stop offset="40%" stopColor="rgba(199, 163, 106, 0.6)" />
              <stop offset="60%" stopColor="rgba(199, 163, 106, 0.6)" />
              <stop offset="100%" stopColor="rgba(199, 163, 106, 0)" />
            </linearGradient>
            <filter id="pathGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Main intelligence path */}
          <motion.path
            d="M -50 55% Q 20% 45%, 35% 52% T 65% 48% Q 80% 42%, 110% 50%"
            stroke="url(#renewalPathGradient)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#pathGlow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              opacity: [0, 0.4, 0.4, 0]
            }}
            transition={{ 
              duration: 6,
              times: [0, 0.4, 0.6, 1],
              repeat: Infinity, 
              repeatDelay: 10,
              ease: 'easeInOut',
              delay: 3
            }}
          />
          
          {/* Activation node 1 - pulses when path reaches */}
          <motion.circle
            cx="35%"
            cy="52%"
            r="4"
            fill="rgba(199, 163, 106, 0.5)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{ 
              duration: 1.2,
              repeat: Infinity, 
              repeatDelay: 15,
              delay: 5.5
            }}
          />
          
          {/* Activation node 2 */}
          <motion.circle
            cx="65%"
            cy="48%"
            r="3"
            fill="rgba(229, 228, 226, 0.4)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.3, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity, 
              repeatDelay: 15,
              delay: 6.8
            }}
          />
        </svg>
      )}

      {/* ============================================ */}
      {/* AMBIENT LIGHT SWEEP - Top Edge */}
      {/* ============================================ */}
      <motion.div 
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent pointer-events-none"
        aria-hidden="true"
        animate={prefersReducedMotion ? {} : { 
          opacity: [0, 0.6, 0],
          scaleX: [0.5, 1, 0.5]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ============================================ */}
      {/* HERO CONTENT - Sequenced Reveal */}
      {/* ============================================ */}
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial="initial"
        animate={isLoaded ? "animate" : "initial"}
      >
        {/* Eyebrow with pulse - reveals first */}
        <motion.div 
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
        >
          <motion.span 
            className="w-2 h-2 rounded-full bg-gold"
            animate={prefersReducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-sm text-gold font-medium">Now available on iOS and Android</span>
        </motion.div>

        {/* Headline with luxury masked reveal - reveals second */}
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-semibold text-ivory tracking-tight leading-[1.1]"
        >
          {/* First line with blur reveal */}
          <span className="block overflow-hidden">
            <motion.span 
              className="block"
              initial={{ opacity: 0, filter: 'blur(16px)', y: 30 }}
              animate={isLoaded ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            >
              Own every
            </motion.span>
          </span>
          
          {/* Emphasis word with gold light sweep */}
          <span className="block overflow-hidden mt-2 relative">
            <motion.span 
              className="block text-gold-gradient font-serif italic relative"
              initial={{ opacity: 0, filter: 'blur(16px)', y: 30 }}
              animate={isLoaded ? { opacity: 1, filter: 'blur(0px)', y: 0 } : {}}
              transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
            >
              renewal.
              
              {/* Gold light sweep across text */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent pointer-events-none"
                initial={{ x: '-100%', opacity: 0 }}
                animate={isLoaded ? { x: '200%', opacity: [0, 1, 0] } : {}}
                transition={{ duration: 1.5, delay: 1.3, ease: 'easeInOut' }}
              />
            </motion.span>
          </span>
        </motion.h1>

        {/* Subheadline - reveals third */}
        <motion.p 
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 0.9, ease: 'easeOut' }}
          className="mt-6 text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with elegance.
        </motion.p>

        {/* CTA buttons - reveal fourth */}
        <motion.div 
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 1.1, ease: 'easeOut' }}
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

        {/* ============================================ */}
        {/* HERO PRODUCT SCENE - Premium Device Reveal */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 100, filter: 'blur(20px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ delay: 1.4, duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 relative"
          style={{ y: prefersReducedMotion ? 0 : yNear }}
        >
          {/* Spotlight halo behind device */}
          <motion.div 
            className="absolute -inset-16 md:-inset-24 rounded-[80px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.12) 0%, rgba(199, 163, 106, 0.04) 40%, transparent 70%)'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isLoaded ? { 
              opacity: prefersReducedMotion ? 0.6 : [0.4, 0.7, 0.4],
              scale: prefersReducedMotion ? 1 : [1, 1.05, 1]
            } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
          />

          {/* Phone mockup frame */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Premium frame with depth */}
            <motion.div 
              className="relative rounded-[40px] bg-gradient-to-br from-graphite to-obsidian border border-gold/20 p-3 shadow-luxury"
              initial={{ boxShadow: '0 0 0px rgba(199, 163, 106, 0)' }}
              animate={isLoaded ? { 
                boxShadow: prefersReducedMotion 
                  ? '0 0 60px rgba(199, 163, 106, 0.1)'
                  : [
                    '0 0 40px rgba(199, 163, 106, 0.08)',
                    '0 0 80px rgba(199, 163, 106, 0.15)',
                    '0 0 40px rgba(199, 163, 106, 0.08)'
                  ]
              } : {}}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
            >
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-obsidian rounded-full" />
              
              {/* Screen */}
              <div className="rounded-[32px] bg-obsidian overflow-hidden aspect-[9/19.5]">
                {/* App preview content */}
                <div className="p-4 pt-10 h-full">
                  {/* Status bar */}
                  <motion.div 
                    className="flex items-center justify-between text-xs text-platinum mb-6"
                    initial={{ opacity: 0 }}
                    animate={isLoaded ? { opacity: 1 } : {}}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 rounded-sm bg-platinum/50" />
                      <div className="w-4 h-2 rounded-sm bg-platinum/50" />
                      <div className="w-6 h-2 rounded-sm bg-platinum/50" />
                    </div>
                  </motion.div>
                  
                  {/* Header */}
                  <motion.div 
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2, duration: 0.6 }}
                  >
                    <div>
                      <p className="text-xs text-platinum">Good morning,</p>
                      <p className="text-sm font-semibold text-ivory">Arjun</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-medium">
                      AM
                    </div>
                  </motion.div>

                  {/* Total spend card - signature reveal anchor */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
                    animate={isLoaded ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
                    transition={{ delay: 2.2, duration: 0.7, ease: 'easeOut' }}
                    className="rounded-2xl bg-gradient-to-br from-slate/50 via-graphite to-slate/50 border border-gold/20 p-4 mb-4 relative overflow-hidden"
                  >
                    {/* Subtle shine effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                      animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
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
                        animate={isLoaded ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
                        transition={{ 
                          delay: 2.5 + i * 0.15, 
                          duration: 0.5,
                          ease: 'easeOut'
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate/50 border border-glass-border/50 relative overflow-hidden"
                      >
                        {/* Card shimmer */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent pointer-events-none"
                          animate={prefersReducedMotion ? {} : { x: ['-100%', '100%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 3.5 + i * 0.3 }}
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

            {/* Animated glow ring - signature moment */}
            <motion.div 
              className="absolute -inset-4 rounded-[48px] -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.15) 0%, transparent 70%)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isLoaded ? { 
                opacity: prefersReducedMotion ? 0.5 : [0.3, 0.6, 0.3],
                scale: prefersReducedMotion ? 1 : [1, 1.06, 1]
              } : {}}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>

          {/* Gold trace line - signature element resolves last */}
          <motion.div 
            className="absolute top-20 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gold/50 via-gold/30 to-transparent rounded-full pointer-events-none"
            initial={{ height: 0, opacity: 0 }}
            animate={isLoaded && !prefersReducedMotion ? { 
              height: [0, 80, 0],
              opacity: [0, 0.8, 0]
            } : {}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </motion.div>
      </motion.div>

      {/* Demo Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        videoUrl=""
        title="Renewly Demo"
        subtitle="A quick look at how Renewly helps you own every renewal."
      />
    </section>
  )
}
