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
      initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl glass-premium border border-gold/10">
          <RenewlyLogo size="lg" />

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/#features', id: 'features', label: 'Features' },
              { href: '/#pricing', id: 'pricing', label: 'Pricing' },
              { href: '/#faq', id: 'faq', label: 'FAQ' },
            ].map((item) => (
              <motion.a
                key={item.id}
                href={item.href}
                onClick={(e) => handleAnchorClick(e, item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-gold/5"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-32 h-10 rounded-lg bg-graphite/50 animate-pulse" />
          ) : user ? (
            <>
              <Link href="/app/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-obsidian font-medium text-sm cursor-pointer"
                >
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>

              <motion.button
                whileHover={{ scale: isSigningOut ? 1 : 1.02 }}
                whileTap={{ scale: isSigningOut ? 1 : 0.98 }}
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/25 bg-card/70 text-foreground font-medium text-sm transition-colors hover:border-gold/45 hover:text-gold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out...' : 'Logout'}
              </motion.button>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Sign in
                </motion.button>
              </Link>

              <Link href="/auth/sign-up">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(199, 163, 106, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-obsidian font-medium text-sm cursor-pointer"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
