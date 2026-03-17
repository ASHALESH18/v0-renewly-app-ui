import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAuthPage = path.startsWith('/auth/')
  const isAppPage = path.startsWith('/app')

  // Check if there's an auth session cookie
  // Supabase stores the session in sb-[ref]-auth-token cookie
  const authCookie = request.cookies.getAll().find(c => c.name.includes('auth-token'))
  const hasSession = !!authCookie

  // If unauthenticated user tries to access /app, redirect to sign-in
  if (isAppPage && !hasSession) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', path)
    return NextResponse.redirect(signInUrl)
  }

  // If authenticated user on auth pages, redirect to app
  if (isAuthPage && hasSession) {
    const next = request.nextUrl.searchParams.get('next')
    const redirectUrl = next && next.startsWith('/app') ? next : '/app'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return NextResponse.next({
    request,
  })
}

