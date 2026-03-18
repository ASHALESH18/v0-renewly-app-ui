'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Contact Support</h1>
        <p className="text-muted-foreground mb-12">We'd love to hear from you. Get in touch with our support team.</p>

        {/* Contact Methods */}
        <div className="space-y-8">
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Email</h2>
            <p className="text-muted-foreground mb-4">Send us a message anytime</p>
            <a href="mailto:support@renewly.app" className="text-gold hover:underline font-medium">
              support@renewly.app
            </a>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Help Center</h2>
            <p className="text-muted-foreground mb-4">Browse our FAQ and knowledge base</p>
            <Link href="/help" className="text-gold hover:underline font-medium">
              Visit Help Center →
            </Link>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Response Time</h2>
            <p className="text-muted-foreground">
              We typically respond to support emails within 24 hours during business hours.
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Coming soon: Live chat support and in-app messaging</p>
        </div>
      </div>
    </div>
  )
}
