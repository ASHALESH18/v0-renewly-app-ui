import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateUserCaches } from '@/lib/redis'
import { inngest } from '@/lib/inngest/client'

type DecisionAction = 'confirm' | 'ignore' | 'already_tracked' | 'save_for_later' | 'retry'

interface DecisionBody {
  action: DecisionAction
  modifications?: {
    providerName?: string
    planName?: string
    amount?: number
    currency?: string
    billingCycle?: string
    category?: string
    paymentMethod?: string
    notes?: string
  }
}

/**
 * POST /api/smart-capture/candidates/[id]/decision
 * Record a decision for a candidate (confirm, ignore, etc.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body: DecisionBody = await request.json()
    const { action, modifications } = body

    // Validate action
    const validActions: DecisionAction[] = ['confirm', 'ignore', 'already_tracked', 'save_for_later', 'retry']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Fetch candidate to verify ownership
    const { data: candidate, error: fetchError } = await supabase
      .from('subscription_candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Determine new status based on action
    const statusMap: Record<DecisionAction, string> = {
      confirm: 'added',
      ignore: 'ignored',
      already_tracked: 'ignored',
      save_for_later: 'review_needed',
      retry: 'new',
    }
    const newStatus = statusMap[action]

    // Update candidate status
    const { error: updateError } = await supabase
      .from('subscription_candidates')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('[smart-capture] Error updating candidate:', updateError)
      return NextResponse.json(
        { error: 'Failed to update candidate' },
        { status: 500 }
      )
    }

    // Record the decision
    const decisionData = {
      candidate_id: id,
      user_id: user.id,
      action,
      modifications: modifications || null,
      created_at: new Date().toISOString(),
    }

    const { error: decisionError } = await supabase
      .from('candidate_decisions')
      .insert(decisionData)

    if (decisionError) {
      // Log but don't fail - decision recording is secondary
      console.error('[smart-capture] Error recording decision:', decisionError)
    }

    // If confirmed, create the subscription
    let subscriptionId: string | null = null
    if (action === 'confirm') {
      const subscriptionData = {
        user_id: user.id,
        name: modifications?.providerName || candidate.provider_name,
        category: modifications?.category || 'Other',
        amount: modifications?.amount || candidate.amount || 0,
        currency: modifications?.currency || candidate.currency || 'INR',
        billing_cycle: modifications?.billingCycle || candidate.billing_cycle || 'monthly',
        status: 'active',
        description: modifications?.planName || candidate.plan_name || null,
        // Link back to candidate for tracking
        source_candidate_id: id,
      }

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select('id')
        .single()

      if (subError) {
        console.error('[smart-capture] Error creating subscription:', subError)
        // Don't fail the whole operation, just note the issue
      } else {
        subscriptionId = subscription?.id
        
        // Send Inngest event for post-confirmation processing
        await inngest.send({
          name: 'smart-capture/candidate.confirmed',
          data: {
            userId: user.id,
            candidateId: id,
            subscriptionId,
          },
        })
      }
    }

    // Invalidate user caches after any decision
    await invalidateUserCaches(user.id)

    return NextResponse.json({
      success: true,
      candidateId: id,
      newStatus,
      subscriptionId,
    })
  } catch (error) {
    console.error('[smart-capture] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
