'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { signOutAndRedirectHome } from '@/lib/auth/sign-out'

export function LandingHeader() {
  const { user, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center">
            <span className="text-obsidian font-bold text-lg">R</span>
          </div>
          <span className="text-xl font-serif text-ivory group-hover:text-gold transition-colors">
            Renewly
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm text-platinum/80 hover:text-ivory transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="text-sm text-platinum/80 hover:text-ivory transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="text-sm text-platinum/80 hover:text-ivory transition-colors"
          >
            FAQ
          </Link>
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold/25 bg-obsidian/70 text-ivory font-medium text-sm transition-colors hover:border-gold/45 hover:text-gold disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="px-4 py-2 text-sm text-platinum hover:text-ivory transition-colors cursor-pointer"
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