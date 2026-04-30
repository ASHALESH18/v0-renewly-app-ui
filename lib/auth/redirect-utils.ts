/**
 * Safe redirect utilities for auth flow
 * Prevents open redirect vulnerabilities while preserving family invite tokens
 */

/**
 * Get a safe next redirect path
 * - Validates that the path is internal (starts with /)
 * - Blocks double-slash paths and external URLs
 * - Defaults to /app/dashboard if unsafe
 */
export function getSafeNextPath(value?: string | null): string {
  if (!value) return '/app/dashboard'

  try {
    const decoded = decodeURIComponent(value)
    
    // Must start with /
    if (!decoded.startsWith('/')) return '/app/dashboard'
    
    // Block double-slash (protocol-style URLs like //evil.com)
    if (decoded.startsWith('//')) return '/app/dashboard'

    // Only allow internal app destinations for auth redirects
    if (!decoded.startsWith('/app')) return '/app/dashboard'

    return decoded
  } catch {
    // If decoding fails, it's unsafe
    return '/app/dashboard'
  }
}

/**
 * Encode a path for use in URL query parameters
 */
export function encodeNextPath(path: string): string {
  return encodeURIComponent(path)
}

/**
 * Build a URL with a safe next parameter
 */
export function buildUrlWithNext(baseUrl: string, next?: string | null): URL {
  const url = new URL(baseUrl)
  if (next) {
    const safeNext = getSafeNextPath(next)
    url.searchParams.set('next', safeNext)
  }
  return url
}
