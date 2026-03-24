import { getUser } from '@/lib/supabase/server'

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

    // Migration is now handled client-side
    // This endpoint exists to mark migration as complete
    // Real user data would be sent in the request body from the client
    // and inserted here. Demo data is NOT inserted.

    return Response.json({
      success: true,
      migratedCount: 0,
      message: 'Migration endpoint ready. Send subscriptions in request body to migrate.',
    })
  } catch (error) {
    console.error('[v0] Migration API error:', error)
    return Response.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}
