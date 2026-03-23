'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { springs } from '../motion'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springs.gentle}
        className="relative z-10 p-4 flex items-center justify-between"
      >
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <span className="text-obsidian font-semibold text-sm">R</span>
          </div>
          <span className="font-semibold text-ivory">Renewly</span>
        </Link>
        
        {/* Back to Home link */}
        <Link 
          href="/" 
          className="text-sm text-platinum hover:text-gold transition-colors"
        >
          Back to home
        </Link>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
          className="w-full max-w-md"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-ivory mb-2">
              {title}
            </h1>
            <p className="text-platinum">{subtitle}</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl bg-graphite border border-glass-border p-6 md:p-8 shadow-luxury">
            {children}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
