'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[v0] Dashboard page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-crimson/10 border border-crimson/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-crimson" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground text-sm">
            We encountered an error loading the dashboard. Please try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-4 p-3 rounded-lg bg-muted text-left">
            <p className="text-xs text-muted-foreground font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
