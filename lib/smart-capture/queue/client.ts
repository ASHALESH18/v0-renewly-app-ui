/**
 * Queue Client for Smart Capture
 * 
 * This provides a Redis-backed queue implementation for processing
 * subscription detection jobs. Uses Upstash Redis for serverless compatibility.
 * 
 * NOTE: This is a scaffolding file. To use in production:
 * 1. Add Upstash Redis integration via v0 settings
 * 2. The UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN will be auto-configured
 */

import { Redis } from '@upstash/redis'
import { v4 as uuidv4 } from 'uuid'
import type {
  QUEUE_NAMES,
  BaseQueueMessage,
  QueueJob,
  JobResult,
  DeadLetterMessage,
  QueueStats,
} from './types'

// Type for queue name values
type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]

// Initialize Redis client (will use env vars automatically)
const getRedis = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[smart-capture-queue] Redis not configured. Queue operations will be no-ops.')
    return null
  }
  
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

/**
 * Add a job to a queue
 */
export async function enqueue<T extends QueueJob>(
  queueName: QueueName,
  job: Omit<T, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
): Promise<string | null> {
  const redis = getRedis()
  if (!redis) return null

  const jobId = uuidv4()
  const fullJob: BaseQueueMessage = {
    ...job,
    id: jobId,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 3,
  }

  try {
    // Add to list (RPUSH for FIFO)
    await redis.rpush(queueName, JSON.stringify(fullJob))
    
    // Set expiry on the queue itself (30 days)
    await redis.expire(queueName, 60 * 60 * 24 * 30)

    console.log(`[smart-capture-queue] Enqueued job ${jobId} to ${queueName}`)
    return jobId
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to enqueue job:`, error)
    return null
  }
}

/**
 * Dequeue a job from a queue (blocking pop)
 */
export async function dequeue<T extends QueueJob>(
  queueName: QueueName,
  timeoutSeconds: number = 5
): Promise<T | null> {
  const redis = getRedis()
  if (!redis) return null

  try {
    // BLPOP for blocking dequeue
    const result = await redis.blpop<string>(queueName, timeoutSeconds)
    
    if (!result) return null
    
    const job = JSON.parse(result) as T
    console.log(`[smart-capture-queue] Dequeued job ${job.id} from ${queueName}`)
    return job
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to dequeue job:`, error)
    return null
  }
}

/**
 * Get queue length
 */
export async function getQueueLength(queueName: QueueName): Promise<number> {
  const redis = getRedis()
  if (!redis) return 0

  try {
    return await redis.llen(queueName)
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to get queue length:`, error)
    return 0
  }
}

/**
 * Move failed job to dead letter queue
 */
export async function moveToDeadLetter(
  originalQueue: QueueName,
  job: BaseQueueMessage,
  failureReason: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  const deadLetterMessage: DeadLetterMessage = {
    id: uuidv4(),
    type: 'dead_letter',
    userId: job.userId,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    maxRetries: 0,
    originalQueue,
    originalMessage: job,
    failureReason,
    failedAt: new Date().toISOString(),
  }

  try {
    await redis.rpush('smart-capture:dead-letter', JSON.stringify(deadLetterMessage))
    console.log(`[smart-capture-queue] Moved job ${job.id} to dead letter queue`)
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to move to dead letter:`, error)
  }
}

/**
 * Retry a failed job
 */
export async function retryJob<T extends QueueJob>(
  queueName: QueueName,
  job: T
): Promise<boolean> {
  if (job.retryCount >= job.maxRetries) {
    await moveToDeadLetter(queueName, job, 'Max retries exceeded')
    return false
  }

  const redis = getRedis()
  if (!redis) return false

  const retriedJob = {
    ...job,
    retryCount: job.retryCount + 1,
    timestamp: new Date().toISOString(),
  }

  try {
    await redis.rpush(queueName, JSON.stringify(retriedJob))
    console.log(`[smart-capture-queue] Retrying job ${job.id} (attempt ${retriedJob.retryCount}/${job.maxRetries})`)
    return true
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to retry job:`, error)
    return false
  }
}

/**
 * Store job result
 */
export async function storeResult(result: JobResult): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  const key = `smart-capture:result:${result.jobId}`

  try {
    await redis.setex(key, 60 * 60 * 24 * 7, JSON.stringify(result)) // 7 day expiry
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to store result:`, error)
  }
}

/**
 * Get job result
 */
export async function getResult(jobId: string): Promise<JobResult | null> {
  const redis = getRedis()
  if (!redis) return null

  const key = `smart-capture:result:${jobId}`

  try {
    const data = await redis.get<string>(key)
    if (!data) return null
    return JSON.parse(data)
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to get result:`, error)
    return null
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  const redis = getRedis()
  if (!redis) {
    return { pending: 0, processing: 0, completed: 0, failed: 0, deadLetter: 0 }
  }

  try {
    const [emailLen, notifLen, candidateLen, webhookLen, deadLetterLen] = await Promise.all([
      redis.llen('smart-capture:email-ingestion'),
      redis.llen('smart-capture:notification-ingestion'),
      redis.llen('smart-capture:candidate-processing'),
      redis.llen('smart-capture:webhook-events'),
      redis.llen('smart-capture:dead-letter'),
    ])

    return {
      pending: emailLen + notifLen + candidateLen + webhookLen,
      processing: 0, // Would need separate tracking
      completed: 0, // Would need separate counter
      failed: 0, // Would need separate counter
      deadLetter: deadLetterLen,
    }
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to get stats:`, error)
    return { pending: 0, processing: 0, completed: 0, failed: 0, deadLetter: 0 }
  }
}

/**
 * Clear a queue (use with caution!)
 */
export async function clearQueue(queueName: QueueName): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  try {
    await redis.del(queueName)
    console.log(`[smart-capture-queue] Cleared queue ${queueName}`)
  } catch (error) {
    console.error(`[smart-capture-queue] Failed to clear queue:`, error)
  }
}
