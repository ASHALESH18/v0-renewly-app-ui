import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // If Supabase is not configured, allow access but don't do auth checks
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth/')
  const isAppPage = path.startsWith('/app')
  const isLandingPage = path === '/'

  // Redirect logic
  if (isAppPage && !user) {
    // Unauthenticated user trying to access app - redirect to sign-in with next param
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', path)
    return NextResponse.redirect(signInUrl)
  }

  if (isAuthPage && user) {
    // Authenticated user on auth pages - redirect to app or next destination
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = next && next.startsWith('/app') ? next : '/app'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return supabaseResponse
}
