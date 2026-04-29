import { randomBytes } from 'crypto'
import { createHash } from 'crypto'
import { FAMILY_INVITE_EXPIRY_DAYS } from './family-config'

/**
 * Normalize a URL/domain string to a full URL with https protocol
 * Handles cases where URL is already complete, domain-only, or null
 */
function normalizeBaseUrl(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '')
  }
  return `https://${trimmed.replace(/\/$/, '')}`
}

/**
 * Resolve app base URL based on deployment environment
 * 
 * Strategy:
 * - In Preview: prefer current request origin, then VERCEL_BRANCH_URL, then fallback to production
 * - In Production: prefer NEXT_PUBLIC_APP_URL, then VERCEL_PROJECT_PRODUCTION_URL
 * - In Development: use request origin or localhost
 */
export function getInviteBaseUrl(origin?: string | null): string {
  const vercelEnv = process.env.VERCEL_ENV

  if (vercelEnv === 'preview') {
    // In Preview, prefer request origin (current preview domain)
    const previewUrl =
      normalizeBaseUrl(origin) ||
      normalizeBaseUrl(process.env.NEXT_PUBLIC_PREVIEW_APP_URL) ||
      normalizeBaseUrl(process.env.PREVIEW_APP_URL) ||
      normalizeBaseUrl(process.env.VERCEL_BRANCH_URL) ||
      normalizeBaseUrl(process.env.VERCEL_URL)

    // Fallback to production if no preview URL available
    return (
      previewUrl ||
      normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
      normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
      'http://localhost:3000'
    )
  }

  if (vercelEnv === 'production') {
    // In Production, prefer configured production URL
    const productionUrl =
      normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
      normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)

    return productionUrl || 'https://www.renewly.in'
  }

  // Development/local: use request origin, then configured app URL, then localhost
  return (
    normalizeBaseUrl(origin) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    'http://localhost:3000'
  )
}

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
 * Build family invite URL from token using environment-aware base URL
 * 
 * In Preview, returns preview domain URL
 * In Production, returns production domain URL
 * Token is included as query parameter (not exposed in logs)
 */
export function buildFamilyInviteUrl(token: string, origin?: string | null): string {
  const baseUrl = getInviteBaseUrl(origin)
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

