'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { magneticButtonVariants, useMotionPreferences } from '../motion'
import { DemoModal } from '@/components/demo-modal'
import { useRef, useState, useEffect } from 'react'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getStartedDestination } from '@/lib/upgrade-flow'

export function Hero() {
  const ref = useRef(null)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true
  const { prefersReducedMotion, isMobile, shouldReduceAnimations } = useMotionPreferences()

  // Smart CTA handler - consistent with pricing/upgrade flow
  const handleGetStarted = () => {
    setIsNavigating(true)
    const destination = getStartedDestination(isAuthenticated)
    router.push(destination)
  }

  // Scroll-linked parallax - disabled on mobile for 60fps performance
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const yNear = useTransform(scrollYProgress, [0, 1], shouldReduceAnimations ? [0, 0] : [0, -25])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-24 lg:py-36"
    >
      {/* ============================================ */}
      {/* HERO AMBIENT ENHANCEMENT */}
      {/* Blends with global AmbientBackground */}
      {/* ============================================ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Central focus glow - static for performance */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] md:w-[800px] md:h-[500px] opacity-35"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(176, 132, 64, 0.05) 0%, rgba(176, 132, 64, 0.015) 45%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Soft vignette - cinematic framing */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 0%, var(--hero-vignette) 100%)',
          }}
        />
      </div>

      {/* ============================================ */}
      {/* HERO CONTENT - Instant Render */}
      {/* ============================================ */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Premium eyebrow badge - no blur for performance */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8"
        >
          <div className="absolute inset-0 rounded-full border border-gold/15 bg-card/60 backdrop-blur-sm" />

          <div className="relative flex items-center gap-2.5">
            {/* Static gold dot - no pulse animation */}
            <div className="w-2 h-2 rounded-full bg-gold" />
            <span className="text-sm text-foreground/90 font-medium tracking-wide">
              Now available on iOS and Android
            </span>
          </div>
        </motion.div>

        {/* Cinematic headline - optimized for instant render */}
        <motion.h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold text-foreground tracking-[-0.02em] leading-[1.08]">
          {/* First line - smooth entrance, no blur */}
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Own every
            </motion.span>
          </span>

          {/* Emphasis word with subtle glow */}
          <span className="block overflow-hidden mt-2 relative">
            <motion.span
              className="relative inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* Subtle glow behind text - static, no animation */}
              <span className="absolute inset-0 text-gold blur-xl opacity-30 pointer-events-none">
                renewal.
              </span>

              {/* Main text with gradient */}
              <span className="relative text-gold-gradient font-serif italic">
                renewal.
              </span>

              {/* Light sweep - only on desktop, single run */}
              {!shouldReduceAnimations && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: '250%', opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                />
              )}
            </motion.span>
          </span>
        </motion.h1>

        {/* Subheadline - fast reveal, no blur */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-5 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with elegance.
        </motion.p>

        {/* Premium CTA buttons - instant render */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary CTA with subtle glow */}
          <motion.button
            onClick={handleGetStarted}
            disabled={isNavigating}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover={shouldReduceAnimations ? undefined : "hover"}
            whileTap={shouldReduceAnimations ? undefined : "tap"}
            className="relative w-full sm:w-auto group cursor-pointer disabled:opacity-70"
          >
            {/* Subtle glow behind button - static on mobile */}
            <div className="absolute inset-0 rounded-xl bg-gold/10 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />

            <div className="relative px-8 py-4 rounded-xl gold-gradient text-obsidian font-semibold text-base shadow-luxury flex items-center justify-center gap-2.5">
              {isNavigating ? 'Loading...' : 'Start for free'}
              {!isNavigating && (
                <motion.div initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              )}
            </div>
          </motion.button>

          {/* Secondary CTA with glass effect */}
          <motion.button
            onClick={() => setIsDemoOpen(true)}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover={shouldReduceAnimations ? undefined : "hover"}
            whileTap={shouldReduceAnimations ? undefined : "tap"}
            className="relative w-full sm:w-auto px-8 py-4 rounded-xl bg-card/40 backdrop-blur-xl border border-gold/15 text-foreground font-medium text-base flex items-center justify-center gap-2.5 cursor-pointer hover:border-gold/30 hover:bg-card/60 transition-all group"
          >
            <Play className="w-4 h-4 text-gold" />
            Watch demo
          </motion.button>
        </motion.div>

        {/* ============================================ */}
        {/* HERO PRODUCT SCENE - Premium Device Reveal */}
        {/* ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 relative"
          style={{ y: yNear }}
        >
          {/* Spotlight halo behind device - static for performance */}
          <div
            className="absolute -inset-16 md:-inset-24 rounded-[80px] opacity-50"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.12) 0%, rgba(199, 163, 106, 0.04) 40%, transparent 70%)',
            }}
          />

          {/* Phone mockup frame - theme-aware */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Premium device frame - adapts to theme with rich shading */}
            <div
              className={`relative rounded-[40px] p-3 transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-[#1A1D24] via-[#0F1115] to-[#0A0C10] border border-[#2A2F38]'
                : 'bg-gradient-to-b from-[#E8E4DE] via-[#D8D4CE] to-[#C8C4BE] border border-[#B8B4AE]'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 25px 60px -12px rgba(0, 0, 0, 0.35), 0 12px 24px -8px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 80px rgba(199, 163, 106, 0.08)'
                  : '0 30px 60px -15px rgba(120, 100, 70, 0.25), 0 15px 30px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6) inset, inset 0 -2px 6px rgba(0, 0, 0, 0.06), 0 0 80px rgba(154, 112, 53, 0.1)',
              }}
            >
              {/* Notch - dynamic island style */}
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full ${isDark ? 'bg-[#000000]' : 'bg-[#1A1A1A]'
                  }`}
              />

              {/* Screen - theme-aware app interface with premium depth */}
              <div
                className={`rounded-[32px] overflow-hidden aspect-[9/19.5] transition-colors duration-300 ${isDark
                  ? 'bg-[#0A0C10] border border-[#1A1D24]'
                  : 'bg-gradient-to-b from-[#FAF8F5] via-[#F5F3F0] to-[#F0EDE8] border border-[#DDD8D0]'
                  }`}
                style={{
                  boxShadow: isDark
                    ? 'none'
                    : 'inset 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.02)',
                }}
              >
                {/* App preview content */}
                <div className="p-4 pt-10 h-full">
                  {/* Status bar - instant render */}
                  <motion.div
                    className={`flex items-center justify-between text-xs mb-6 ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'
                      }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div
                        className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`}
                      />
                      <div
                        className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`}
                      />
                      <div
                        className={`w-6 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`}
                      />
                    </div>
                  </motion.div>

                  {/* Header */}
                  <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <div>
                      <p className={`text-xs ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'}`}>
                        Good morning,
                      </p>
                      <p
                        className={`text-sm font-semibold ${isDark ? 'text-[#F4EFE7]' : 'text-[#1A1510]'}`}
                      >
                        Arjun
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-medium">
                      AM
                    </div>
                  </motion.div>

                  {/* Total spend card - fast reveal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`rounded-2xl p-4 mb-4 relative overflow-hidden transition-colors duration-300 ${isDark
                      ? 'bg-gradient-to-br from-[#1B2028] via-[#13161C] to-[#1B2028] border border-[#C7A36A]/25'
                      : 'bg-gradient-to-br from-[#FFFDF9] via-[#FBF8F3] to-[#F8F5EF] border border-[#9A7035]/20'
                      }`}
                    style={{
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.2)'
                        : '0 6px 20px -4px rgba(120, 90, 50, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    }}
                  >

                    <p className={`text-xs mb-1 relative ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                      Monthly recurring
                    </p>
                    <p className={`text-2xl font-bold relative ${isDark ? 'text-[#C7A36A]' : 'text-[#9A7035]'}`}>
                      ₹7,644
                    </p>
                    <p className="text-xs text-[#34D399] mt-1 relative font-medium">
                      ↓ 12% vs last month
                    </p>
                  </motion.div>

                  {/* Subscription cards - cascade reveal with real brand icons */}
                  <div className="space-y-2.5">
                    {[
                      { name: 'Netflix', color: '#E50914', amount: '649', renewsIn: '3d' },
                      { name: 'Spotify', color: '#1DB954', amount: '119', renewsIn: '7d' },
                      { name: 'ChatGPT', color: '#10A37F', amount: '1,680', renewsIn: '12d' },
                    ].map((sub, i) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.55 + i * 0.08,
                          duration: 0.3,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl relative overflow-hidden transition-colors duration-300 ${isDark
                          ? 'bg-[#1B2028] border border-white/[0.08]'
                          : 'bg-gradient-to-r from-[#FFFDF9] to-[#FBF9F5] border border-[#E8E2D8]'
                          }`}
                        style={{
                          boxShadow: isDark
                            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px -2px rgba(120, 90, 50, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                      >


                        {/* Real brand icon */}
                        <div className="relative shrink-0">
                          <SubscriptionIcon name={sub.name} fallbackColor={sub.color} size="sm" />
                        </div>
                        <div className="flex-1 relative min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#1A1510]'}`}
                          >
                            {sub.name}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                            Renews in {sub.renewsIn}
                          </p>
                        </div>
                        <p className={`text-sm font-semibold relative ${isDark ? 'text-white' : 'text-[#1A1510]'}`}>
                          ₹{sub.amount}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Glow ring - static for performance */}
            <div
              className="absolute -inset-4 rounded-[48px] -z-10 opacity-25"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.1) 0%, transparent 72%)'
                  : 'radial-gradient(ellipse at center, rgba(154, 112, 53, 0.08) 0%, transparent 72%)',
              }}
            />
          </div>


        </motion.div>
      </div>

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
