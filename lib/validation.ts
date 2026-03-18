export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  return { isValid: true }
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }
  return { isValid: true }
}

export function validatePasswordMatch(password: string, confirmPassword: string): ValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  return { isValid: true }
}

export function validateFullName(name: string): ValidationResult {
  if (!name) {
    return { isValid: false, error: 'Full name is required' }
  }
  if (name.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters' }
  }
  if (name.length > 100) {
    return { isValid: false, error: 'Full name must be less than 100 characters' }
  }
  return { isValid: true }
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let strength = 0
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 3) return 'medium'
  return 'strong'
}
