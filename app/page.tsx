import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'
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
    <main className="min-h-screen bg-obsidian">
      <Hero />
      <Features />
      <LeakPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
