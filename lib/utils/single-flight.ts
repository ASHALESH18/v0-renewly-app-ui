// Combo 5: Single-flight deduping helper for API requests
// Prevents duplicate requests when the same endpoint is called multiple times

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest<any>>()
const MAX_CACHE_AGE = 5000 // 5 seconds

/**
 * Dedupe identical API requests in flight
 * If the same key is requested twice within the cache window, reuse the promise
 */
export function singleFlight<T>(
  key: string,
  fetchFn: () => Promise<T>,
  maxAge = MAX_CACHE_AGE
): Promise<T> {
  const now = Date.now()
  const pending = pendingRequests.get(key)

  // If we have a pending request and it's still fresh, reuse it
  if (pending && now - pending.timestamp < maxAge) {
    return pending.promise
  }

  // Create new request
  const promise = fetchFn()
    .then(result => {
      // Clean up on success
      pendingRequests.delete(key)
      return result
    })
    .catch(error => {
      // Clean up on error to allow retry
      pendingRequests.delete(key)
      throw error
    })

  // Store the pending request
  pendingRequests.set(key, { promise, timestamp: now })

  return promise
}

/**
 * Clear all pending requests (useful for testing or explicit reset)
 */
export function clearSingleFlightCache(): void {
  pendingRequests.clear()
}

/**
 * Get the number of pending requests (for debugging)
 */
export function getPendingRequestCount(): number {
  return pendingRequests.size
}
