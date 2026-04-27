import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateCache } from '@/lib/redis'

/**
 * GET /api/subscriptions/[id]
 * Fetch a single subscription by ID
 */
export async function GET(
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

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('[subscriptions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/subscriptions/[id]
 * Update a subscription
 */
export async function PUT(
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
    const body = await request.json()

    // Verify ownership and check if system-managed
    const { data: existing, error: selectError } = await supabase
      .from('subscriptions')
      .select('id, is_system_managed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (selectError || !existing) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Prevent editing system-managed subscriptions
    if (existing.is_system_managed) {
      return NextResponse.json(
        { error: 'Renewly billing subscriptions are managed automatically. Use Manage Plan.' },
        { status: 403 }
      )
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[subscriptions] Error updating:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // Invalidate cache
    await invalidateCache(`subscriptions:${user.id}`)

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('[subscriptions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/subscriptions/[id]
 * Delete a subscription
 */
export async function DELETE(
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

    // Check if system-managed before delete
    const { data: subscription, error: selectError } = await supabase
      .from('subscriptions')
      .select('id, is_system_managed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (selectError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Prevent deleting system-managed subscriptions
    if (subscription.is_system_managed) {
      return NextResponse.json(
        { error: 'Renewly billing subscriptions are managed automatically. Use Manage Plan.' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[subscriptions] Error deleting:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      )
    }

    // Invalidate cache
    await invalidateCache(`subscriptions:${user.id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[subscriptions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
