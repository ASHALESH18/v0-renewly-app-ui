export function getStableProfileAvatar(params: {
  profileAvatarUrl?: string | null
  avatarSource?: string | null
  authAvatarUrl?: string | null
  authPicture?: string | null
  avatarSeed?: string | null
  email?: string | null
  generateAvatar: (args: { seed: string; size?: number }) => string
  size?: number
}): string | null {
  const {
    profileAvatarUrl,
    avatarSource,
    authAvatarUrl,
    authPicture,
    avatarSeed,
    email,
    generateAvatar,
    size = 128,
  } = params

  // If user generated/customized an avatar, keep it constant everywhere.
  if (profileAvatarUrl && avatarSource === 'user') {
    return profileAvatarUrl
  }

  // If profile has provider avatar, use it.
  if (profileAvatarUrl && avatarSource === 'provider') {
    return profileAvatarUrl
  }

  // Gmail/Google fallback.
  if (authAvatarUrl) return authAvatarUrl
  if (authPicture) return authPicture

  // Any existing stored profile avatar still beats generated fallback.
  if (profileAvatarUrl) return profileAvatarUrl

  // Final deterministic generated fallback.
  const seed = avatarSeed || email || 'default'
  return generateAvatar({ seed, size })
}
