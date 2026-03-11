'use client'

import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { LeakPreview } from '@/components/landing/leak-preview'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'

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
