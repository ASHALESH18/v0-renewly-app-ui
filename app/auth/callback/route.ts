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

function isEmailVerificationType(type?: string | null) {
  return type === 'signup' || type === 'email'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const type = searchParams.get('type')
  const tokenHash = searchParams.get('token_hash')

  // Handle direct error cases coming from Supabase callback params
  if (error) {
    if (isEmailVerificationType(type) && isVerificationLinkPossiblyAlreadyUsed(errorDescription || error)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    const errorType = errorDescription?.toLowerCase().includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // Handle token_hash verification (email confirmation / OTP-style links)
  if (tokenHash && type) {
    const supabase = await createClient()

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'magiclink' | 'recovery' | 'invite',
      token_hash: tokenHash,
    })

    if (!verifyError) {
      if (isEmailVerificationType(type)) {
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }

      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
      }

      return NextResponse.redirect(new URL(next || '/app/dashboard', origin))
    }

    if (isEmailVerificationType(type) && isVerificationLinkPossiblyAlreadyUsed(verifyError.message)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    const errorType = verifyError.message?.toLowerCase().includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  // Handle code exchange (OAuth / PKCE / recovery flows)
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      if (isEmailVerificationType(type)) {
        return NextResponse.redirect(new URL('/auth/verified', origin))
      }

      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
      }

      const redirectPath = next || '/app/dashboard'
      return NextResponse.redirect(new URL(redirectPath, origin))
    }

    if (isEmailVerificationType(type) && isVerificationLinkPossiblyAlreadyUsed(exchangeError.message)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    const errorType = exchangeError.message?.toLowerCase().includes('expired') ? 'expired' : 'invalid'
    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${errorType}`, origin)
    )
  }

  return NextResponse.redirect(
    new URL('/auth/sign-in?error=auth_callback_missing_code', origin)
  )
}