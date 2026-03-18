import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PressPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Press</h1>
        <p className="text-muted-foreground mb-12">News, press releases, and media resources about Renewly</p>

        {/* About Renewly */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">About Renewly</h2>
          <p className="text-foreground/80 mb-4">
            Renewly is a premium subscription management platform that helps consumers take control of their recurring expenses. With intelligent tracking, leak detection, and smart reminders, Renewly helps users save money and stay on top of their subscriptions.
          </p>
          <p className="text-foreground/80">
            Founded in 2026, Renewly serves users globally with a focus on privacy, simplicity, and elegant design.
          </p>
        </div>

        {/* Press Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Resources</h2>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Logo & Branding</h3>
              <p className="text-sm text-muted-foreground mb-3">High-resolution logos and brand guidelines</p>
              <a href="#" className="text-gold hover:underline text-sm font-medium">Download Media Kit →</a>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Fact Sheet</h3>
              <p className="text-sm text-muted-foreground mb-3">Company overview and key facts</p>
              <a href="#" className="text-gold hover:underline text-sm font-medium">Download PDF →</a>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">Product Screenshots</h3>
              <p className="text-sm text-muted-foreground mb-3">High-quality product images and videos</p>
              <a href="#" className="text-gold hover:underline text-sm font-medium">View Gallery →</a>
            </div>
          </div>
        </div>

        {/* Press Contact */}
        <div className="border border-border rounded-lg p-6 bg-secondary/10">
          <h2 className="text-lg font-semibold text-foreground mb-3">Press Inquiries</h2>
          <p className="text-muted-foreground mb-4">For media questions and press inquiries, please contact:</p>
          <a href="mailto:press@renewly.app" className="text-gold hover:underline font-medium">
            press@renewly.app
          </a>
        </div>
      </div>
    </div>
  )
}
