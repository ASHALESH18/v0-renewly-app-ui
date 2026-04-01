'import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhone = process.env.TWILIO_PHONE_NUMBER

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromPhone)
}

/**
 * Get Twilio client instance
 */
function getTwilioClient() {
  if (!isTwilioConfigured()) {
    throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.')
  }
  return twilio(accountSid, authToken)
}

/**
 * Send an SMS message
 */
export async function sendSMS(to: string, body: string): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  try {
    if (!isTwilioConfigured()) {
      return {
        success: false,
        error: 'SMS service is not configured',
      }
    }

    const client = getTwilioClient()

    const message = await client.messages.create({
      body,
      from: fromPhone,
      to,
    })

    return {
      success: true,
      messageId: message.sid,
    }
  } catch (error) {
    console.error('[Twilio] Send SMS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    }
  }
}

/**
 * Send OTP verification code via SMS
 */
export async function sendOTPSMS(phoneNumber: string, code: string): Promise<{
  success: boolean
  messageId?: string
  error?: string
}> {
  const body = `Your Renewly verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`

  return sendSMS(phoneNumber, body)
}

/**
 * Format phone number to E.164 format
 * Handles common formats and adds country code if missing
 */
export function formatPhoneNumber(phone: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If it doesn't start with +, add the default country code
  if (!cleaned.startsWith('+')) {
    // Remove leading 0 if present (common in some countries)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    cleaned = defaultCountryCode + cleaned
  }

  return cleaned
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // E.164 format: + followed by 10-15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/
  return e164Regex.test(formatted)
}
