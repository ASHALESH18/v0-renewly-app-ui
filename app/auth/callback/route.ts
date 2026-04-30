import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSafeNextPath } from '@/lib/auth/redirect-utils'

function isEmailVerificationType(type?: string | null) {
  return type === 'signup' || type === 'email'
}

function looksLikeAlreadyUsedOrPrefetched(message?: string | null) {
  const text = (message || '').toLowerCase()

  return (
    text.includes('expired') ||
    text.includes('invalid') ||
    text.includes('used') ||
    text.includes('otp_expired')
  )
}

function getErrorType(message?: string | null) {
  const text = (message || '').toLowerCase()
  return text.includes('expired') || text.includes('otp_expired') ? 'expired' : 'invalid'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const safeNext = getSafeNextPath(next)
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const type = searchParams.get('type')
  const tokenHash = searchParams.get('token_hash')

  // Supabase can sometimes return an error even though the verification link
  // was already consumed by a mail prefetcher/scanner and the email is already verified.
  if (error) {
    if (isEmailVerificationType(type) && looksLikeAlreadyUsedOrPrefetched(errorDescription || error)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${getErrorType(errorDescription || error)}`, origin)
    )
  }

  // Email confirmation / OTP-style verification links
  if (tokenHash && type) {
    const supabase = await createClient()

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email' | 'magiclink' | 'recovery' | 'invite',
      token_hash: tokenHash,
    })

    if (!verifyError) {
      if (isEmailVerificationType(type)) {
        return NextResponse.redirect(new URL(`/auth/verified?next=${encodeURIComponent(safeNext)}`, origin))
      }

      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
      }

      return NextResponse.redirect(new URL(safeNext, origin))
    }

    if (isEmailVerificationType(type) && looksLikeAlreadyUsedOrPrefetched(verifyError.message)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${getErrorType(verifyError.message)}`, origin)
    )
  }

  // PKCE / OAuth / other code-based callbacks
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      if (isEmailVerificationType(type)) {
        return NextResponse.redirect(new URL(`/auth/verified?next=${encodeURIComponent(safeNext)}`, origin))
      }

      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', origin))
      }

      return NextResponse.redirect(new URL(safeNext, origin))
    }

    if (isEmailVerificationType(type) && looksLikeAlreadyUsedOrPrefetched(exchangeError.message)) {
      return NextResponse.redirect(
        new URL('/auth/verified?already=1', origin)
      )
    }

    return NextResponse.redirect(
      new URL(`/auth/confirmation-error?error=${getErrorType(exchangeError.message)}`, origin)
    )
  }

  return NextResponse.redirect(
    new URL('/auth/sign-in?error=auth_callback_missing_code', origin)
  )
}
