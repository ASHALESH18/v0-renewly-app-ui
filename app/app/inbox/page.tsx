'use client'

import { useState } from 'react'
import { InboxScreen } from '@/components/screens/inbox'
import { CandidateReviewSheet } from '@/components/screens/candidate-review'
import type { SubscriptionCandidate } from '@/lib/smart-capture/types'

export default function InboxPage() {
  const [reviewCandidate, setReviewCandidate] = useState<SubscriptionCandidate | null>(null)

  return (
    <>
      <InboxScreen onReviewCandidate={setReviewCandidate} />
      
      <CandidateReviewSheet
        candidate={reviewCandidate}
        open={!!reviewCandidate}
        onClose={() => setReviewCandidate(null)}
        onConfirm={(candidate, modifications) => {
          console.log('Confirmed candidate:', candidate.id, modifications)
          setReviewCandidate(null)
        }}
        onIgnore={(candidate) => {
          console.log('Ignored candidate:', candidate.id)
          setReviewCandidate(null)
        }}
      />
    </>
  )
}
