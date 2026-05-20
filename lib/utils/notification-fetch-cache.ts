// Combo 5B: Single-flight notification fetch cache
// Prevents repeated calls to /api/notifications during rapid refocus/navigation

interface CacheEntry {
  data: any
  promise: Promise<any>
  timestamp: number
  ttl: number // milliseconds
}

const cache = new Map<string, CacheEntry>()

/**
 * Fetch notifications with single-flight deduplication.
 * If a fetch is already in flight for this key, return that promise instead.
 * If cached data exists and TTL valid, return it without fetching.
 *
 * @param ttl Time-to-live in milliseconds (default 30s)
 * @returns Notification response
 */
export async function fetchNotificationsDeduped(ttl: number = 30000) {
  const key = 'notifications'
  const now = Date.now()

  // Check if cached and still valid
  const cached = cache.get(key)
  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data
  }

  // Check if fetch already in flight
  if (cached && now - cached.timestamp < ttl) {
    return await cached.promise
  }

  // Create new fetch promise
  const promise = (async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`[notification-cache] Fetch failed with status ${response.status}`)
        return { notifications: [], unreadCount: 0 }
      }

      const data = await response.json()
      
      // Store in cache
      cache.set(key, {
        data,
        promise: Promise.resolve(data),
        timestamp: now,
        ttl,
      })

      return data
    } catch (error) {
      console.error('[notification-cache] Fetch error:', error)
      return { notifications: [], unreadCount: 0 }
    }
  })()

  // Store promise while fetching
  cache.set(key, {
    data: null,
    promise,
    timestamp: now,
    ttl,
  })

  return await promise
}

/**
 * Invalidate notification cache to force fresh fetch on next call
 */
export function invalidateNotificationCache() {
  cache.delete('notifications')
}

/**
 * Clear all notification caches (emergency reset)
 */
export function clearNotificationCache() {
  cache.clear()
}

/**
 * Set notification cache directly (for testing/manual updates)
 */
export function setNotificationCacheData(data: any, ttl: number = 30000) {
  const now = Date.now()
  cache.set('notifications', {
    data,
    promise: Promise.resolve(data),
    timestamp: now,
    ttl,
  })
}
