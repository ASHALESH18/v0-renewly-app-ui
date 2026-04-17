'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'
import { RenewlyLogo } from '@/components/renewly-logo'

export function LandingHeader() {
  const { user, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Handle anchor navigation with proper smooth scroll
  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()

    const scrollToSection = () => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    // If already on homepage, just scroll
    if (pathname === '/') {
      scrollToSection()
    } else {
      // Navigate to homepage first, then scroll after load
      router.push('/')
      // Wait for navigation then scroll
      setTimeout(scrollToSection, 100)
    }
  }, [pathname, router])

  const handleLogout = async () => {
    if (isSigningOut) return

    try {
      setIsSigningOut(true)
      await signOutAndRedirectHome()
    } catch (error) {
      console.error('[v0] Header sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl glass-strong border border-gold/8 shadow-sm">
          <RenewlyLogo size="lg" />

          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { href: '/#features', id: 'features', label: 'Features' },
              { href: '/#pricing', id: 'pricing', label: 'Pricing' },
              { href: '/#faq', id: 'faq', label: 'FAQ' },
            ].map((item) => (
              <motion.a
                key={item.id}
                href={item.href}
                onClick={(e) => handleAnchorClick(e, item.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-gold/[0.04]"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {loading ? (
              <div className="w-28 h-9 rounded-lg bg-muted/40 animate-pulse" />
            ) : user ? (
              <>
                <Link href="/app/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-obsidian font-semibold text-sm cursor-pointer shadow-sm"
                  >
                    Dashboard
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </Link>

                <motion.button
                  whileHover={{ scale: isSigningOut ? 1 : 1.01 }}
                  whileTap={{ scale: isSigningOut ? 1 : 0.97 }}
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card/60 text-muted-foreground font-medium text-sm transition-colors hover:border-gold/30 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {isSigningOut ? 'Signing out...' : 'Logout'}
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Sign in
                  </motion.button>
                </Link>

                <Link href="/auth/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl gold-gradient text-obsidian font-semibold text-sm cursor-pointer shadow-sm"
                  >
                    Get started
                    <ArrowRight className="w-3.5 h-3.5" />
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
