'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { springs, magneticButtonVariants, useMotionPreferences } from '../motion'
import { DemoModal } from '@/components/demo-modal'
import { useState, useEffect } from 'react'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getStartedDestination } from '@/lib/upgrade-flow'

export function Hero() {
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
    const timer = setTimeout(() => setIsLoaded(true), 40)
    return () => clearTimeout(timer)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  const handleGetStarted = () => {
    setIsNavigating(true)
    const destination = getStartedDestination(isAuthenticated)
    router.push(destination)
  }

  return (
    <section className="relative min-h-screen overflow-hidden px-4 py-20 lg:py-32 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-[18%] top-[12%] h-[28%] rounded-full blur-[96px] bg-[radial-gradient(ellipse_at_center,rgba(166,132,82,0.16)_0%,rgba(166,132,82,0.05)_36%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(199,163,106,0.10)_0%,rgba(199,163,106,0.03)_34%,transparent_72%)] opacity-70 dark:opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_58%,rgba(100,78,46,0.08)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_56%,rgba(0,0,0,0.22)_100%)]" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 24 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-gold/15 bg-card/55 px-5 py-2.5 backdrop-blur-md shadow-[0_12px_32px_-18px_rgba(199,163,106,0.35)]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_18px_rgba(199,163,106,0.5)]" />
          <span className="text-sm font-medium text-foreground/90 tracking-wide">
            Now available on iOS and Android
          </span>
        </motion.div>

        <motion.h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground tracking-tight leading-[1.03]">
          <span className="block overflow-hidden">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 34, filter: 'blur(12px)' }}
              animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Own every
            </motion.span>
          </span>

          <span className="block overflow-hidden mt-3">
            <motion.span
              className="relative inline-block text-gold-gradient font-serif italic"
              initial={{ opacity: 0, y: 34, filter: 'blur(12px)' }}
              animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
              transition={{ duration: 0.8, delay: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <span className="absolute inset-0 blur-xl opacity-20 text-gold">renewal.</span>
              <span className="relative">renewal.</span>
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: 0.34 }}
          className="mt-6 text-lg md:text-xl text-platinum max-w-2xl mx-auto leading-relaxed"
        >
          Renewly helps you track, understand, and reduce every recurring payment with elegance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.46 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            onClick={handleGetStarted}
            disabled={isNavigating}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="group relative w-full sm:w-auto cursor-pointer disabled:opacity-70"
          >
            <div className="absolute inset-0 rounded-2xl bg-gold/12 blur-md opacity-70 transition-opacity group-hover:opacity-90" />
            <div className="relative px-10 py-4 rounded-2xl gold-gradient text-obsidian font-semibold text-lg shadow-[0_18px_48px_-22px_rgba(199,163,106,0.55)] flex items-center justify-center gap-3">
              {isNavigating ? 'Loading...' : 'Start for free'}
              {!isNavigating && (
                <motion.div initial={{ x: 0 }} whileHover={{ x: 4 }} transition={springs.gentle}>
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
            className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-card/55 backdrop-blur-xl border border-gold/16 text-foreground font-semibold text-lg flex items-center justify-center gap-3 cursor-pointer hover:border-gold/30 hover:bg-card/70 transition-all"
          >
            <motion.div
              animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <Play className="w-5 h-5 text-gold" />
            </motion.div>
            Watch demo
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
          animate={isLoaded ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.8, delay: 0.62, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-16 relative"
        >
          <div className="absolute inset-x-[22%] -top-4 h-40 rounded-full blur-[70px] bg-[radial-gradient(ellipse_at_center,rgba(199,163,106,0.12)_0%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(199,163,106,0.08)_0%,transparent_72%)]" />

          <div className="relative mx-auto w-[280px] md:w-[320px]">
            <motion.div
              className={`relative rounded-[40px] p-3 transition-colors duration-300 ${isDark
                  ? 'bg-gradient-to-br from-[#1A1D24] via-[#0F1115] to-[#0A0C10] border border-[#2A2F38]'
                  : 'bg-gradient-to-b from-[#E8E4DE] via-[#D8D4CE] to-[#C8C4BE] border border-[#B8B4AE]'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 25px 60px -12px rgba(0,0,0,0.35), 0 12px 24px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset'
                  : '0 30px 60px -15px rgba(120,100,70,0.20), 0 15px 30px -10px rgba(0,0,0,0.10), 0 0 0 1px rgba(255,255,255,0.6) inset'
              }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                    y: [0, -4, 0],
                  }
              }
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className={`absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full ${isDark ? 'bg-[#000000]' : 'bg-[#1A1A1A]'
                  }`}
              />

              <div
                className={`rounded-[32px] overflow-hidden aspect-[9/19.5] transition-colors duration-300 ${isDark
                    ? 'bg-[#0A0C10] border border-[#1A1D24]'
                    : 'bg-gradient-to-b from-[#FAF8F5] via-[#F5F3F0] to-[#F0EDE8] border border-[#DDD8D0]'
                  }`}
              >
                <div className="p-4 pt-10 h-full">
                  <div
                    className={`flex items-center justify-between text-xs mb-6 ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'
                      }`}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1">
                      <div className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                      <div className={`w-4 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                      <div className={`w-6 h-2 rounded-sm ${isDark ? 'bg-platinum/50' : 'bg-gray-400/50'}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-[#BCC2CC]' : 'text-[#6B7280]'}`}>Good morning,</p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-[#F4EFE7]' : 'text-[#1A1510]'}`}>Arjun</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-medium">
                      AM
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl p-4 mb-4 relative overflow-hidden ${isDark
                        ? 'bg-gradient-to-br from-[#1B2028] via-[#13161C] to-[#1B2028] border border-[#C7A36A]/20'
                        : 'bg-gradient-to-br from-[#FFFDF9] via-[#FBF8F3] to-[#F8F5EF] border border-[#9A7035]/16'
                      }`}
                    style={{
                      boxShadow: isDark
                        ? '0 4px 12px rgba(0,0,0,0.18)'
                        : '0 6px 20px -4px rgba(120,90,50,0.10), 0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <p className={`text-xs mb-1 ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>Monthly recurring</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-[#C7A36A]' : 'text-[#9A7035]'}`}>₹7,644</p>
                    <p className="text-xs text-[#34D399] mt-1 font-medium">↓ 12% vs last month</p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Netflix', color: '#E50914', amount: '649', renewsIn: '3d' },
                      { name: 'Spotify', color: '#1DB954', amount: '119', renewsIn: '7d' },
                      { name: 'ChatGPT', color: '#10A37F', amount: '1,680', renewsIn: '12d' },
                    ].map((sub) => (
                      <div
                        key={sub.name}
                        className={`flex items-center gap-3 p-3 rounded-xl ${isDark
                            ? 'bg-[#1B2028] border border-white/[0.08]'
                            : 'bg-gradient-to-r from-[#FFFDF9] to-[#FBF9F5] border border-[#E8E2D8]'
                          }`}
                        style={{
                          boxShadow: isDark
                            ? '0 1px 3px rgba(0, 0, 0, 0.1)'
                            : '0 2px 8px -2px rgba(120, 90, 50, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <div className="relative shrink-0">
                          <SubscriptionIcon name={sub.name} fallbackColor={sub.color} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-[#1A1510]'}`}>
                            {sub.name}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
                            Renews in {sub.renewsIn}
                          </p>
                        </div>
                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#1A1510]'}`}>
                          ₹{sub.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
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