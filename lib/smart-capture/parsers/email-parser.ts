/**
 * Email Parser for Smart Capture
 * 
 * Analyzes email content to detect subscription-related information.
 * Uses pattern matching and heuristics to identify:
 * - Subscription receipts and confirmations
 * - Renewal notifications
 * - Trial ending notices
 * - Cancellation confirmations
 * - Price change alerts
 */

import type {
  SubscriptionCandidate,
  CandidateEvidence,
  ConfidenceLevel,
  CandidateTag,
  DetectedBillingCycle,
} from '../types'

/**
 * Known subscription providers and their email patterns
 */
const KNOWN_PROVIDERS: Record<string, {
  domains: string[]
  name: string
  logo?: string
  keywords: string[]
}> = {
  netflix: {
    domains: ['netflix.com', 'info@netflix.com'],
    name: 'Netflix',
    keywords: ['netflix', 'subscription', 'streaming'],
  },
  spotify: {
    domains: ['spotify.com', 'no-reply@spotify.com'],
    name: 'Spotify',
    keywords: ['spotify', 'premium', 'music'],
  },
  amazon_prime: {
    domains: ['amazon.com', 'amazon.in', 'prime@amazon'],
    name: 'Amazon Prime',
    keywords: ['amazon prime', 'prime membership'],
  },
  youtube_premium: {
    domains: ['google.com', 'youtube.com'],
    name: 'YouTube Premium',
    keywords: ['youtube premium', 'youtube music'],
  },
  apple: {
    domains: ['apple.com', 'email.apple.com'],
    name: 'Apple',
    keywords: ['icloud', 'apple music', 'apple one', 'apple tv'],
  },
  microsoft: {
    domains: ['microsoft.com', 'office.com'],
    name: 'Microsoft 365',
    keywords: ['microsoft 365', 'office 365', 'xbox'],
  },
  adobe: {
    domains: ['adobe.com', 'mail.adobe.com'],
    name: 'Adobe',
    keywords: ['creative cloud', 'adobe', 'photoshop'],
  },
  disney: {
    domains: ['disneyplus.com', 'hotstar.com'],
    name: 'Disney+ / Hotstar',
    keywords: ['disney+', 'hotstar', 'disney plus'],
  },
  dropbox: {
    domains: ['dropbox.com', 'dropboxmail.com'],
    name: 'Dropbox',
    keywords: ['dropbox', 'cloud storage'],
  },
  notion: {
    domains: ['notion.so', 'mail.notion.so'],
    name: 'Notion',
    keywords: ['notion', 'workspace'],
  },
}

/**
 * Amount extraction patterns for different currencies
 */
const AMOUNT_PATTERNS = [
  // INR formats
  { pattern: /(?:Rs\.?|INR|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/gi, currency: 'INR' },
  { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rupees?)/gi, currency: 'INR' },
  
  // USD formats
  { pattern: /(?:USD|\$)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/gi, currency: 'USD' },
  { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:dollars?)/gi, currency: 'USD' },
  
  // EUR formats
  { pattern: /(?:EUR|€)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/gi, currency: 'EUR' },
  { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:euros?)/gi, currency: 'EUR' },
  
  // GBP formats
  { pattern: /(?:GBP|£)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/gi, currency: 'GBP' },
  { pattern: /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:pounds?)/gi, currency: 'GBP' },
]

/**
 * Billing cycle detection patterns
 */
const BILLING_CYCLE_PATTERNS: { pattern: RegExp; cycle: DetectedBillingCycle }[] = [
  { pattern: /\b(?:daily|per day)\b/i, cycle: 'daily' },
  { pattern: /\b(?:weekly|per week|every week)\b/i, cycle: 'weekly' },
  { pattern: /\b(?:monthly|per month|every month|\/month|\/mo)\b/i, cycle: 'monthly' },
  { pattern: /\b(?:quarterly|every 3 months|per quarter)\b/i, cycle: 'quarterly' },
  { pattern: /\b(?:yearly|annual|per year|every year|\/year|\/yr)\b/i, cycle: 'yearly' },
]

/**
 * Tag detection patterns
 */
const TAG_PATTERNS: { pattern: RegExp; tag: CandidateTag }[] = [
  { pattern: /\b(?:trial|free trial|trial period|trial ends?)\b/i, tag: 'trial' },
  { pattern: /\b(?:renewed?|renewal|auto.?renew)\b/i, tag: 'renewal' },
  { pattern: /\b(?:cancel|cancelled|cancellation)\b/i, tag: 'cancellation' },
  { pattern: /\b(?:price change|price increase|new price|updated price)\b/i, tag: 'price_change' },
  { pattern: /\b(?:first payment|initial payment|started|welcome)\b/i, tag: 'first_payment' },
]

/**
 * Subscription-related keywords that indicate this is a subscription email
 */
const SUBSCRIPTION_KEYWORDS = [
  'subscription', 'subscribed', 'subscriber',
  'membership', 'member',
  'renewal', 'renewed', 'renew',
  'payment', 'charged', 'billing',
  'trial', 'free trial',
  'cancel', 'cancellation',
  'receipt', 'invoice',
  'premium', 'pro plan', 'plus plan',
]

/**
 * Parse email content and extract subscription candidate data
 */
export function parseEmail(
  subject: string,
  body: string,
  sender: string,
  receivedAt: Date
): Partial<SubscriptionCandidate> | null {
  const combinedText = `${subject} ${body}`.toLowerCase()
  
  // Check if this is likely a subscription email
  const isSubscriptionEmail = SUBSCRIPTION_KEYWORDS.some(kw => 
    combinedText.includes(kw.toLowerCase())
  )
  
  if (!isSubscriptionEmail) {
    return null
  }

  // Detect provider
  const provider = detectProvider(sender, combinedText)
  
  // Extract amount and currency
  const amountInfo = extractAmount(combinedText)
  
  // Detect billing cycle
  const billingCycle = detectBillingCycle(combinedText)
  
  // Detect tags
  const tags = detectTags(combinedText)
  
  // Build evidence
  const evidence = buildEvidence(subject, body, sender, provider, amountInfo)
  
  // Calculate confidence
  const { score, level } = calculateConfidence(provider, amountInfo, billingCycle, tags, evidence)

  return {
    providerName: provider?.name || extractUnknownProvider(subject, sender),
    providerLogo: provider?.logo,
    amount: amountInfo?.amount,
    currency: amountInfo?.currency || 'INR',
    billingCycle,
    confidenceScore: score,
    confidenceLevel: level,
    evidenceSnippet: extractSnippet(subject, body),
    evidenceDetails: evidence,
    tags,
    detectedAt: new Date(),
  }
}

/**
 * Detect provider from sender and content
 */
function detectProvider(sender: string, text: string) {
  const senderLower = sender.toLowerCase()
  const textLower = text.toLowerCase()

  for (const [key, provider] of Object.entries(KNOWN_PROVIDERS)) {
    // Check sender domain
    if (provider.domains.some(d => senderLower.includes(d))) {
      return provider
    }
    
    // Check keywords in text
    if (provider.keywords.some(kw => textLower.includes(kw))) {
      return provider
    }
  }

  return null
}

/**
 * Extract amount from text
 */
function extractAmount(text: string): { amount: number; currency: string } | null {
  for (const { pattern, currency } of AMOUNT_PATTERNS) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(amount) && amount > 0) {
        return { amount, currency }
      }
    }
  }
  return null
}

/**
 * Detect billing cycle from text
 */
function detectBillingCycle(text: string): DetectedBillingCycle {
  for (const { pattern, cycle } of BILLING_CYCLE_PATTERNS) {
    if (pattern.test(text)) {
      return cycle
    }
  }
  return 'unknown'
}

/**
 * Detect tags from text
 */
function detectTags(text: string): CandidateTag[] {
  const tags: CandidateTag[] = []
  
  for (const { pattern, tag } of TAG_PATTERNS) {
    if (pattern.test(text)) {
      tags.push(tag)
    }
  }
  
  return [...new Set(tags)] // Remove duplicates
}

/**
 * Build evidence array
 */
function buildEvidence(
  subject: string,
  body: string,
  sender: string,
  provider: typeof KNOWN_PROVIDERS[string] | null,
  amountInfo: { amount: number; currency: string } | null
): CandidateEvidence[] {
  const evidence: CandidateEvidence[] = []

  // Sender evidence
  evidence.push({
    type: 'sender',
    label: 'From',
    value: sender,
    confidence: provider ? 95 : 50,
  })

  // Subject evidence
  evidence.push({
    type: 'subject',
    label: 'Subject',
    value: subject,
    confidence: 80,
  })

  // Amount evidence if found
  if (amountInfo) {
    const symbol = amountInfo.currency === 'INR' ? 'Rs' : 
                   amountInfo.currency === 'USD' ? '$' :
                   amountInfo.currency === 'EUR' ? '€' : 
                   amountInfo.currency === 'GBP' ? '£' : amountInfo.currency
    evidence.push({
      type: 'amount',
      label: 'Amount',
      value: `${symbol} ${amountInfo.amount.toLocaleString()}`,
      confidence: 90,
    })
  }

  return evidence
}

/**
 * Calculate confidence score and level
 */
function calculateConfidence(
  provider: typeof KNOWN_PROVIDERS[string] | null,
  amountInfo: { amount: number; currency: string } | null,
  billingCycle: DetectedBillingCycle,
  tags: CandidateTag[],
  evidence: CandidateEvidence[]
): { score: number; level: ConfidenceLevel } {
  let score = 20 // Base score

  // Known provider boost
  if (provider) score += 35

  // Amount detected boost
  if (amountInfo) score += 25

  // Billing cycle detected boost
  if (billingCycle !== 'unknown') score += 10

  // Tags boost
  if (tags.length > 0) score += tags.length * 5

  // Evidence quality boost
  const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
  score += Math.floor(avgConfidence / 10)

  // Cap at 98
  score = Math.min(score, 98)

  // Determine level
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low'

  return { score, level }
}

/**
 * Extract snippet for display
 */
function extractSnippet(subject: string, body: string): string {
  // Prefer subject if it's informative
  if (subject.length > 20 && subject.length <= 100) {
    return subject
  }

  // Extract first meaningful sentence from body
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    const snippet = sentences[0].trim()
    return snippet.length > 150 ? snippet.substring(0, 147) + '...' : snippet
  }

  return subject
}

/**
 * Extract provider name from unknown sender/subject
 */
function extractUnknownProvider(subject: string, sender: string): string {
  // Try to extract from sender email
  const emailMatch = sender.match(/@([^.]+)\./)
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1].charAt(0).toUpperCase() + emailMatch[1].slice(1)
  }

  // Try to extract from subject (first capitalized word)
  const words = subject.split(/\s+/)
  for (const word of words) {
    if (word.length > 2 && /^[A-Z]/.test(word)) {
      return word
    }
  }

  return 'Unknown Service'
}
