import type { BillingCycle, SubscriptionCategory } from '@/lib/types'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface SubscriptionValidationErrors {
  serviceName?: string
  amount?: string
  billingCycle?: string
  renewalDate?: string
  category?: string
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

/**
 * Validate subscription form fields
 */
export function validateSubscriptionForm({
  serviceName,
  amount,
  billingCycle,
  renewalDate,
  category,
  isCustom = false,
}: {
  serviceName?: string
  amount?: string
  billingCycle?: BillingCycle
  renewalDate?: string
  category?: SubscriptionCategory
  isCustom?: boolean
}): SubscriptionValidationErrors {
  const errors: SubscriptionValidationErrors = {}

  // Service name validation (only for custom subscriptions)
  if (isCustom && !serviceName?.trim()) {
    errors.serviceName = 'Enter a service name'
  }

  // Amount validation
  if (!amount || amount.trim() === '') {
    errors.amount = 'Enter an amount'
  } else {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) {
      errors.amount = 'Enter a valid number'
    } else if (numAmount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    }
  }

  // Billing cycle validation
  if (!billingCycle) {
    errors.billingCycle = 'Choose a billing cycle'
  }

  // Renewal date validation
  if (!renewalDate || renewalDate.trim() === '') {
    errors.renewalDate = 'Choose a renewal date'
  } else {
    // Validate it's a valid date
    const date = new Date(renewalDate)
    if (isNaN(date.getTime())) {
      errors.renewalDate = 'Enter a valid date'
    }
  }

  // Category validation
  if (!category) {
    errors.category = 'Choose a category'
  }

  return errors
}

/**
 * Get the first invalid field key in order
 */
export function getFirstInvalidField(errors: SubscriptionValidationErrors): keyof SubscriptionValidationErrors | null {
  const fieldOrder: (keyof SubscriptionValidationErrors)[] = [
    'serviceName',
    'amount',
    'billingCycle',
    'renewalDate',
    'category',
  ]

  for (const field of fieldOrder) {
    if (errors[field]) {
      return field
    }
  }

  return null
}
