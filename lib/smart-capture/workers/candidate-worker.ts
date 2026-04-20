/**
 * Candidate Processing Worker
 * 
 * This worker processes raw ingestion events and creates subscription candidates.
 * It runs as a background job, typically triggered by a cron or queue consumer.
 * 
 * In production, this would be deployed as:
 * - A Vercel cron function
 * - A queue consumer with Upstash QStash
 * - A long-running worker on a separate service
 */

import { createClient } from '@/lib/supabase/server'
import { parseEmail } from '../parsers/email-parser'
import { dequeue, retryJob, storeResult, moveToDeadLetter } from '../queue/client'
import { QUEUE_NAMES, type CandidateProcessingJob, type JobResult } from '../queue/types'

/**
 * Process a single candidate processing job
 */
export async function processCandidateJob(job: CandidateProcessingJob): Promise<JobResult> {
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Fetch the ingestion event
    const { data: event, error: fetchError } = await supabase
      .from('ingestion_events')
      .select('*')
      .eq('id', job.ingestionEventId)
      .single()

    if (fetchError || !event) {
      throw new Error(`Ingestion event not found: ${job.ingestionEventId}`)
    }

    // Parse based on source type
    let candidateData = null

    if (job.source === 'gmail' || job.source === 'outlook') {
      candidateData = parseEmail(
        job.rawContent.subject || '',
        job.rawContent.body || '',
        job.rawContent.sender || '',
        new Date(job.rawContent.receivedAt || Date.now())
      )
    } else if (job.source === 'notification_lab') {
      // Simplified parsing for notifications
      candidateData = {
        providerName: job.rawContent.appName || 'Unknown',
        evidenceSnippet: `${job.rawContent.notificationTitle}: ${job.rawContent.notificationBody}`,
        confidenceScore: 50,
        confidenceLevel: 'medium' as const,
        billingCycle: 'unknown' as const,
        tags: [],
        detectedAt: new Date(),
      }
    }

    if (!candidateData) {
      // Mark event as processed but no candidate created
      await supabase
        .from('ingestion_events')
        .update({
          status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', job.ingestionEventId)

      return {
        jobId: job.id,
        status: 'completed',
        result: { candidateCreated: false, reason: 'Not a subscription email' },
        processingTimeMs: Date.now() - startTime,
        completedAt: new Date().toISOString(),
      }
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicates(
      supabase,
      job.userId,
      candidateData.providerName || ''
    )

    // Create candidate
    const { data: candidate, error: createError } = await supabase
      .from('subscription_candidates')
      .insert({
        user_id: job.userId,
        source: job.source,
        ingestion_event_id: job.ingestionEventId,
        provider_name: candidateData.providerName,
        provider_logo: candidateData.providerLogo,
        amount: candidateData.amount,
        currency: candidateData.currency || 'INR',
        billing_cycle: candidateData.billingCycle,
        confidence_score: candidateData.confidenceScore,
        confidence_level: candidateData.confidenceLevel,
        status: candidateData.confidenceLevel === 'low' ? 'review_needed' : 'new',
        evidence_snippet: candidateData.evidenceSnippet,
        evidence_details: candidateData.evidenceDetails,
        tags: candidateData.tags,
        possible_duplicate_id: duplicateCheck?.duplicateId,
        possible_duplicate_name: duplicateCheck?.duplicateName,
        detected_at: candidateData.detectedAt?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create candidate: ${createError.message}`)
    }

    // Update ingestion event
    await supabase
      .from('ingestion_events')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        candidate_id: candidate.id,
      })
      .eq('id', job.ingestionEventId)

    return {
      jobId: job.id,
      status: 'completed',
      result: { candidateCreated: true, candidateId: candidate.id },
      processingTimeMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error(`[candidate-worker] Error processing job ${job.id}:`, error)

    return {
      jobId: job.id,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: Date.now() - startTime,
      completedAt: new Date().toISOString(),
    }
  }
}

/**
 * Check for duplicate subscriptions
 */
async function checkForDuplicates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  providerName: string
): Promise<{ duplicateId: string; duplicateName: string } | null> {
  if (!providerName) return null

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, name')
    .eq('user_id', userId)
    .ilike('name', `%${providerName}%`)
    .limit(1)

  if (existing && existing.length > 0) {
    return {
      duplicateId: existing[0].id,
      duplicateName: existing[0].name,
    }
  }

  return null
}

/**
 * Worker loop - process jobs from queue
 * 
 * This would be called by a cron job or long-running process
 */
export async function runWorkerLoop(maxIterations: number = 100): Promise<void> {
  console.log('[candidate-worker] Starting worker loop')
  
  let iterations = 0

  while (iterations < maxIterations) {
    iterations++

    const job = await dequeue<CandidateProcessingJob>(
      QUEUE_NAMES.CANDIDATE_PROCESSING,
      5 // 5 second timeout
    )

    if (!job) {
      // No jobs available, wait a bit
      await new Promise(r => setTimeout(r, 1000))
      continue
    }

    const result = await processCandidateJob(job)
    await storeResult(result)

    if (result.status === 'failed') {
      const retried = await retryJob(QUEUE_NAMES.CANDIDATE_PROCESSING, job)
      if (!retried) {
        console.log(`[candidate-worker] Job ${job.id} failed permanently`)
      }
    }
  }

  console.log(`[candidate-worker] Worker loop completed (${iterations} iterations)`)
}

/**
 * Process a single job inline (for immediate processing)
 */
export async function processJobInline(job: CandidateProcessingJob): Promise<JobResult> {
  const result = await processCandidateJob(job)
  await storeResult(result)
  return result
}
