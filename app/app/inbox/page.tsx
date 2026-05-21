'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { InboxScreen } from '@/components/screens/inbox'
import { CandidateReviewSheet } from '@/components/screens/candidate-review'
import type { SubscriptionCandidate } from '@/lib/smart-capture/types'

function toDecisionModifications(modifications: any) {
  return {
    providerName: modifications.providerName,
    planName: modifications.planName || undefined,
    amount: modifications.amount ? Number(modifications.amount) : undefined,
    currency: modifications.currency || 'INR',
    billingCycle: modifications.billingCycle || 'monthly',
    category: modifications.category || 'Other',
    paymentMethod: modifications.paymentMethod || undefined,
    notes: modifications.notes || undefined,
  }
}

async function submitDecision(
  candidate: SubscriptionCandidate,
  action: 'confirm' | 'ignore' | 'already_tracked' | 'save_for_later',
  modifications?: any
) {
  const response = await fetch(`/api/smart-capture/candidates/${candidate.id}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      modifications: modifications ? toDecisionModifications(modifications) : undefined,
    }),
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error || 'Could not update candidate')
  }

  await Promise.all([
    mutate('/api/smart-capture/counts'),
    mutate((key) => typeof key === 'string' && key.startsWith('/api/smart-capture/candidates')),
  ])
}

export default function InboxPage() {
  const [reviewCandidate, setReviewCandidate] = useState<SubscriptionCandidate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeAfter = async (work: () => Promise<void>) => {
    setIsSubmitting(true)
    try {
      await work()
      setReviewCandidate(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <InboxScreen onReviewCandidate={setReviewCandidate} />

      <CandidateReviewSheet
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onClose={() => {
          if (!isSubmitting) setReviewCandidate(null)
        }}
        onConfirm={(candidate, modifications) => {
          void closeAfter(() => submitDecision(candidate, 'confirm', modifications))
        }}
        onIgnore={(candidate) => {
          void closeAfter(() => submitDecision(candidate, 'ignore'))
        }}
        onAlreadyTracked={(candidate) => {
          void closeAfter(() => submitDecision(candidate, 'already_tracked'))
        }}
        onSaveForLater={(candidate) => {
          void closeAfter(() => submitDecision(candidate, 'save_for_later'))
        }}
      />
    </>
  )
}
