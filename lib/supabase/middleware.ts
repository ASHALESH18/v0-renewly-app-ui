import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Handle route protection based on auth cookie presence
  // The actual auth validation happens in server components
  const pathname = request.nextUrl.pathname
  
  // Check for auth token cookie (Supabase stores it as sb-{project-id}-auth-token)
  // We do a simple presence check - detailed validation happens server-side
  const authCookies = request.cookies.getAll().filter(c => c.name.includes('auth-token'))
  const hasAuthCookie = authCookies.length > 0

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

