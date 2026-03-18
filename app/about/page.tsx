import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="px-4 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl font-bold text-foreground mb-6">About Renewly</h1>
        
        <div className="space-y-6 text-foreground/80">
          <p className="text-lg">
            Renewly is a premium subscription management platform designed for the modern consumer who wants complete control over their recurring expenses.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Mission</h2>
          <p>
            We believe that subscription management shouldn't be complex or frustrating. Our mission is to empower people to understand, control, and optimize their recurring spending.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Why Renewly?</h2>
          <ul className="space-y-2 list-disc list-inside">
            <li>Never miss a renewal date again with smart notifications</li>
            <li>Identify unused subscriptions and save money instantly</li>
            <li>Track spending across all your subscriptions in one place</li>
            <li>Get insights on your subscription patterns and habits</li>
            <li>Premium, beautiful interface designed for simplicity</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Privacy First</h2>
          <p>
            Your subscription data is sensitive. We're committed to privacy-first practices, secure encryption, and never selling your data to third parties.
          </p>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-muted-foreground mb-4">Ready to take control of your subscriptions?</p>
          <Link href="/auth/sign-up" className="inline-block px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors">
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
