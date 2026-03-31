'use client'

import { motion } from 'framer-motion'

// Premium homepage loading skeleton
// Shows minimal skeleton for hero area while page loads
function ShimmerBlock({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ backgroundPosition: '0% 0%' }}
      animate={{ backgroundPosition: '100% 0%' }}
      transition={{ duration: 2, repeat: Infinity, delay }}
      className={`bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-lg ${className}`}
    />
  )
}

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <ShimmerBlock className="h-8 w-24" />
          <div className="hidden md:flex items-center gap-6">
            <ShimmerBlock className="h-4 w-16" delay={0.1} />
            <ShimmerBlock className="h-4 w-16" delay={0.2} />
            <ShimmerBlock className="h-4 w-16" delay={0.3} />
          </div>
          <div className="flex items-center gap-3">
            <ShimmerBlock className="h-9 w-20 rounded-lg" delay={0.4} />
            <ShimmerBlock className="h-9 w-24 rounded-lg" delay={0.5} />
          </div>
        </div>
      </header>

      {/* Hero skeleton */}
      <section className="container px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <ShimmerBlock className="h-12 w-3/4 mx-auto" />
          <ShimmerBlock className="h-12 w-1/2 mx-auto" delay={0.1} />
          <ShimmerBlock className="h-6 w-2/3 mx-auto" delay={0.2} />
          <ShimmerBlock className="h-6 w-1/2 mx-auto" delay={0.3} />
          <div className="flex items-center justify-center gap-4 pt-4">
            <ShimmerBlock className="h-12 w-36 rounded-xl" delay={0.4} />
            <ShimmerBlock className="h-12 w-32 rounded-xl" delay={0.5} />
          </div>
        </div>
      </section>
    </div>
  )
}
