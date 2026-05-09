/**
 * Simple deterministic hash function for consistent avatar generation
 * No external dependencies needed.
 *
 * Important:
 * This function must never crash if an avatar seed is missing.
 * Settings/Header/Profile can load before profile/email/avatar data is fully ready.
 */

export function hash(value: unknown): number {
  const str =
    typeof value === 'string' && value.trim().length > 0
      ? value
      : 'default'

  let result = 0

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    result = ((result << 5) - result) + char
    result = result & result
  }

  return Math.abs(result)
}