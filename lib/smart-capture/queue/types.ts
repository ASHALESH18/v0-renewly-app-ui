/**
 * Queue Types for Smart Capture Automation
 * 
 * These types define the message structures used in the Redis-backed
 * processing queues for subscription detection automation.
 */

import type { CaptureSource } from '../types'

/**
 * Queue names for different processing stages
 */
export const QUEUE_NAMES = {
  EMAIL_INGESTION: 'smart-capture:email-ingestion',
  NOTIFICATION_INGESTION: 'smart-capture:notification-ingestion',
  CANDIDATE_PROCESSING: 'smart-capture:candidate-processing',
  WEBHOOK_EVENTS: 'smart-capture:webhook-events',
  DEAD_LETTER: 'smart-capture:dead-letter',
} as const

/**
 * Base message structure for all queue messages
 */
export interface BaseQueueMessage {
  id: string
  type: string
  userId: string
  timestamp: string
  retryCount: number
  maxRetries: number
  metadata?: Record<string, unknown>
}

/**
 * Email ingestion job - triggered by webhook or manual sync
 */
export interface EmailIngestionJob extends BaseQueueMessage {
  type: 'email_ingestion'
  provider: 'gmail' | 'outlook'
  accountId: string
  
  // For incremental sync
  historyId?: string // Gmail
  deltaLink?: string // Outlook
  
  // For specific message processing
  messageIds?: string[]
  
  // Mode
  mode: 'full_sync' | 'incremental' | 'specific_messages'
}

/**
 * Notification ingestion job - from mobile push notifications
 */
export interface NotificationIngestionJob extends BaseQueueMessage {
  type: 'notification_ingestion'
  
  // Notification data
  appName: string
  title: string
  body: string
  
  // Optional hints
  amount?: number
  currency?: string
  merchant?: string
  
  // Source info
  deviceId?: string
}

/**
 * Candidate processing job - for AI analysis of raw events
 */
export interface CandidateProcessingJob extends BaseQueueMessage {
  type: 'candidate_processing'
  
  // Reference to source event
  ingestionEventId: string
  source: CaptureSource
  
  // Raw content for analysis
  rawContent: {
    subject?: string
    body?: string
    sender?: string
    receivedAt?: string
    appName?: string
    notificationTitle?: string
    notificationBody?: string
  }
}

/**
 * Webhook event job - for processing incoming webhooks
 */
export interface WebhookEventJob extends BaseQueueMessage {
  type: 'webhook_event'
  provider: 'gmail' | 'outlook'
  
  // Webhook payload
  payload: Record<string, unknown>
  
  // Verification
  signature?: string
  verified: boolean
}

/**
 * Dead letter message - failed messages for inspection
 */
export interface DeadLetterMessage extends BaseQueueMessage {
  originalQueue: string
  originalMessage: BaseQueueMessage
  failureReason: string
  failedAt: string
}

/**
 * Union type of all job types
 */
export type QueueJob =
  | EmailIngestionJob
  | NotificationIngestionJob
  | CandidateProcessingJob
  | WebhookEventJob

/**
 * Job result status
 */
export type JobStatus = 'completed' | 'failed' | 'retrying'

/**
 * Job execution result
 */
export interface JobResult {
  jobId: string
  status: JobStatus
  result?: unknown
  error?: string
  processingTimeMs: number
  completedAt: string
}

/**
 * Queue statistics
 */
export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  deadLetter: number
}
