import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return response
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  // Restore session from cookies if available
  const authCookie = request.cookies.get('sb-auth-token')
  if (authCookie?.value) {
    try {
      const session = JSON.parse(authCookie.value)
      await supabase.auth.setSession(session)
    } catch (err) {
      // Invalid session cookie, continue without session
    }
  }

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth/')
  const isAppPage = path.startsWith('/app')

  // Redirect unauthenticated users trying to access /app
  if (isAppPage && !user) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', path)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get('next')
    const appUrl = next && next.startsWith('/app') ? next : '/app'
    return NextResponse.redirect(new URL(appUrl, request.url))
  }

  return response
}
