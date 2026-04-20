/**
 * Smart Capture Types
 * Types and interfaces for the subscription candidate detection and automation system
 */

// Source types for ingestion
export type CaptureSource = 'gmail' | 'outlook' | 'notification_lab' | 'manual'

// Candidate status through the review pipeline
export type CandidateStatus = 
  | 'new'           // Just detected, awaiting review
  | 'review_needed' // Flagged for manual review (low confidence, etc.)
  | 'added'         // Confirmed and added as subscription
  | 'ignored'       // User chose to ignore
  | 'error'         // Processing error

// Confidence level for detection
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// Tags that can be applied to candidates
export type CandidateTag = 
  | 'trial'
  | 'renewal'
  | 'cancellation'
  | 'price_change'
  | 'duplicate'
  | 'first_payment'

// Billing cycle detection
export type DetectedBillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'unknown'

/**
 * Connected account for email/notification integration
 */
export interface ConnectedAccount {
  id: string
  userId: string
  provider: 'gmail' | 'outlook'
  email: string
  status: 'active' | 'expired' | 'error' | 'pending'
  lastSync: Date | null
  webhookStatus: 'active' | 'inactive' | 'error'
  syncHealth: 'healthy' | 'degraded' | 'unhealthy'
  createdAt: Date
  updatedAt: Date
}

/**
 * Raw ingestion event from email/notification sources
 */
export interface IngestionEvent {
  id: string
  source: CaptureSource
  sourceEventId?: string // External ID from source system
  userId: string
  
  // Raw event data
  subject?: string
  body?: string
  sender?: string
  receivedAt: Date
  
  // For notification lab
  appName?: string
  title?: string
  notificationBody?: string
  
  // Processing state
  status: 'queued' | 'processing' | 'processed' | 'failed'
  processedAt?: Date
  candidateId?: string // Link to created candidate
  errorMessage?: string
  
  createdAt: Date
}

/**
 * Subscription candidate detected from ingestion
 */
export interface SubscriptionCandidate {
  id: string
  userId: string
  
  // Source tracking
  source: CaptureSource
  sourceEventId?: string
  ingestionEventId: string
  
  // Detected subscription details
  providerName: string
  providerLogo?: string
  planName?: string
  amount?: number
  currency?: string
  billingCycle: DetectedBillingCycle
  
  // Detection metadata
  confidenceScore: number // 0-100
  confidenceLevel: ConfidenceLevel
  status: CandidateStatus
  
  // Evidence and context
  evidenceSnippet?: string
  evidenceDetails?: CandidateEvidence[]
  
  // Special detections
  tags: CandidateTag[]
  trialInfo?: TrialInfo
  renewalInfo?: RenewalInfo
  
  // Duplicate detection
  possibleDuplicateId?: string
  possibleDuplicateName?: string
  
  // Timestamps
  detectedAt: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Evidence supporting candidate detection
 */
export interface CandidateEvidence {
  type: 'subject' | 'body' | 'sender' | 'amount' | 'date' | 'notification'
  label: string
  value: string
  confidence: number
}

/**
 * Trial information if detected
 */
export interface TrialInfo {
  startDate?: Date
  endDate?: Date
  daysRemaining?: number
  autoRenews: boolean
}

/**
 * Renewal information if detected
 */
export interface RenewalInfo {
  nextRenewalDate?: Date
  lastRenewalDate?: Date
  wasAutoRenewed: boolean
}

/**
 * Decision made on a candidate
 */
export interface CandidateDecision {
  id: string
  candidateId: string
  userId: string
  action: 'confirm' | 'ignore' | 'already_tracked' | 'save_for_later' | 'retry'
  
  // If confirmed, link to created subscription
  subscriptionId?: string
  
  // User modifications before confirm
  modifications?: {
    providerName?: string
    planName?: string
    amount?: number
    currency?: string
    billingCycle?: DetectedBillingCycle
    category?: string
    paymentMethod?: string
    notes?: string
  }
  
  createdAt: Date
}

/**
 * Sync state for connected accounts
 */
export interface SyncState {
  accountId: string
  provider: 'gmail' | 'outlook'
  
  // Sync progress
  lastSyncStarted?: Date
  lastSyncCompleted?: Date
  lastSyncError?: string
  
  // Cursors for incremental sync
  historyId?: string // Gmail
  deltaLink?: string // Outlook
  
  // Stats
  messagesProcessed: number
  candidatesCreated: number
  errorsCount: number
  
  // Health
  consecutiveFailures: number
  isHealthy: boolean
}

/**
 * Notification Lab test event
 */
export interface NotificationLabEvent {
  id: string
  userId: string
  
  // Simulated notification data
  appName: string
  title: string
  body: string
  timestamp: Date
  
  // Optional hints
  amount?: number
  currency?: string
  merchant?: string
  
  // Processing state
  status: 'queued' | 'processing' | 'candidate_created' | 'failed'
  candidateId?: string
  errorMessage?: string
  
  createdAt: Date
}

/**
 * Integration card display info
 */
export interface IntegrationInfo {
  id: string
  name: string
  description: string
  icon: string
  
  // Connection state
  isConnected: boolean
  account?: ConnectedAccount
  
  // Health
  lastSync?: Date
  syncHealth?: 'healthy' | 'degraded' | 'unhealthy'
  webhookStatus?: 'active' | 'inactive' | 'error'
  
  // Actions
  canConnect: boolean
  canReconnect: boolean
  canRescan: boolean
  canPause: boolean
}

/**
 * Inbox filter state
 */
export interface InboxFilters {
  status: CandidateStatus | 'all'
  source: CaptureSource | 'all'
  confidence: ConfidenceLevel | 'all'
  tags: CandidateTag[]
  search: string
}

/**
 * Inbox tab counts
 */
export interface InboxCounts {
  new: number
  reviewNeeded: number
  added: number
  ignored: number
  errors: number
  total: number
}
