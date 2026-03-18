import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DownloadPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Get Renewly</h1>
        <p className="text-muted-foreground mb-12">Download Renewly on your favorite device</p>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">iOS</h2>
            <p className="text-muted-foreground mb-4">
              Available on the App Store for iPhone and iPad
            </p>
            <a href="#" className="inline-block px-4 py-2 bg-gold/20 text-gold rounded hover:bg-gold/30 transition-colors">
              Coming Soon
            </a>
          </div>

          <div className="border border-border rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Android</h2>
            <p className="text-muted-foreground mb-4">
              Available on Google Play for Android devices
            </p>
            <a href="#" className="inline-block px-4 py-2 bg-gold/20 text-gold rounded hover:bg-gold/30 transition-colors">
              Coming Soon
            </a>
          </div>

          <div className="border border-border rounded-lg p-8 text-center md:col-span-2">
            <div className="text-4xl mb-4">🌐</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Web</h2>
            <p className="text-muted-foreground mb-4">
              Access Renewly anytime at renewly.app
            </p>
            <Link href="/" className="inline-block px-4 py-2 bg-gold text-obsidian font-semibold rounded hover:bg-gold/90 transition-colors">
              Go to Web App
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Platform Availability</h2>
          <ul className="space-y-2 text-foreground/80">
            <li>✓ <strong>Web:</strong> Available now - use on any device with a browser</li>
            <li>✓ <strong>Responsive:</strong> Works great on mobile, tablet, and desktop</li>
            <li>⏳ <strong>iOS App:</strong> Coming Q2 2026</li>
            <li>⏳ <strong>Android App:</strong> Coming Q2 2026</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
