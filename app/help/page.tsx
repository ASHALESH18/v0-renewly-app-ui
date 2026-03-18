import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I add a subscription?',
      answer: 'Click the "Add Subscription" button in the dashboard, fill in the subscription details including name, amount, billing cycle, and renewal date. Your subscription will be saved automatically.'
    },
    {
      question: 'Can I get reminders before renewal dates?',
      answer: 'Yes! Go to Settings > Notifications > Reminder Timing to choose when you want to be reminded (1, 3, 7, or 14 days before renewal).'
    },
    {
      question: 'What is the Leak Report?',
      answer: 'The Leak Report analyzes your subscriptions to identify unused services, duplicate subscriptions, and opportunities to save money. It provides actionable insights to optimize your spending.'
    },
    {
      question: 'How is my data secure?',
      answer: 'All your data is encrypted in transit and at rest using industry-standard security protocols. We never sell or share your subscription data with third parties.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Go to Settings > Security > Export Data. You can download your subscriptions as CSV or JSON format for backup or import into other tools.'
    },
    {
      question: 'Do you offer multi-currency support?',
      answer: 'Yes, Renewly supports multiple currencies including INR, USD, EUR, GBP, and more. Set your preferred currency in Settings > Appearance > Currency.'
    },
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
        <h1 className="text-4xl font-bold text-foreground mb-3">Help Center</h1>
        <p className="text-muted-foreground mb-12">Find answers to common questions about Renewly</p>

        {/* FAQs */}
        <div className="space-y-4 mb-12">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group border border-border rounded-lg overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer hover:bg-secondary/30 transition-colors flex items-center justify-between font-medium text-foreground">
                {faq.question}
                <span className="text-gold group-open:rotate-180 transition-transform">▶</span>
              </summary>
              <div className="px-6 py-4 bg-secondary/10 text-foreground/80 border-t border-border">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 pt-8 border-t border-border">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6">
            We're here to help! Reach out to our support team.
          </p>
          <Link href="/contact" className="inline-block px-6 py-3 bg-gold text-obsidian font-semibold rounded-lg hover:bg-gold/90 transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
