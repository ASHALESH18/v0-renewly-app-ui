import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPhoneOTP } from '@/lib/otp/manager'
import { revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { phoneNumber, code } = body

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'A valid 6-digit code is required' },
        { status: 400 }
      )
    }

    const result = await verifyPhoneOTP(user.id, phoneNumber, code)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      )
    }

    // Revalidate user profile cache
    revalidateTag('user-profile', 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] OTP verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
