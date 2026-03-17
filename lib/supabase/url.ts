/**
 * Resolves the app URL in priority order:
 * 1. NEXT_PUBLIC_APP_URL
 * 2. NEXT_PUBLIC_SITE_URL
 * 3. NEXT_PUBLIC_VERCEL_URL
 * 4. VERCEL_URL
 * 5. localhost only in development
 * 
 * Ensures https outside of localhost and includes trailing slash
 */
export function getURL(path: string = ''): string {
  let url = 
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL

  // Handle development
  if (!url && process.env.NODE_ENV === 'development') {
    url = 'http://localhost:3000'
  }

  // If still no URL, throw error
  if (!url) {
    throw new Error('Unable to determine app URL. Please set NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL.')
  }

  // Ensure https in production
  if (!url.startsWith('http')) {
    url = `https://${url}`
  }

  // Ensure trailing slash and append path
  url = url.endsWith('/') ? url : url + '/'
  
  if (path) {
    // Remove leading slash from path to avoid double slashes
    path = path.startsWith('/') ? path.slice(1) : path
    url = url + path
  }

  return url
}
