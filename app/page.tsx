import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'
import { LandingHeader } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { LeakPreview } from '@/components/landing/leak-preview'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'

export const metadata: Metadata = generatePageMetadata(
  'Renewly - Own Every Renewal | Premium Subscription Management',
  'Track and manage all your subscriptions with premium intelligence. Understand your spending, identify waste, and save money on recurring payments.',
  '/og-image.png'
)

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-foreground bg-transparent">
      <LandingHeader />
      <Hero />
      <Features />
      <LeakPreview />
      <Pricing />
      <FAQ />
      <div className="w-full bg-amber-500/20 border-b border-amber-500/30 px-4 py-6 text-center text-sm text-amber-900 dark:text-amber-100">
        ⚡ Development is still in progress. Thank you for your patience!
      </div>
      <Footer />
    </main>
  )
}
