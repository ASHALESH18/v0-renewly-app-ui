import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSafeNextPath } from '@/lib/auth/redirect-utils'

// M0: Timeout for middleware auth check (ms)
const MIDDLEWARE_AUTH_TIMEOUT = 2000

// M0: Helper to create a promise that rejects after delay
function createTimeoutPromise(ms: number, label: string) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
  )
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search || ''
  
  // M0: Start auth check timer
  const authCheckStart = Date.now()
  let authTimeoutOccurred = false
  let user = null

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // M0: Wrap getUser with timeout to prevent middleware hangs
  try {
    const getAuthPromise = supabase.auth.getUser()
    const timeoutPromise = createTimeoutPromise(MIDDLEWARE_AUTH_TIMEOUT, 'Auth check')

    const result = await Promise.race([getAuthPromise, timeoutPromise])
    user = result.data?.user || null
  } catch (error) {
    // M0: Timeout or auth error - log and continue gracefully
    const duration = Date.now() - authCheckStart
    if (error instanceof Error && error.message.includes('timeout')) {
      authTimeoutOccurred = true
      console.warn(
        `[middleware] M0: Auth timeout after ${duration}ms on ${pathname} - allowing request to proceed`
      )
    } else {
      console.warn(
        `[middleware] M0: Auth check failed after ${duration}ms on ${pathname}:`,
        error instanceof Error ? error.message : 'unknown error'
      )
    }
    // Continue without user to prevent 504 - app will handle auth gracefully
    user = null
  }

  // M0: Log middleware route type for debugging (safe - no sensitive data)
  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - authCheckStart
    const routeType = pathname.startsWith('/app') ? 'protected' : 'public'
    console.debug(
      `[middleware] M0: ${routeType} route ${pathname} - auth took ${duration}ms${authTimeoutOccurred ? ' (timeout)' : ''}`
    )
  }

  // Redirect unauthenticated users trying to access /app
  // Preserve the full path including query string (e.g., /app/family/accept?token=abc)
  if (pathname.startsWith('/app') && !user) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    const nextPath = `${pathname}${search}`
    signInUrl.searchParams.set('next', nextPath)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages (except callback, sign-out, and reset-password)
  // Note: reset-password needs to be accessible for users in the password recovery flow
  // who are technically "authenticated" via the recovery token
  if (
    pathname.startsWith('/auth') &&
    !pathname.includes('callback') &&
    !pathname.includes('sign-out') &&
    !pathname.includes('reset-password') &&
    user
  ) {
    // If there's a safe next parameter, respect it (e.g., family invite token redirect)
    const next = request.nextUrl.searchParams.get('next')
    const safeNext = getSafeNextPath(next)
    return NextResponse.redirect(new URL(safeNext, request.url))
  }

  return supabaseResponse
}
