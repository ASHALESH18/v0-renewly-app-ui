import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'

import { AmbientBackground } from '@/components/ambient-background'
import { PreferencesBridge } from '@/components/preferences-bridge'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastContainer } from '@/components/toast-container'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.renewly.in'),
  title: 'Renewly - Own Every Renewal | Subscription Management',
  description:
    'Track, understand, and reduce every recurring payment with elegance. Premium subscription intelligence for the discerning individual.',
  keywords: [
    'subscription tracking',
    'recurring payments',
    'subscription management',
    'subscription intelligence',
    'budget tracking',
    'expense management',
    'renewal reminders',
  ],
  authors: [{ name: 'Renewly' }],
  creator: 'Renewly',
  publisher: 'Renewly',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.renewly.in',
    siteName: 'Renewly',
    title: 'Renewly - Own Every Renewal',
    description:
      'Premium subscription tracking and management with intelligent insights.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Renewly - Premium Subscription Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Renewly - Own Every Renewal',
    description:
      'Track and manage all your subscriptions with premium intelligence.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', sizes: '32x32', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', sizes: '32x32', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.renewly.in',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F0E6' },
    { media: '(prefers-color-scheme: dark)', color: '#090B11' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies()
  const cookieTheme = cookieStore.get('renewly-theme')?.value
  const initialTheme = cookieTheme === 'light' ? 'light' : 'dark'

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Renewly',
    description: 'Premium subscription tracking and management platform',
    url: 'https://www.renewly.in',
    applicationCategory: 'FinanceApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      description: 'Freemium subscription management service',
    },
    author: {
      '@type': 'Organization',
      name: 'Renewly',
      url: 'https://www.renewly.in',
    },
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={initialTheme}
          enableSystem={false}
          disableTransitionOnChange
        >
          <PreferencesBridge />
          <AmbientBackground />
          <div className="relative z-10">{children}</div>
          <ToastContainer />
          <Analytics />
        </ThemeProvider>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </body>
    </html>
  )
}