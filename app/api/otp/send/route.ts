import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPhoneOTP } from '@/lib/otp/manager'

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
    const { phoneNumber } = body

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const result = await sendPhoneOTP(user.id, phoneNumber)

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: result.cooldownSeconds ? 429 : 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] OTP send error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
