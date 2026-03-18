import { getUser } from '@/lib/supabase/server'
import { getProfile, ensureProfile } from '@/lib/supabase/repositories/profile'
import { getUserSettings, ensureUserSettings } from '@/lib/supabase/repositories/settings'
import { getUserSubscriptions, countUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return Response.json(
        { error: 'Missing userId or email' },
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

    // Ensure profile and settings exist
    const profile = await ensureProfile(userId, email)
    const settings = await ensureUserSettings(userId)

    // Get subscriptions
    const subscriptions = await getUserSubscriptions()

    // Check if we should migrate local data (empty remote subscriptions)
    const shouldMigrate = subscriptions.length === 0

    return Response.json({
      profile,
      settings,
      subscriptions,
      shouldMigrate,
    })
  } catch (error) {
    console.error('[v0] Hydration API error:', error)
    return Response.json(
      { error: 'Hydration failed' },
      { status: 500 }
    )
  }
}
