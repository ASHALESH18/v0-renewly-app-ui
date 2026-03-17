export type SubscriptionStatus = 'active' | 'paused' | 'unused' | 'cancelled'
export type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type SubscriptionCategory = 
  | 'Entertainment' 
  | 'Music' 
  | 'Productivity' 
  | 'Storage' 
  | 'AI & Tools' 
  | 'Fitness'
  | 'News & Magazines'
  | 'Office'
  | 'Other'

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
