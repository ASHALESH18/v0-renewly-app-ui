'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

import { DemoModal } from '@/components/demo-modal'
import { SubscriptionIcon } from '@/lib/brand-icons'
import { useAuth } from '@/lib/hooks/use-auth'
import { getStartedDestination } from '@/lib/upgrade-flow'
import {
  magneticButtonVariants,
  springs,
  useMotionPreferences,
} from '../motion'

const previewSubscriptions = [
  { name: 'Netflix', amount: '649', renewsIn: '3d', color: '#E50914' },
  { name: 'Spotify', amount: '119', renewsIn: '7d', color: '#1DB954' },
  { name: 'ChatGPT', amount: '1,680', renewsIn: '12d', color: '#10A37F' },
]

export function Hero() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  const { resolvedTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { prefersReducedMotion } = useMotionPreferences()

  useEffect(() => {
    setMounted(true)
    const timer = window.setTimeout(() => setIsLoaded(true), 60)
    return () => window.clearTimeout(timer)
  }, [])

  const isDark = mounted ? resolvedTheme === 'dark' : true

  const handleGetStarted = () => {
    setIsNavigating(true)
    router.push(getStartedDestination(isAuthenticated))
  }

  return (
    <section className="relative flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden px-4 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-[16%] top-[8%] h-44 rounded-full bg-gold/8 blur-[92px] dark:bg-gold/10" />
        <div className="absolute inset-x-[24%] top-[35%] h-56 rounded-full bg-emerald/5 blur-[110px] dark:bg-emerald/7" />
        <div className="absolute left-1/2 top-[58%] h-64 w-[56%] -translate-x-1/2 rounded-full bg-gold/6 blur-[120px] dark:bg-gold/8" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={isLoaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.08, duration: 0.45 }}
          className="mb-8 inline-flex items-center gap-3 rounded-full border border-gold/15 bg-card/55 px-5 py-2.5 backdrop-blur-xl"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_16px_rgba(199,163,106,0.35)]" />
          <span className="text-sm font-medium text-foreground">
            Now available on iOS and Android
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.16, duration: 0.55 }}
          className="text-balance text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl"
        >
          <span className="block">Own every</span>
          <span className="mt-2 block font-serif italic text-gold">
            renewal.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.26, duration: 0.45 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-platinum md:text-xl"
        >
          Renewly helps you track, understand, and reduce every recurring
          payment with elegance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.34, duration: 0.45 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <motion.button
            onClick={handleGetStarted}
            disabled={isNavigating}
            variants={magneticButtonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="group relative isolate w-full cursor-pointer disabled:opacity-70 sm:w-auto"
          >
            <div className="absolute inset-0 rounded-2xl bg-gold/12 blur-md opacity-70 transition-opacity group-hover:opacity-90" />
            <div className="relative flex items-center justify-center gap-3 rounded-2xl gold-gradient px-10 py-5 text-lg font-bold text-obsidian shadow-luxury">
              {isNavigating ? 'Loading...' : 'Start for free'}
              {!isNavigating && (
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={springs.gentle}
                >
                  <ArrowRight className="h-5 w-5" />
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
            className="w-full rounded-2xl border border-gold/18 bg-card/50 px-10 py-5 text-lg font-semibold text-foreground backdrop-blur-xl transition-colors hover:border-gold/28 hover:bg-card/65 sm:w-auto"
          >
            <span className="flex items-center justify-center gap-3">
              <Play className="h-5 w-5 text-gold" />
              Watch demo
            </span>
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={isLoaded ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.46, duration: 0.65 }}
          className="relative mt-16"
        >
          <div className="absolute inset-x-[18%] top-10 h-52 rounded-full bg-gold/8 blur-[110px] dark:bg-gold/10" />

          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                  y: [0, -6, 0],
                }
            }
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative mx-auto w-[300px] max-w-[84vw]"
          >
            <div
              className={`relative rounded-[42px] border p-3 transition-colors duration-300 ${isDark
                  ? 'border-white/8 bg-[linear-gradient(180deg,#161A22_0%,#0D1016_100%)]'
                  : 'border-[#D8CFC0] bg-[linear-gradient(180deg,#ECE7DF_0%,#DDD7CF_100%)]'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 28px 60px -20px rgba(0,0,0,0.45), 0 10px 24px rgba(0,0,0,0.25)'
                  : '0 28px 60px -20px rgba(126,106,72,0.18), 0 10px 24px rgba(126,106,72,0.10)',
              }}
            >
              <div
                className={`absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full ${isDark ? 'bg-black' : 'bg-[#1B1B1D]'
                  }`}
              />

              <div
                className={`aspect-[9/19.5] overflow-hidden rounded-[32px] border transition-colors duration-300 ${isDark
                    ? 'border-white/5 bg-[#0B0E13]'
                    : 'border-[#D8CFC0] bg-[#FBF8F3]'
                  }`}
              >
                <div className="h-full p-4 pt-10">
                  <div
                    className={`mb-6 flex items-center justify-between text-xs ${isDark ? 'text-[#BCC2CC]' : 'text-[#76706A]'
                      }`}
                  >
                    <span>9:41</span>
                    <div className="flex gap-1.5">
                      <span className="h-2 w-4 rounded-full bg-current opacity-50" />
                      <span className="h-2 w-4 rounded-full bg-current opacity-50" />
                      <span className="h-2 w-6 rounded-full bg-current opacity-50" />
                    </div>
                  </div>

                  <div className="mb-6 flex items-center justify-between">
                    <div className="text-left">
                      <p
                        className={`text-xs ${isDark ? 'text-[#BCC2CC]' : 'text-[#76706A]'
                          }`}
                      >
                        Good morning,
                      </p>
                      <p
                        className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#17130F]'
                          }`}
                      >
                        Arjun
                      </p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-semibold text-gold">
                      AM
                    </div>
                  </div>

                  <div
                    className={`mb-4 rounded-2xl border p-4 ${isDark
                        ? 'border-gold/20 bg-[linear-gradient(180deg,rgba(29,34,44,0.96),rgba(18,22,29,0.96))]'
                        : 'border-[#DBCBAF] bg-[linear-gradient(180deg,#FFFDF9,#F6F0E7)]'
                      }`}
                  >
                    <p
                      className={`mb-1 text-xs ${isDark ? 'text-[#9CA3AF]' : 'text-[#857A6D]'
                        }`}
                    >
                      Monthly recurring
                    </p>
                    <p
                      className={`text-2xl font-bold ${isDark ? 'text-gold' : 'text-[#A57A3A]'
                        }`}
                    >
                      ₹7,644
                    </p>
                    <p className="mt-1 text-xs font-medium text-emerald">
                      ↓ 12% vs last month
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {previewSubscriptions.map((sub, index) => (
                      <motion.div
                        key={sub.name}
                        initial={{ opacity: 0, x: -16 }}
                        animate={isLoaded ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.62 + index * 0.08, duration: 0.35 }}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${isDark
                            ? 'border-white/6 bg-[#171C25]'
                            : 'border-[#E4DBCF] bg-white/85'
                          }`}
                      >
                        <SubscriptionIcon
                          name={sub.name}
                          fallbackColor={sub.color}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1 text-left">
                          <p
                            className={`truncate text-xs font-semibold ${isDark ? 'text-white' : 'text-[#17130F]'
                              }`}
                          >
                            {sub.name}
                          </p>
                          <p
                            className={`text-[10px] ${isDark ? 'text-[#98A2B3]' : 'text-[#857A6D]'
                              }`}
                          >
                            Renews in {sub.renewsIn}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#17130F]'
                            }`}
                        >
                          ₹{sub.amount}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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