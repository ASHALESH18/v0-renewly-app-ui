import { NextResponse } from 'next/server'
import { getOTPServiceStatus } from '@/lib/otp/manager'

export async function GET() {
  try {
    const status = await getOTPServiceStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('[API] OTP status error:', error)
    return NextResponse.json(
      { available: false, reason: 'Unable to determine SMS service status' },
      { status: 500 }
    )
  }
}