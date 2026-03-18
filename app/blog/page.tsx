import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BlogPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Blog</h1>
        <p className="text-muted-foreground mb-12">Tips, insights, and updates about subscription management</p>

        {/* Coming Soon */}
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✍️</div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Blog Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            We're working on bringing you valuable content about subscription management, money-saving tips, and product updates.
          </p>
          <p className="text-sm text-gold">Check back soon for our first articles</p>
        </div>

        {/* Subscribe CTA */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Get notified when we publish</h2>
          <p className="text-muted-foreground mb-6">Subscribe to our newsletter for articles and updates</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors">
            Subscribe to Newsletter
          </Link>
        </div>
      </div>
    </div>
  )
}
