export type SubscriptionStatus = 'active' | 'paused' | 'unused' | 'cancelled'
export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionCategory =
  | 'Streaming'
  | 'Music'
  | 'Productivity'
  | 'Cloud & Storage'
  | 'AI & Tools'
  | 'Fitness'
  | 'News & Media'
  | 'Gaming'
  | 'Utilities'
  | 'Services'
  | 'Home Services' // legacy
  | 'Finance'
  | 'Shopping'
  | 'Education'
  | 'Security'
  | 'Other'
  | string // Allow custom categories

export interface Subscription {
  id: string
  name: string
  category: SubscriptionCategory
  amount: number
  currency: string
  billingCycle: BillingCycle
  status: SubscriptionStatus
  renewalDate?: string
  description?: string
  logo?: string
  color?: string
}

export interface Notification {
  id: string
  type: 'renewal' | 'leak' | 'price_change' | 'insight' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
}
