import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

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

  // Redirect unauthenticated users trying to access /app
  if (pathname.startsWith('/app') && !user) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
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
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return supabaseResponse
}
