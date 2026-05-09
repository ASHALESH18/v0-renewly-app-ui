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
        question: 'How does the Renewly Family plan work?',
        answer: 'The Renewly Family plan includes an owner + 4 invited members with shared renewal tracking, unified reminders, and household visibility. Add up to 4 extra members for +₹99/month or +$1.49/month each per member. Maximum owner + 8 invited members.'
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
