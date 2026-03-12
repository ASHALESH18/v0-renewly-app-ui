// Renewly Mock Data - Realistic Indian User Context
// Version 1.0

export interface Subscription {
  id: string
  name: string
  logo: string
  category: SubscriptionCategory
  amount: number
  currency: string
  billingCycle: 'monthly' | 'yearly' | 'weekly' | 'quarterly'
  nextRenewal: string
  paymentMethod: string
  autoRenew: boolean
  color: string
  isShared?: boolean
  sharedWith?: number
  notes?: string
}

export type SubscriptionCategory = 
  | 'Entertainment'
  | 'Productivity'
  | 'Storage'
  | 'Music'
  | 'Fitness'
  | 'Utilities'
  | 'AI & Tools'
  | 'News & Media'
  | 'Shopping'
  | 'Education'

export const subscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    logo: 'N',
    category: 'Entertainment',
    amount: 649,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-03-18',
    paymentMethod: 'HDFC •••• 4521',
    autoRenew: true,
    color: '#E50914',
    isShared: true,
    sharedWith: 4,
  },
  {
    id: '2',
    name: 'Spotify Premium',
    logo: 'S',
    category: 'Music',
    amount: 119,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-03-22',
    paymentMethod: 'ICICI •••• 8834',
    autoRenew: true,
    color: '#1DB954',
  },
  {
    id: '3',
    name: 'Prime Video',
    logo: 'P',
    category: 'Entertainment',
    amount: 1499,
    currency: '₹',
    billingCycle: 'yearly',
    nextRenewal: '2026-08-15',
    paymentMethod: 'Amazon Pay',
    autoRenew: true,
    color: '#00A8E1',
    notes: 'Includes Prime delivery benefits',
  },
  {
    id: '4',
    name: 'ChatGPT Plus',
    logo: 'G',
    category: 'AI & Tools',
    amount: 1680,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-03-25',
    paymentMethod: 'HDFC •••• 4521',
    autoRenew: true,
    color: '#10A37F',
  },
  {
    id: '5',
    name: 'Canva Pro',
    logo: 'C',
    category: 'Productivity',
    amount: 3999,
    currency: '₹',
    billingCycle: 'yearly',
    nextRenewal: '2026-11-01',
    paymentMethod: 'Razorpay',
    autoRenew: true,
    color: '#00C4CC',
  },
  {
    id: '6',
    name: 'Google One',
    logo: 'G',
    category: 'Storage',
    amount: 1300,
    currency: '₹',
    billingCycle: 'yearly',
    nextRenewal: '2026-06-20',
    paymentMethod: 'Google Pay',
    autoRenew: true,
    color: '#4285F4',
    notes: '200GB storage plan',
  },
  {
    id: '7',
    name: 'Apple Music',
    logo: 'A',
    category: 'Music',
    amount: 99,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-03-28',
    paymentMethod: 'Apple Pay',
    autoRenew: true,
    color: '#FC3C44',
  },
  {
    id: '8',
    name: 'Cult.fit',
    logo: 'C',
    category: 'Fitness',
    amount: 1499,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-04-01',
    paymentMethod: 'Paytm',
    autoRenew: false,
    color: '#FF6B6B',
    notes: 'Elite membership - gym + classes',
  },
  {
    id: '9',
    name: 'Jio Fiber',
    logo: 'J',
    category: 'Utilities',
    amount: 999,
    currency: '₹',
    billingCycle: 'monthly',
    nextRenewal: '2026-03-15',
    paymentMethod: 'Auto-debit SBI',
    autoRenew: true,
    color: '#0A3D91',
    notes: '150 Mbps unlimited',
  },
]

export interface LeakReport {
  leakScore: number
  monthlySpend: number
  yearlyProjected: number
  activeSubscriptions: number
  topCategory: string
  topCategoryAmount: number
  possibleSavings: number
  observations: string[]
  unusedSubscriptions: string[]
  duplicateCategories: string[]
}

export const leakReport: LeakReport = {
  leakScore: 72,
  monthlySpend: 7644,
  yearlyProjected: 91728,
  activeSubscriptions: 9,
  topCategory: 'Entertainment',
  topCategoryAmount: 2148,
  possibleSavings: 2398,
  observations: [
    'You have 2 music streaming services with overlapping features.',
    'Cult.fit membership has low usage in the past 30 days.',
    'Consider annual plans for Netflix and Spotify to save ₹1,200/year.',
    'Your AI tools spending has increased 40% this quarter.',
  ],
  unusedSubscriptions: ['Cult.fit', 'Apple Music'],
  duplicateCategories: ['Music'],
}

export interface UserProfile {
  name: string
  email: string
  avatar: string
  memberSince: string
  plan: 'Free' | 'Pro'
  currency: string
  notificationsEnabled: boolean
  reminderDays: number
}

export const userProfile: UserProfile = {
  name: 'Arjun Mehta',
  email: 'arjun.mehta@gmail.com',
  avatar: 'AM',
  memberSince: '2025-06-15',
  plan: 'Pro',
  currency: '₹',
  notificationsEnabled: true,
  reminderDays: 3,
}

export interface Notification {
  id: string
  type: 'renewal' | 'alert' | 'insight' | 'success'
  title: string
  message: string
  timestamp: string
  read: boolean
  subscriptionId?: string
}

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'renewal',
    title: 'Jio Fiber renewing tomorrow',
    message: '₹999 will be charged to your SBI account',
    timestamp: '2026-03-14T10:00:00',
    read: false,
    subscriptionId: '9',
  },
  {
    id: '2',
    type: 'alert',
    title: 'Potential duplicate detected',
    message: 'You have both Spotify and Apple Music subscriptions',
    timestamp: '2026-03-13T14:30:00',
    read: false,
  },
  {
    id: '3',
    type: 'insight',
    title: 'Monthly report ready',
    message: 'Your March Leak Report shows 15% improvement',
    timestamp: '2026-03-12T09:00:00',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Subscription cancelled',
    message: 'Hotstar has been successfully cancelled',
    timestamp: '2026-03-10T16:45:00',
    read: true,
  },
]

export interface CalendarEvent {
  date: string
  subscriptions: {
    id: string
    name: string
    amount: number
    currency: string
  }[]
}

export const calendarEvents: CalendarEvent[] = [
  {
    date: '2026-03-15',
    subscriptions: [{ id: '9', name: 'Jio Fiber', amount: 999, currency: '₹' }],
  },
  {
    date: '2026-03-18',
    subscriptions: [{ id: '1', name: 'Netflix', amount: 649, currency: '₹' }],
  },
  {
    date: '2026-03-22',
    subscriptions: [{ id: '2', name: 'Spotify Premium', amount: 119, currency: '₹' }],
  },
  {
    date: '2026-03-25',
    subscriptions: [{ id: '4', name: 'ChatGPT Plus', amount: 1680, currency: '₹' }],
  },
  {
    date: '2026-03-28',
    subscriptions: [{ id: '7', name: 'Apple Music', amount: 99, currency: '₹' }],
  },
  {
    date: '2026-04-01',
    subscriptions: [{ id: '8', name: 'Cult.fit', amount: 1499, currency: '₹' }],
  },
]

export const categories: SubscriptionCategory[] = [
  'Entertainment',
  'Productivity',
  'Storage',
  'Music',
  'Fitness',
  'Utilities',
  'AI & Tools',
  'News & Media',
  'Shopping',
  'Education',
]

export const paymentMethods = [
  'HDFC •••• 4521',
  'ICICI •••• 8834',
  'SBI •••• 2210',
  'Amazon Pay',
  'Google Pay',
  'Apple Pay',
  'Paytm',
  'Razorpay',
  'PhonePe',
]

export const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    currency: '₹',
    period: 'forever',
    features: [
      'Track up to 10 subscriptions',
      'Basic renewal reminders',
      'Monthly spend overview',
      'Manual entry only',
    ],
    limitations: [
      'No Leak Report',
      'No analytics',
      'No export features',
    ],
  },
  {
    name: 'Pro',
    price: 299,
    currency: '₹',
    period: 'month',
    yearlyPrice: 2499,
    features: [
      'Unlimited subscriptions',
      'Advanced analytics & insights',
      'Signature Leak Report',
      'Smart AI observations',
      'Export to CSV & PDF',
      'Multiple currencies',
      'Priority support',
      'Bank sync (coming soon)',
    ],
    popular: true,
  },
]

// Analytics data for charts
export const monthlySpendData = [
  { month: 'Oct', amount: 6890 },
  { month: 'Nov', amount: 7234 },
  { month: 'Dec', amount: 8567 },
  { month: 'Jan', amount: 7890 },
  { month: 'Feb', amount: 7456 },
  { month: 'Mar', amount: 7644 },
]

export const categoryBreakdown = [
  { category: 'Entertainment', amount: 2148, percentage: 28 },
  { category: 'AI & Tools', amount: 1680, percentage: 22 },
  { category: 'Fitness', amount: 1499, percentage: 20 },
  { category: 'Utilities', amount: 999, percentage: 13 },
  { category: 'Music', amount: 218, percentage: 3 },
  { category: 'Storage', amount: 108, percentage: 1 },
  { category: 'Productivity', amount: 333, percentage: 4 },
]

export const popularServices = [
  { id: 'netflix', name: 'Netflix', logo: 'N', color: '#E50914', category: 'Entertainment' as SubscriptionCategory },
  { id: 'spotify', name: 'Spotify', logo: 'S', color: '#1DB954', category: 'Music' as SubscriptionCategory },
  { id: 'prime', name: 'Amazon Prime', logo: 'P', color: '#00A8E1', category: 'Entertainment' as SubscriptionCategory },
  { id: 'youtube', name: 'YouTube Premium', logo: 'Y', color: '#FF0000', category: 'Entertainment' as SubscriptionCategory },
  { id: 'chatgpt', name: 'ChatGPT Plus', logo: 'G', color: '#10A37F', category: 'AI & Tools' as SubscriptionCategory },
  { id: 'disney', name: 'Disney+ Hotstar', logo: 'D', color: '#113CCF', category: 'Entertainment' as SubscriptionCategory },
  { id: 'apple-music', name: 'Apple Music', logo: 'A', color: '#FC3C44', category: 'Music' as SubscriptionCategory },
  { id: 'google-one', name: 'Google One', logo: 'G', color: '#4285F4', category: 'Storage' as SubscriptionCategory },
  { id: 'notion', name: 'Notion', logo: 'N', color: '#000000', category: 'Productivity' as SubscriptionCategory },
  { id: 'figma', name: 'Figma', logo: 'F', color: '#F24E1E', category: 'Productivity' as SubscriptionCategory },
  { id: 'canva', name: 'Canva Pro', logo: 'C', color: '#00C4CC', category: 'Productivity' as SubscriptionCategory },
  { id: 'cultfit', name: 'Cult.fit', logo: 'C', color: '#FF6B6B', category: 'Fitness' as SubscriptionCategory },
  { id: 'zee5', name: 'ZEE5', logo: 'Z', color: '#8230C6', category: 'Entertainment' as SubscriptionCategory },
  { id: 'jio', name: 'JioCinema', logo: 'J', color: '#E60000', category: 'Entertainment' as SubscriptionCategory },
  { id: 'linkedin', name: 'LinkedIn Premium', logo: 'in', color: '#0A66C2', category: 'Productivity' as SubscriptionCategory },
  { id: 'dropbox', name: 'Dropbox', logo: 'D', color: '#0061FF', category: 'Storage' as SubscriptionCategory },
]

export const faqItems = [
  {
    question: 'How does Renewly track my subscriptions?',
    answer: 'Renewly allows you to manually add your subscriptions with all relevant details. Our upcoming bank sync feature will automatically detect recurring payments from your linked accounts.',
  },
  {
    question: 'What is the Leak Report?',
    answer: 'The Leak Report is our signature feature that analyzes your subscription portfolio to identify potential savings, unused services, and duplicate categories. It provides a comprehensive score and actionable insights.',
  },
  {
    question: 'Is my financial data secure?',
    answer: 'Absolutely. We use bank-grade encryption and never store your actual bank credentials. Your data is encrypted at rest and in transit, and we are SOC 2 Type II compliant.',
  },
  {
    question: 'Can I share my subscriptions with family members?',
    answer: 'Yes, Pro users can mark subscriptions as shared and track which services are split across family members or roommates.',
  },
  {
    question: 'How do renewal reminders work?',
    answer: 'You can set custom reminder days for each subscription. We\'ll send you notifications via the app and email before each renewal date.',
  },
]
