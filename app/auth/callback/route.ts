import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Supabase email verification parameters
  const type = searchParams.get('type')
  const tokenHash = searchParams.get('token_hash')

  // Handle error cases from Supabase (e.g., expired link)
  if (error) {
    const errorType = errorDescription?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // Handle token_hash verification (email confirmation via OTP-style link)
  if (tokenHash && type) {
    const supabase = await createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'magiclink' | 'recovery' | 'invite',
      token_hash: tokenHash,
    })

    if (!verifyError) {
      // Email verified successfully - show branded success page
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }
      // Other OTP types (recovery, invite) - go to appropriate destination
      return NextResponse.redirect(new URL(next || '/app/dashboard', origin))
    }

    // Verification failed
    const errorType = verifyError.message?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // Handle code exchange (OAuth, PKCE flow)
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Check if this is an email verification callback
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }
      
      // Regular auth callback (OAuth, etc.)
      const redirectPath = next || '/app/dashboard'
      return NextResponse.redirect(new URL(redirectPath, origin))
    }

    // Exchange failed - likely expired or invalid token
    const errorType = exchangeError.message?.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // No code or token_hash provided - redirect to sign-in with error
  return NextResponse.redirect(
    new URL('/auth/sign-in?error=auth_callback_missing_code', origin)
  )
}
