/**
 * Centralized contact configuration for public forms and emails
 */

export const PUBLIC_CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@renewly.in'
export const CONTACT_INBOX_EMAIL = process.env.CONTACT_INBOX_EMAIL || 'contact@renewly.in'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.renewly.in'

/**
 * Email configuration for sending
 */
export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'Renewly <contact@renewly.in>',
  replyTo: CONTACT_INBOX_EMAIL,
  contactEmail: CONTACT_INBOX_EMAIL,
}
