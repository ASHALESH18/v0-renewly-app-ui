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
  const [appearance, setAppearance] = useState<'standard' | 'glass'>('standard')
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isNavigating, setIsNavigating] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    const root = document.documentElement

    const syncAppearance = () => {
      setAppearance(root.dataset.appearance === 'glass' ? 'glass' : 'standard')
    }

    syncAppearance()

    const observer = new MutationObserver(() => {
      syncAppearance()
    })

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-appearance'],
    })

    return () => observer.disconnect()
  }, [])

  const isGlass = mounted ? resolvedTheme === 'dark' && appearance === 'glass' : false
  const isDark = mounted ? resolvedTheme === 'dark' && appearance !== 'glass' : true
  const isLight = mounted ? resolvedTheme === 'light' : false
  const phoneTheme = isGlass
    ? {
      halo:
        'radial-gradient(ellipse at center, rgba(186, 206, 255, 0.24) 0%, rgba(210, 190, 255, 0.10) 38%, transparent 72%)',
      frameBg:
        'linear-gradient(135deg, rgba(36, 45, 72, 0.95) 0%, rgba(18, 24, 40, 0.98) 55%, rgba(8, 12, 24, 1) 100%)',
      frameBorder: 'rgba(255,255,255,0.10)',
      frameShadow:
        '0 28px 70px -14px rgba(8, 12, 30, 0.45), 0 10px 24px -8px rgba(8, 12, 30, 0.28), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 90px rgba(176,198,255,0.14)',
      notchBg: '#04070D',
      screenBg:
        'linear-gradient(180deg, rgba(17,26,48,1) 0%, rgba(13,20,38,1) 48%, rgba(10,16,30,1) 100%)',
      screenBorder: 'rgba(255,255,255,0.10)',
      screenShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      statusText: '#CAD6EB',
      primaryText: '#F7FAFF',
      secondaryText: '#CAD6EB',
      amountText: '#E2C389',
      heroCardBg:
        'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(237,244,255,0.10) 100%)',
      heroCardBorder: 'rgba(255,255,255,0.24)',
      heroCardShadow:
        '0 12px 32px -10px rgba(10,16,36,0.34), 0 1px 0 rgba(255,255,255,0.20) inset',
      itemBg: 'rgba(248,251,255,0.12)',
      itemBorder: 'rgba(255,255,255,0.18)',
      itemShadow: '0 8px 20px -10px rgba(10,16,36,0.28)',
    }
    : isDark
      ? {
        halo:
          'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.12) 0%, rgba(199, 163, 106, 0.04) 40%, transparent 70%)',
        frameBg:
          'linear-gradient(135deg, #1A1D24 0%, #0F1115 55%, #0A0C10 100%)',
        frameBorder: '#2A2F38',
        frameShadow:
          '0 25px 60px -12px rgba(0, 0, 0, 0.35), 0 12px 24px -8px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 80px rgba(199, 163, 106, 0.08)',
        notchBg: '#000000',
        screenBg: '#0A0C10',
        screenBorder: '#1A1D24',
        screenShadow: 'none',
        statusText: '#BCC2CC',
        primaryText: '#F4EFE7',
        secondaryText: '#9CA3AF',
        amountText: '#C7A36A',
        heroCardBg:
          'linear-gradient(135deg, #1B2028 0%, #13161C 50%, #1B2028 100%)',
        heroCardBorder: 'rgba(199, 163, 106, 0.25)',
        heroCardShadow: '0 4px 12px rgba(0,0,0,0.2)',
        itemBg: '#1B2028',
        itemBorder: 'rgba(255,255,255,0.08)',
        itemShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }
      : {
        halo:
          'radial-gradient(ellipse at center, rgba(154, 112, 53, 0.12) 0%, rgba(154, 112, 53, 0.04) 40%, transparent 70%)',
        frameBg:
          'linear-gradient(180deg, #E8E4DE 0%, #D8D4CE 52%, #C8C4BE 100%)',
        frameBorder: '#B8B4AE',
        frameShadow:
          '0 30px 60px -15px rgba(120, 100, 70, 0.25), 0 15px 30px -10px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.6) inset, inset 0 -2px 6px rgba(0, 0, 0, 0.06), 0 0 80px rgba(154, 112, 53, 0.1)',
        notchBg: '#1A1A1A',
        screenBg:
          'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 48%, #F0EDE8 100%)',
        screenBorder: '#DDD8D0',
        screenShadow:
          'inset 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.02)',
        statusText: '#6B7280',
        primaryText: '#1A1510',
        secondaryText: '#6B7280',
        amountText: '#9A7035',
        heroCardBg:
          'linear-gradient(135deg, #FFFDF9 0%, #FBF8F3 50%, #F8F5EF 100%)',
        heroCardBorder: 'rgba(154, 112, 53, 0.20)',
        heroCardShadow:
          '0 6px 20px -4px rgba(120, 90, 50, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        itemBg: 'linear-gradient(90deg, #FFFDF9 0%, #FBF9F5 100%)',
        itemBorder: '#E8E2D8',
        itemShadow:
          '0 2px 8px -2px rgba(120, 90, 50, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
      }
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
              background: phoneTheme.halo,
            }}
          />

          {/* Phone mockup frame - theme-aware */}
          <div className="relative mx-auto w-[280px] md:w-[320px]">
            {/* Premium device frame - adapts to theme with rich shading */}
            <div
              className="relative rounded-[40px] p-3 transition-colors duration-300"
              style={{
                background: phoneTheme.frameBg,
                border: `1px solid ${phoneTheme.frameBorder}`,
                boxShadow: phoneTheme.frameShadow,
              }}
            >
              {/* Notch - dynamic island style */}
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full"
                style={{ background: phoneTheme.notchBg }}
              />

              {/* Screen - theme-aware app interface with premium depth */}
              <div
                className="rounded-[32px] overflow-hidden aspect-[9/19.5] transition-colors duration-300"
                style={{
                  background: phoneTheme.screenBg,
                  border: `1px solid ${phoneTheme.screenBorder}`,
                  boxShadow: phoneTheme.screenShadow,
                }}
              >
                {/* App preview content */}
                <div className="p-4 pt-10 h-full">
                  {/* Status bar - instant render */}
                  <motion.div
                    className="flex items-center justify-between text-xs mb-6"
                    style={{ color: phoneTheme.statusText }}
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
                      <p className="text-xs" style={{ color: phoneTheme.secondaryText }}>
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
                    className="rounded-2xl p-4 mb-4 relative overflow-hidden transition-colors duration-300"
                    style={{
                      background: phoneTheme.heroCardBg,
                      border: `1px solid ${phoneTheme.heroCardBorder}`,
                      boxShadow: phoneTheme.heroCardShadow,
                    }}
                  >

                    <p className="text-xs mb-1 relative" style={{ color: phoneTheme.secondaryText }}>
                      Monthly recurring
                    </p>
                    <p className="text-2xl font-bold relative" style={{ color: phoneTheme.amountText }}>
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
                        className="flex items-center gap-3 p-3 rounded-xl relative overflow-hidden transition-colors duration-300"
                        style={{
                          background: phoneTheme.itemBg,
                          border: `1px solid ${phoneTheme.itemBorder}`,
                          boxShadow: phoneTheme.itemShadow,
                        }}
                      >


                        {/* Real brand icon */}
                        <div className="relative shrink-0">
                          <SubscriptionIcon name={sub.name} fallbackColor={sub.color} size="sm" />
                        </div>
                        <div className="flex-1 relative min-w-0">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: phoneTheme.primaryText }}
                          >
                            {sub.name}
                          </p>
                          <p className="text-[10px]"
                            style={{ color: phoneTheme.secondaryText }}>
                            Renews in {sub.renewsIn}
                          </p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: phoneTheme.primaryText }}>>
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
