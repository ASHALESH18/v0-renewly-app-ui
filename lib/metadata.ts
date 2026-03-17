import type { Metadata } from 'next'

const baseUrl = 'https://renewly.app'

export const baseMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Renewly - Own Every Renewal',
    template: '%s | Renewly',
  },
  description: 'Track, understand, and reduce every recurring payment. Premium subscription management for the discerning individual.',
  keywords: [
    'subscription tracking',
    'recurring payments',
    'subscription management',
    'fintech',
    'money management',
    'budget tracking',
  ],
}

export function generatePageMetadata(
  title: string,
  description: string,
  ogImage?: string
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: baseUrl,
      siteName: 'Renewly',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export const authPageMetadata = {
  signIn: generatePageMetadata(
    'Sign In - Renewly',
    'Access your subscription dashboard and manage your recurring payments.'
  ),
  signUp: generatePageMetadata(
    'Create Account - Renewly',
    'Start tracking and managing your subscriptions with premium intelligence.'
  ),
  forgotPassword: generatePageMetadata(
    'Reset Password - Renewly',
    'Reset your password to regain access to your Renewly account.'
  ),
}
