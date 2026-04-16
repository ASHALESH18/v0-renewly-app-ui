'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { springs, magneticButtonVariants, useMotionPreferences } from '../motion'
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
  const [isLoaded, setIsLoaded] = useState(false)
  const { prefersReducedMotion } = useMotionPreferences()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  const handleGetStarted = () => {
    setIsNavigating(true)
    const destination = getStartedDestination(isAuthenticated)
    router.push(destination)
  }

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const yNear = useTransform(scrollYProgress, [0, 1], [0, -70])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20 lg:py-32"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[460px] md:w-[880px] md:h-[560px]"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.06) 0%, rgba(199, 163, 106, 0.02) 40%, transparent 72%)',
            filter: 'blur(60px)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            isLoaded
              ? {
                opacity: prefersReducedMotion ? 0.36 : [0.24, 0.38, 0.24],
                scale: prefersReducedMotion ? 1 : [1, 1.02, 1],
              }
              : {}
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 82% 72% at 50% 45%, transparent 0%, var(--hero-vignette) 100%)',
          }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial="initial"
        animate={isLoaded ? 'animate' : 'initial'}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)', scale: 0.96 }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-10"
        >
          <div className="absolute inset-0 rounded-full border border-gold/20 bg-card/70 backdrop-blur-sm" />
          <div className="relative flex items-center gap-3">
            <motion.div
              className="relative w-2.5 h-2.5"
              animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.55, 0.8, 0.55] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="absolute inset-0 rounded-full bg-gold" />
              <span className="absolute inset-0 rounded-full bg-gold blur-sm" />
            </motion.div>
            <span className="text-sm text-foreground font-medium tracking-wide">
              Now available on iOS and Android
            </span>
          </div>
        </motion.div>

        <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[1.05]">
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              initial={{ opacity: 0, filter: 'blur(14px)', y: 34, scale: 0.97 }}
              animate={isLoaded ? { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 } : {}}
              transition={{ duration: 0.75, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Own every
            </motion.span>
          </span>

          <span className="block overflow-hidden mt-3 relative">
            <motion.span
              className="relative inline-block"
              initial={{ opacity: 0, filter: 'blur(14px)', y: 34, scale: 0.97 }}
              animate={isLoaded ? { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1 } : {}}
              transition={{ duration: 0.75, delay: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="absolute inset-0 text-gold blur-xl opacity-30">renewal.</span>
              <span className="relative text-gold-gradient font-serif italic">renewal.</span>
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.45, delay: 0.44, ease: 'easeOut' }}
          className="mt-6 text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with
          elegance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22, filter: 'blur(8px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.55, delay: 0.58, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
        >
          <motion.button
            onClick={handleGetStarted}
            disabled={isNavigating}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="relative w-full sm:w-auto group cursor-pointer disabled:opacity-70"
          >
            <div className="absolute inset-0 rounded-2xl bg-gold/12 blur-md opacity-70 transition-opacity group-hover:opacity-90" />
            <div className="relative px-10 py-5 rounded-2xl gold-gradient text-obsidian font-bold text-lg shadow-luxury flex items-center justify-center gap-3">
              {isNavigating ? 'Loading...' : 'Start for free'}
              {!isNavigating && (
                <motion.div initial={{ x: 0 }} whileHover={{ x: 6 }} transition={springs.gentle}>
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              )}
            </div>
          </motion.button>

          <motion.button
            onClick={() => setIsDemoOpen(true)}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="relative w-full sm:w-auto px-10 py-5 rounded-2xl bg-card/55 backdrop-blur-xl border border-gold/20 text-foreground font-semibold text-lg flex items-center justify-center gap-3 cursor-pointer hover:border-gold/40 hover:bg-card/72 transition-all group"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <Play className="w-5 h-5 text-gold" />
            </motion.div>
            Watch demo
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 56, filter: 'blur(10px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ delay: 0.74, duration: 0.76, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-20 relative"
          style={{ y: prefersReducedMotion ? 0 : yNear }}
        >
          <motion.div
            className="absolute -inset-14 md:-inset-20 rounded-[80px]"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.08) 0%, rgba(199, 163, 106, 0.025) 42%, transparent 72%)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              isLoaded
                ? {
                  opacity: prefersReducedMotion ? 0.26 : [0.14, 0.26, 0.14],
                  scale: prefersReducedMotion ? 1 : [1, 1.025, 1],
                }
                : {}
            }
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          />

          <div className="relative mx-auto w-[280px] md:w-[320px]">
            <motion.div
              className={`relative rounded-[40px] p-3 transition-colors duration-300 ${isDark
                  ? 'bg-gradient-to-br from-[#1A1D24] via-[#0F1115] to-[#0A0C10] border border-[#2A2F38]'
                  : 'bg-gradient-to-b from-[#E8E4DE] via-[#D8D4CE] to-[#C8C4BE] border border-[#B8B4AE]'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 24px 56px -16px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.04) inset'
                  : '0 26px 54px -18px rgba(120, 100, 70, 0.18), 0 0 0 1px rgba(255,255,255,0.5) inset, inset 0 -2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full ${isDark ? 'bg-[#000000]' : 'bg-[#1A1A1A]'}`}
              />

              <div
                className={`rounded-[32px] overflow-hidden aspect-[9/19.5] transition-colors duration-300 ${isDark
                    ? 'bg-[#0A0C10] border border-[#1A1D24]'
                    : 'bg-gradient-to-b from-[#FAF8F5] via-[#F5F3F0] to-[#F0EDE8] border border-[#DDD8D0]'
                  }`}
                style={{
                  boxShadow: isDark ? 'none' : 'inset 0 2px 8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.02)',
                }}
              >
                <div className="p-4 pt-10 h-full">
                  <motion.div
                    className={`flex items-center justify-between text-xs mb-6 ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'}`}
                    initial={{ opacity: 0 }}
                    animate={isLoaded ? { opacity: 1 } : {}}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                      <div className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                      <div className={`w-6 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 2, duration: 0.6 }}
                  >
                    <div>
                      <p className={`text-xs ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'}`}>Good morning,</p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-[#F4EFE7]' : 'text-[#1A1510]'}`}>Arjun</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-medium">
                      AM
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                    animate={isLoaded ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
                    transition={{ delay: 2.2, duration: 0.7, ease: 'easeOut' }}
                    className={`rounded-2xl p-4 mb-4 relative overflow-hidden transition-colors duration-300 ${isDark
                        ? 'bg-gradient-to-br from-[#1B2028] via-[#13161C] to-[#1B2028] border border-[#C7A36A]/25'
                        : 'bg-gradient-to-br from-[#FFFDF9] via-[#FBF8F3] to-[#F8F5EF] border border-[#9A7035]/20'
                      }`}
                    style={{
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.18)'
                        : '0 6px 18px -4px rgba(120,90,50,0.10), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
                    }}
                  >
                    <p className={`text-xs mb-1 relative ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Monthly recurring</p>
                    <p className={`text-2xl font-bold relative ${isDark ? 'text-[#C7A36A]' : 'text-[#9A7035]'}`}>₹7,644</p>
                    <p className="text-xs text-[#34D399] mt-1 relative font-medium">↓ 12% vs last month</p>
                  </motion.div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Netflix', color: '#E50914', amount: '649', renewsIn: '3d' },
                      { name: 'Spotify', color: '#1DB954', amount: '119', renewsIn: '7d' },
                      { name: 'ChatGPT', color: '#10A37F', amount: '1,680', renewsIn: '12d' },
                    ].map((sub, i) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, x: -24, filter: 'blur(4px)' }}
                        animate={isLoaded ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}}
                        transition={{ delay: 2.45 + i * 0.14, duration: 0.46, ease: 'easeOut' }}
                        className={`flex items-center gap-3 p-3 rounded-xl relative overflow-hidden transition-colors duration-300 ${isDark
                            ? 'bg-[#1B2028] border border-white/[0.08]'
                            : 'bg-gradient-to-r from-[#FFFDF9] to-[#FBF9F5] border border-[#E8E2D8]'
                          }`}
                        style={{
                          boxShadow: isDark
                            ? '0 1px 3px rgba(0,0,0,0.1)'
                            : '0 2px 8px -2px rgba(120,90,50,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="relative shrink-0">
                          <SubscriptionIcon name={sub.name} fallbackColor={sub.color} size="sm" />
                        </div>
                        <div className="flex-1 relative min-w-0">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#1A1510]'}`}>{sub.name}</p>
                          <p className={`text-[10px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Renews in {sub.renewsIn}</p>
                        </div>
                        <p className={`text-sm font-semibold relative ${isDark ? 'text-white' : 'text-[#1A1510]'}`}>₹{sub.amount}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="absolute -inset-4 rounded-[48px] -z-10"
              style={{
                background: isDark
                  ? 'radial-gradient(ellipse at center, rgba(199, 163, 106, 0.10) 0%, transparent 72%)'
                  : 'radial-gradient(ellipse at center, rgba(154, 112, 53, 0.08) 0%, transparent 72%)',
              }}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={
                isLoaded
                  ? {
                    opacity: prefersReducedMotion ? 0.22 : [0.12, 0.24, 0.12],
                    scale: prefersReducedMotion ? 1 : [1, 1.03, 1],
                  }
                  : {}
              }
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>
        </motion.div>
      </motion.div>

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