import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { getSafeNextPath } from '@/lib/auth/redirect-utils'

export async function updateSession(request: NextRequest) {
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

  // IMPORTANT: Do NOT use getSession() here - it doesn't refresh tokens
  // Use getUser() which validates the JWT and refreshes if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search || ''

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
