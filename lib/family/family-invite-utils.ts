import { randomBytes } from 'crypto'
import { createHash } from 'crypto'
import { FAMILY_INVITE_EXPIRY_DAYS } from './family-config'

/**
 * Normalize invite email: trim, lowercase, basic validation
 */
export function normalizeInviteEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  
  // Basic email format validation
  if (!normalized.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new Error('Invalid email format')
  }
  
  return normalized
}

/**
 * Generate a secure random token for invite links
 * Uses Node crypto for secure randomness
 */
export function generateInviteToken(): string {
  // 32 bytes = 256 bits of entropy
  const randomToken = randomBytes(32).toString('hex')
  return randomToken
}

/**
 * Hash invite token using SHA-256
 * Store only hash in database, never raw token
 */
export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Build family invite URL from token
 * Uses NEXT_PUBLIC_APP_URL if available, otherwise must be called with request origin
 */
export function buildFamilyInviteUrl(token: string, origin?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
  const url = new URL('/app/family/accept', baseUrl)
  url.searchParams.set('token', token)
  return url.toString()
}

/**
 * Get invite expiry date (now + FAMILY_INVITE_EXPIRY_DAYS)
 */
export function getInviteExpiryDate(): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + FAMILY_INVITE_EXPIRY_DAYS)
  return expiryDate
}

/**
 * Check if invite has expired
 */
export function isInviteExpired(expiresAt: string | Date): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return new Date() > expiry
}

/**
 * Validate email for family invite
 * Returns normalized email if valid, throws if invalid
 */
export function validateInviteEmail(email: string): string {
  try {
    return normalizeInviteEmail(email)
  } catch (error) {
    throw new Error(`Invalid email: ${(error as Error).message}`)
  }
}
