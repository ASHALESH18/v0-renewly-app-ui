import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle error cases from Supabase (e.g., expired link)
  if (error) {
    const errorType = errorDescription?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Check if this is an email verification (signup confirmation)
      // vs a magic link login or OAuth callback
      const type = searchParams.get('type')
      
      if (type === 'signup' || type === 'email') {
        // Email verification - show branded success page
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }
      
      // Regular auth callback (OAuth, magic link, etc.)
      const redirectPath = next || '/app/dashboard'
      return NextResponse.redirect(new URL(redirectPath, origin))
    }

    // Exchange failed - likely expired or invalid token
    return NextResponse.redirect(
      new URL('/auth/confirmation-error?error=invalid', origin)
    )
  }

  // No code provided - redirect to sign-in with error
  return NextResponse.redirect(
    new URL('/auth/sign-in?error=auth_callback_missing_code', origin)
  )
}
