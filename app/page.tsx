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
    <main className="min-h-screen text-foreground bg-[radial-gradient(1200px_700px_at_15%_-10%,rgba(184,138,68,0.14),transparent_55%),radial-gradient(1000px_600px_at_100%_0%,rgba(47,107,95,0.08),transparent_42%),linear-gradient(180deg,#fbf6ef_0%,#f2e7d9_100%)] dark:bg-obsidian">
      <LandingHeader />
      <Hero />
      <Features />
      <LeakPreview />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  )
}
