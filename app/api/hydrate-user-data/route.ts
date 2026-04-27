import { getUser } from '@/lib/supabase/server'
import { getProfile, ensureProfile } from '@/lib/supabase/repositories/profile'
import { getUserSettings, ensureUserSettings } from '@/lib/supabase/repositories/settings'
import { getUserSubscriptions, countUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { sendWelcomeEmail } from '@/lib/email/resend'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/hydrate-user-data
 * Simple endpoint to fetch current user profile (used for plan refresh after upgrade)
 */
export async function GET() {
  try {
    const authUser = await getUser()
    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const profile = await getProfile(authUser.id)
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    return Response.json({ profile })
  } catch (error) {
    console.error('[v0] GET Hydration API error:', error)
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

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
    const profile = await ensureProfile(authUser)
    const settings = await ensureUserSettings(userId)

    // Get subscriptions
    const subscriptions = await getUserSubscriptions()

    // Check if we should migrate local data (empty remote subscriptions)
    const shouldMigrate = subscriptions.length === 0

    // Send welcome email if not already sent (idempotent)
    if (profile && !profile.welcome_email_sent_at && email) {
      try {
        // Use full name if available, otherwise use email prefix
        const userName = profile.full_name || email.split('@')[0]
        
        // Send welcome email
        const emailResult = await sendWelcomeEmail(email, userName)

        if (emailResult.success) {
          // Mark welcome email as sent in database
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          await supabase
            .from('profiles')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', userId)

          console.log(`[v0] Welcome email sent to ${email}`)
        } else {
          // Log warning but do not fail hydration
          console.warn(`[v0] Welcome email failed for ${email}: ${emailResult.error}`)
        }
      } catch (err) {
        // Graceful degradation - do not fail hydration if email sending fails
        console.error('[v0] Error in welcome email flow:', err)
      }
    }

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
