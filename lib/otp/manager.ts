import { createClient } from '@supabase/supabase-js'
import { sendOTPSMS, formatPhoneNumber, isValidPhoneNumber, isTwilioConfigured } from '@/lib/sms/twilio'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// OTP Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 3
const COOLDOWN_SECONDS = 60 // Time between resends

/**
 * Generate a secure random OTP code
 */
function generateOTP(): string {
  // Generate cryptographically secure random digits
  const buffer = crypto.randomBytes(4)
  const num = buffer.readUInt32BE(0)
  // Convert to 6-digit string with leading zeros
  return String(num % 1000000).padStart(OTP_LENGTH, '0')
}

/**
 * Hash the OTP code for secure storage
 */
function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Check if user can request a new OTP (cooldown check)
 */
async function canRequestNewOTP(userId: string, phoneNumber: string): Promise<{
  canRequest: boolean
  secondsRemaining?: number
}> {
  const { data: existingOTP } = await supabase
    .from('otp_codes')
    .select('created_at')
    .eq('user_id', userId)
    .eq('phone', phoneNumber)
    .is('verified_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!existingOTP) {
    return { canRequest: true }
  }

  const createdAt = new Date(existingOTP.created_at)
  const now = new Date()
  const secondsSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / 1000)

  if (secondsSinceCreated < COOLDOWN_SECONDS) {
    return {
      canRequest: false,
      secondsRemaining: COOLDOWN_SECONDS - secondsSinceCreated,
    }
  }

  return { canRequest: true }
}

/**
 * Send OTP to phone number
 */
export async function sendPhoneOTP(userId: string, phoneNumber: string): Promise<{
  success: boolean
  error?: string
  cooldownSeconds?: number
}> {
  try {
    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      return {
        success: false,
        error: 'SMS verification is not available. Please contact support.',
      }
    }

    // Validate and format phone number
    if (!isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format. Please include country code (e.g., +1 for US).',
      }
    }

    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Check cooldown
    const cooldownCheck = await canRequestNewOTP(userId, formattedPhone)
    if (!cooldownCheck.canRequest) {
      return {
        success: false,
        error: `Please wait ${cooldownCheck.secondsRemaining} seconds before requesting a new code.`,
        cooldownSeconds: cooldownCheck.secondsRemaining,
      }
    }

    // Generate OTP
    const code = generateOTP()
    const hashedCode = hashOTP(code)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Invalidate any existing OTPs for this user/phone by marking them as verified
    await supabase
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('phone', formattedPhone)
      .is('verified_at', null)

    // Store new OTP (using hashed code for security)
    const { error: insertError } = await supabase.from('otp_codes').insert({
      user_id: userId,
      phone: formattedPhone,
      code: hashedCode, // Store hashed code
      purpose: 'phone_verification',
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      max_attempts: MAX_ATTEMPTS,
    })

    if (insertError) {
      console.error('[OTP] Insert error:', insertError)
      return {
        success: false,
        error: 'Failed to generate verification code. Please try again.',
      }
    }

    // Send SMS
    const smsResult = await sendOTPSMS(formattedPhone, code)

    if (!smsResult.success) {
      return {
        success: false,
        error: smsResult.error || 'Failed to send verification code. Please try again.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[OTP] Send error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Verify OTP code
 */
export async function verifyPhoneOTP(userId: string, phoneNumber: string, code: string): Promise<{
  success: boolean
  error?: string
  attemptsRemaining?: number
}> {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber)
    const hashedCode = hashOTP(code)

    // Get the latest OTP for this user/phone
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('phone', formattedPhone)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return {
        success: false,
        error: 'No verification code found. Please request a new code.',
      }
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      }
    }

    // Check attempts
    const maxAttempts = otpRecord.max_attempts || MAX_ATTEMPTS
    if (otpRecord.attempts >= maxAttempts) {
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new code.',
      }
    }

    // Verify the code (compare hashed values)
    if (otpRecord.code !== hashedCode) {
      // Increment attempts
      await supabase
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      const attemptsRemaining = maxAttempts - (otpRecord.attempts + 1)
      return {
        success: false,
        error: attemptsRemaining > 0
          ? `Invalid code. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`
          : 'Invalid code. Please request a new code.',
        attemptsRemaining,
      }
    }

    // Mark as verified
    await supabase
      .from('otp_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    // Update user profile with verified phone
    await supabase
      .from('profiles')
      .update({
        phone: formattedPhone,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Optional phone verification email can be added later with a dedicated helper.

    return { success: true }
  } catch (error) {
    console.error('[OTP] Verify error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Check OTP service status
 */
export async function getOTPServiceStatus(): Promise<{
  available: boolean
  reason?: string
}> {
  if (!isTwilioConfigured()) {
    return {
      available: false,
      reason: 'SMS service is not configured',
    }
  }
  return { available: true }
}
