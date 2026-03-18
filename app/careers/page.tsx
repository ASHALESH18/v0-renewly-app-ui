import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CareersPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Careers at Renewly</h1>
        <p className="text-muted-foreground mb-12">Join our team and help people take control of their subscriptions</p>

        {/* About Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Why Join Renewly?</h2>
          <ul className="space-y-3 text-foreground/80">
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>Work on a product that makes a real difference in people's lives</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>Competitive compensation and equity packages</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>Flexible work arrangements and remote opportunities</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>Collaborative team culture with focus on growth</span>
            </li>
            <li className="flex gap-3">
              <span className="text-gold">✓</span>
              <span>Health, wellness, and professional development benefits</span>
            </li>
          </ul>
        </div>

        {/* Coming Soon */}
        <div className="border border-border rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Open Positions Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            We're growing and looking for talented people to join our team. Check back soon for current openings.
          </p>
        </div>

        {/* Email CTA */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Interested in joining us?</h2>
          <p className="text-muted-foreground mb-6">Send us your resume and let us know about your interests</p>
          <a href="mailto:careers@renewly.app" className="inline-block px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors">
            Send Your Resume
          </a>
        </div>
      </div>
    </div>
  )
}
