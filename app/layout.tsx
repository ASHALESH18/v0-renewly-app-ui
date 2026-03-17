import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastContainer } from '@/components/toast-container'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap'
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://renewly.app'),
  title: 'Renewly - Own Every Renewal | Subscription Management',
  description: 'Track, understand, and reduce every recurring payment with elegance. Premium subscription intelligence for the discerning individual. Manage your subscriptions effortlessly.',
  keywords: [
    'subscription tracking',
    'recurring payments',
    'subscription management',
    'fintech',
    'financial intelligence',
    'money management',
    'subscription cancellation',
    'budget tracking',
    'expense management'
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
    url: 'https://renewly.app',
    siteName: 'Renewly',
    title: 'Renewly - Own Every Renewal',
    description: 'Premium subscription tracking and management with intelligent insights.',
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
    description: 'Track and manage all your subscriptions with premium intelligence.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: 'https://renewly.app',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EFE7' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0D' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Renewly',
    description: 'Premium subscription tracking and management platform',
    url: 'https://renewly.app',
    applicationCategory: 'FinanceApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Freemium subscription management service'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2400',
    },
    author: {
      '@type': 'Organization',
      name: 'Renewly',
      url: 'https://renewly.app',
    },
  }

  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <ToastContainer />
        <Analytics />
      </body>
    </html>
  )
}
