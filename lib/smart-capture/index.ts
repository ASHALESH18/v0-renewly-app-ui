/**
 * Smart Capture Module
 * 
 * Exports for the subscription detection automation system.
 */

// Types
export * from './types'

// Mock data (for development)
export * from './mock-data'

// Queue types and client
export { QUEUE_NAMES } from './queue/types'
export type {
  BaseQueueMessage,
  EmailIngestionJob,
  NotificationIngestionJob,
  CandidateProcessingJob,
  WebhookEventJob,
  DeadLetterMessage,
  QueueJob,
  JobResult,
  QueueStats,
} from './queue/types'

export {
  enqueue,
  dequeue,
  getQueueLength,
  moveToDeadLetter,
  retryJob,
  storeResult,
  getResult,
  getQueueStats,
  clearQueue,
} from './queue/client'

// Parsers
export { parseEmail } from './parsers/email-parser'

// Workers
export {
  processCandidateJob,
  runWorkerLoop,
  processJobInline,
} from './workers/candidate-worker'
