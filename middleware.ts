import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// M0: Define public routes that don't need auth checks
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/features',
  '/faq',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/auth/sign-out',
  '/auth/reset-password',
]

// M0: Check if a pathname is public
function isPublicRoute(pathname: string): boolean {
  // Exact match on public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }
  
  // Allow auth callback and sign-out variants
  if (pathname.includes('/auth/callback') || pathname.includes('/auth/sign-out')) {
    return true
  }
  
  return false
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // M0: Skip auth checks for public routes - return immediately
  if (isPublicRoute(pathname)) {
    return
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known (web manifest, robots, sitemap)
     * - api/ (API routes handled by their own auth)
     * - public/ (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|\\.well-known|api/|public/).*)',
  ],
}

