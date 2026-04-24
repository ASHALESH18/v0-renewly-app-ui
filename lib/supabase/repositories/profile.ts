// Server-side data fetching for profiles
// Safe to use in Server Components and Route Handlers

import { getUser } from './server'
import type { ProfileRow } from './database.types'

export async function getProfile(): Promise<ProfileRow | null> {
  try {
    const user = await getUser()
    if (!user) return null

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) return null
    const data = await response.json()
    return data[0] || null
  } catch (err) {
    console.error('[v0] Failed to fetch profile:', err)
    return null
  }
}

function extractOAuthProfile(authUser: any) {
  const metadata = authUser?.user_metadata || {}
  const identities = Array.isArray(authUser?.identities) ? authUser.identities : []

  const googleIdentity =
    identities.find((i: any) => i?.provider === 'google')?.identity_data || {}

  const fullName =
    metadata.full_name ||
    metadata.name ||
    [metadata.given_name, metadata.family_name].filter(Boolean).join(' ').trim() ||
    null

  const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    googleIdentity.avatar_url ||
    googleIdentity.picture ||
    null

  const provider =
    authUser?.app_metadata?.provider ||
    identities[0]?.provider ||
    null

  return {
    userId: authUser?.id,
    email: authUser?.email || null,
    fullName,
    avatarUrl,
    provider,
  }
}

export async function ensureProfile(authUser: any): Promise<ProfileRow | null> {
  try {
    const { userId, email, fullName, avatarUrl, provider } = extractOAuthProfile(authUser)

    if (!userId || !email) return null

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) throw new Error('Failed to check profile')
    const data = await response.json()
    const existing = data?.[0] || null

    const isGoogleProvider = provider === 'google'
    const nextAvatarSource = isGoogleProvider ? 'provider' : existing?.avatar_source || null

    if (existing) {
      const shouldSyncProviderAvatar =
        isGoogleProvider &&
        (!!avatarUrl) &&
        (existing.avatar_source === 'provider' || !existing.avatar_source)

      const shouldUpdate =
        (fullName && fullName !== existing.full_name) ||
        (email && email !== existing.email) ||
        (shouldSyncProviderAvatar && avatarUrl !== existing.avatar_url)

      if (!shouldUpdate) {
        return existing
      }

      const updatePayload: Record<string, any> = {
        full_name: fullName || existing.full_name,
        email: email || existing.email,
        updated_at: new Date().toISOString(),
      }

      if (shouldSyncProviderAvatar) {
        updatePayload.avatar_url = avatarUrl
        updatePayload.avatar_source = nextAvatarSource
      }

      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updatePayload),
        }
      )

      if (!updateResponse.ok) throw new Error('Failed to update profile')
      const updated = await updateResponse.json()
      return updated?.[0] || existing
    }

    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: userId,
          email,
          full_name: fullName || email.split('@')[0],
          avatar_url: isGoogleProvider ? avatarUrl : null,
          avatar_source: isGoogleProvider ? 'provider' : null,
          plan: 'free',
        }),
      }
    )

    if (!createResponse.ok) throw new Error('Failed to create profile')
    const created = await createResponse.json()
    return created?.[0] || null
  } catch (err) {
    console.error('[v0] Failed to ensure profile:', err)
    return null
  }
}