import { Redis } from '@upstash/redis'

// Safe Redis client initialization - don't crash if env vars are missing
let redisClient: Redis | null = null
let redisError: Error | null = null

function initializeRedis(): Redis | null {
  if (redisClient) return redisClient
  if (redisError) return null

  try {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN

    if (!url || !token) {
      console.warn('[Redis] KV_REST_API_URL or KV_REST_API_TOKEN not configured - caching disabled')
      redisError = new Error('Redis env vars missing')
      return null
    }

    redisClient = new Redis({ url, token })
    console.log('[Redis] Client initialized successfully')
    return redisClient
  } catch (error) {
    console.warn('[Redis] Failed to initialize:', error)
    redisError = error as Error
    return null
  }
}

// Public API for checking Redis availability
export function isRedisAvailable(): boolean {
  const client = initializeRedis()
  return client !== null
}

// Public API to get Redis client (may be null)
export function getRedisClient(): Redis | null {
  return initializeRedis()
}

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

// Generic cache wrapper with graceful fallback
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.medium
): Promise<T> {
  const redis = getRedisClient()

  // If Redis unavailable, skip cache and fetch directly
  if (!redis) {
    console.debug('[Redis] Cache bypass - Redis unavailable, fetching directly:', key)
    return await fetcher()
  }

  try {
    // Try to get from cache first
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      console.debug('[Redis] Cache hit:', key)
      return cached
    }
  } catch (error) {
    console.warn('[Redis] Cache get error:', error)
    // Continue to fetcher if cache fails
  }

  // Fetch fresh data
  const data = await fetcher()

  try {
    // Store in cache
    await redis.set(key, data, { ex: ttl })
  } catch (error) {
    console.warn('[Redis] Cache set error:', error)
    // Continue anyway - data is still valid even if cache write fails
  }

  return data
}

// Safe cache get with no-op if Redis unavailable
export async function safeCacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    return await redis.get<T>(key)
  } catch (error) {
    console.warn('[Redis] Cache get error:', error)
    return null
  }
}

// Safe cache set with no-op if Redis unavailable
export async function safeCacheSet<T>(key: string, value: T, ttl: number = CACHE_TTL.medium): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.set(key, value, { ex: ttl })
  } catch (error) {
    console.warn('[Redis] Cache set error:', error)
    // No-op on failure
  }
}

// Safe cache delete with no-op if Redis unavailable
export async function safeCacheDelete(...keys: string[]): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.warn('[Redis] Cache delete error:', error)
    // No-op on failure
  }
}

// Invalidate cache
export async function invalidateCache(...keys: string[]): Promise<void> {
  await safeCacheDelete(...keys)
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

