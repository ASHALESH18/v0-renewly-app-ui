import { getUser } from '@/lib/supabase/server'
import { initialSubscriptions } from '@/lib/init-data'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return Response.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Verify the user is authenticated
    const authUser = await getUser()
    if (!authUser || authUser.id !== userId) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Migrate local subscriptions to Supabase
    // For now, we'll use the initial demo subscriptions as a fallback
    // In production, this would read from localStorage and migrate real user data

    const subscriptionsToMigrate = initialSubscriptions.map(sub => ({
      user_id: userId,
      name: sub.name,
      category: sub.category,
      amount: sub.amount,
      currency: sub.currency,
      billing_cycle: sub.billingCycle,
      status: sub.status,
      renewal_date: sub.renewalDate,
      description: sub.description,
      logo: sub.logo,
      color: sub.color,
    }))

    // Insert subscriptions via Supabase REST API
    const insertResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionsToMigrate),
      }
    )

    if (!insertResponse.ok) {
      const error = await insertResponse.json()
      console.error('[v0] Failed to insert subscriptions:', error)
      return Response.json(
        { error: 'Failed to migrate data' },
        { status: 500 }
      )
    }

    const migratedData = await insertResponse.json()

    return Response.json({
      success: true,
      migratedCount: migratedData.length,
    })
  } catch (error) {
    console.error('[v0] Migration API error:', error)
    return Response.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}
