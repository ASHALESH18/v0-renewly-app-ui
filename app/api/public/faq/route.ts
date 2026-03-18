import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // FAQ data is static and public, no auth needed
    const faqItems = [
      {
        question: 'How do I add a subscription?',
        answer: 'Click the "Add Subscription" button to get started. You can enter the subscription details manually or import them from your email.'
      },
      {
        question: 'Can I share subscriptions with family?',
        answer: 'Yes! Upgrade to the Family plan to share subscriptions with up to 4 family members.'
      },
      {
        question: 'What payment methods do you support?',
        answer: 'We support all major payment methods including credit cards, debit cards, and digital wallets.'
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes, we use enterprise-grade encryption and comply with GDPR and other privacy regulations.'
      },
      {
        question: 'Can I export my subscriptions?',
        answer: 'Yes, you can export your subscription list as CSV or JSON from the settings page.'
      },
    ]

    return NextResponse.json({ faqItems })
  } catch (error) {
    console.error('[v0] FAQ API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
