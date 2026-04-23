import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function isVerificationLinkPossiblyAlreadyUsed(message?: string | null) {
  const text = (message || '').toLowerCase()

  return (
    text.includes('expired') ||
    text.includes('invalid') ||
    text.includes('used') ||
    text.includes('otp_expired')
  )
}

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
    const isEmailVerification = type === 'signup' || type === 'email'

    if (isEmailVerification && isVerificationLinkPossiblyAlreadyUsed(verifyError.message)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    const errorType = verifyError.message?.includes('expired') ? 'expired' : 'invalid'
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
      // Password recovery flow - redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
      }
      // Other OTP types (invite) - go to appropriate destination
      return NextResponse.redirect(new URL(next || '/app/dashboard', origin))
    }

    // Verification failed
    const message = (verifyError.message || '').toLowerCase()
    const isEmailVerification = type === 'signup' || type === 'email'
    const looksAlreadyUsedOrPrefetched =
      message.includes('expired') ||
      message.includes('invalid') ||
      message.includes('used') ||
      message.includes('otp_expired')

    if (isEmailVerification && looksAlreadyUsedOrPrefetched) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    const errorType = message.includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // Handle code exchange (OAuth, PKCE flow, Password Recovery)
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Check if this is an email verification callback
      if (type === 'signup' || type === 'email') {
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }

      // Password recovery flow - redirect to reset password page
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
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
