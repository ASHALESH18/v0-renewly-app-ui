import { Redis } from '@upstash/redis'

// Singleton Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Cache helpers with TTL
export const CACHE_KEYS = {
  inboxCounts: (userId: string) => `inbox:counts:${userId}`,
  candidates: (userId: string, status?: string) => `inbox:candidates:${userId}:${status || 'all'}`,
  integrations: (userId: string) => `inbox:integrations:${userId}`,
  notificationLabEvents: (userId: string) => `inbox:lab:${userId}`,
} as const

export const CACHE_TTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
} as const

// Generic cache wrapper
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.medium
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }
  } catch (error) {
    console.error('[Redis] Cache get error:', error)
    // Continue to fetcher if cache fails
  }

  // Fetch fresh data
  const data = await fetcher()

  try {
    // Store in cache
    await redis.set(key, data, { ex: ttl })
  } catch (error) {
    console.error('[Redis] Cache set error:', error)
  }

  return data
}

// Invalidate cache
export async function invalidateCache(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('[Redis] Cache invalidation error:', error)
  }
}

// Invalidate all user caches
export async function invalidateUserCaches(userId: string): Promise<void> {
  await invalidateCache(
    CACHE_KEYS.inboxCounts(userId),
    CACHE_KEYS.candidates(userId),
    CACHE_KEYS.candidates(userId, 'new'),
    CACHE_KEYS.candidates(userId, 'review'),
    CACHE_KEYS.candidates(userId, 'confirmed'),
    CACHE_KEYS.candidates(userId, 'ignored'),
    CACHE_KEYS.candidates(userId, 'error'),
    CACHE_KEYS.integrations(userId)
  )
}
