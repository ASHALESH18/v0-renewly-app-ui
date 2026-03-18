import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ChangelogPage() {
  const releases = [
    {
      version: '1.0.0',
      date: 'March 18, 2026',
      notes: [
        'Launch of Renewly subscription management platform',
        'Premium "Obsidian Reserve" design system',
        'Multi-currency support (INR, USD, EUR, GBP, and more)',
        'Leak Report feature to identify savings opportunities',
        'Subscription analytics and insights',
        'Smart renewal reminders',
        'Export subscriptions as CSV or JSON',
      ]
    },
    {
      version: '0.9.0 Beta',
      date: 'March 1, 2026',
      notes: [
        'Beta release for early adopters',
        'Core subscription management features',
        'Dashboard with key metrics',
        'Initial notification system',
        'User authentication',
      ]
    }
  ]

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
        <h1 className="text-4xl font-bold text-foreground mb-3">Changelog</h1>
        <p className="text-muted-foreground mb-12">Release notes and version history</p>

        {/* Releases */}
        <div className="space-y-12">
          {releases.map((release, idx) => (
            <div key={idx} className="border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">v{release.version}</h2>
                  <p className="text-sm text-muted-foreground">{release.date}</p>
                </div>
                {idx === 0 && (
                  <span className="px-3 py-1 bg-gold/20 text-gold text-xs font-semibold rounded-full">
                    Latest
                  </span>
                )}
              </div>

              <ul className="space-y-2">
                {release.notes.map((note, noteIdx) => (
                  <li key={noteIdx} className="flex gap-3 text-foreground/80">
                    <span className="text-gold mt-1">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Coming Soon</h2>
          <ul className="space-y-2 text-foreground/80">
            <li>✨ Family Plan with shared household subscriptions</li>
            <li>✨ Mobile apps (iOS and Android)</li>
            <li>✨ Bank account sync for automatic subscription detection</li>
            <li>✨ Advanced analytics and spending forecasts</li>
            <li>✨ Integration with payment methods for smart recommendations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
