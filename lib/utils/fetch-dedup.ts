// Combo 3A: Unified fetch deduplication + single-flight for app-shell APIs
// Prevents repeated calls during rapid refocus/navigation with ~30s TTL

interface CacheEntry<T> {
  data: T
  promise: Promise<T>
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Generic fetch with single-flight deduplication
 * If same request in flight, return that promise
 * If cached and TTL valid, return cached data
 * Otherwise fetch fresh and cache result
 */
export async function fetchWithDedup<T>(
  endpoint: string,
  options?: {
    ttl?: number // milliseconds (default 30s)
    forceRefresh?: boolean
  }
): Promise<T> {
  const { ttl = 30000, forceRefresh = false } = options || {}
  const now = Date.now()

  // If force refresh requested, skip cache
  if (!forceRefresh) {
    // Check if cached and TTL still valid
    const cached = cache.get(endpoint)
    if (cached && now - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Check if fetch already in flight - return that promise
    if (cached && cached.promise) {
      try {
        const result = await cached.promise
        return result
      } catch {
        // If in-flight fetch failed, fall through to retry
      }
    }
  }

  // Create new fetch
  const promise = (async () => {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`[fetch-dedup] ${endpoint} returned ${response.status}`)
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Store in cache
      cache.set(endpoint, {
        data,
        promise: Promise.resolve(data),
        timestamp: now,
        ttl,
      })

      return data as T
    } catch (error) {
      console.error(`[fetch-dedup] Failed to fetch ${endpoint}:`, error)
      throw error
    }
  })()

  // Store promise in cache while fetching
  cache.set(endpoint, {
    data: undefined,
    promise,
    timestamp: now,
    ttl,
  })

  return promise
}

/**
 * Force invalidate a specific endpoint cache
 */
export function invalidateCache(endpoint: string): void {
  cache.delete(endpoint)
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  cache.clear()
}

/**
 * Preset endpoints with standard paths
 */
export const Endpoints = {
  NOTIFICATIONS: '/api/notifications',
  FAMILY_STATUS: '/api/family/status',
  SUBSCRIPTIONS: '/api/subscriptions',
} as const

/**
 * Typed fetchers for common endpoints
 */
export async function fetchNotifications(options?: { ttl?: number; forceRefresh?: boolean }) {
  try {
    const result = await fetchWithDedup<{
      notifications: any[]
      unreadCount: number
    }>(Endpoints.NOTIFICATIONS, options)
    return result || { notifications: [], unreadCount: 0 }
  } catch {
    return { notifications: [], unreadCount: 0 }
  }
}

export async function fetchFamilyStatus(options?: { ttl?: number; forceRefresh?: boolean }) {
  try {
    return await fetchWithDedup<any>(Endpoints.FAMILY_STATUS, options)
  } catch {
    return null
  }
}

export async function fetchSubscriptions(options?: { ttl?: number; forceRefresh?: boolean }) {
  try {
    const result = await fetchWithDedup<{
      subscriptions: any[]
    }>(Endpoints.SUBSCRIPTIONS, options)
    return result?.subscriptions || []
  } catch {
    return []
  }
}
