import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Check for auth cookies (Supabase stores session in cookies)
  // Look for any cookie containing 'auth'
  const hasAuthCookie = request.cookies.getAll().some(cookie => 
    cookie.name.includes('auth') || cookie.name.includes('session')
  )

  // Redirect unauthenticated users trying to access /app
  if (pathname.startsWith('/app') && !hasAuthCookie) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Redirect authenticated users away from auth pages (except callback)
  if (pathname.startsWith('/auth') && !pathname.includes('callback') && hasAuthCookie) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return response
}

