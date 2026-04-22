// Root layout - Renewly subscription management app
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastContainer } from '@/components/toast-container'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeSyncEffect } from '@/components/theme-sync-effect'
import { AmbientBackground } from '@/components/ambient-background'
import { SubscriptionsProvider } from '@/components/providers/subscriptions-provider'
import './globals.css'
import { PreferencesBridge } from '@/components/preferences-bridge'

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
    'Track, understand, and reduce every recurring payment with elegance. Premium subscription intelligence for the discerning individual. Manage your subscriptions effortlessly.',
  keywords: [
    'subscription tracking',
    'recurring payments',
    'subscription management',
    'fintech',
    'financial intelligence',
    'money management',
    'subscription cancellation',
    'budget tracking',
    'expense management',
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
        sizes: '32x32',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        sizes: '32x32',
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
    canonical: 'https://www.renewly.in',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F2E9' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0D' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieTheme = cookieStore.get('renewly-theme')?.value
  
  // Normalize to one of the 4 temporary variants:
  //   old-light | old-dark | light-e | dark-e
  // Legacy 'light'/'dark' cookies map to old-light/old-dark so existing
  // users keep seeing their current theme until they opt into E.
  const themeMap: Record<string, string> = {
    'old-light': 'old-light',
    'old-dark': 'old-dark',
    'light-e': 'light-e',
    'dark-e': 'dark-e',
    'light': 'old-light',
    'dark': 'old-dark',
  }
  const currentThemeId = themeMap[cookieTheme ?? ''] ?? 'dark-e'
  
  // Determine if dark mode based on theme ID
  const isDark = currentThemeId === 'old-dark' || currentThemeId === 'dark-e'

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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2400',
    },
    author: {
      '@type': 'Organization',
      name: 'Renewly',
      url: 'https://www.renewly.in',
    },
  }

  return (
    <html
      lang="en"
      className={isDark ? 'dark' : ''}
      data-theme-variant={currentThemeId}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function () {
    try {
      // Theme system fix: use data-theme-variant instead of multi-word class strings
      // Map theme IDs to their dark mode status
      var modeMap = {
        'old-light': false,
        'old-dark': true,
        'light-e': false,
        'dark-e': true,
        'light': false,
        'dark': true
      };

      var cookieMatch = document.cookie.match(/(?:^|; )renewly-theme=([^;]+)/);
      var theme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

      if (!theme) {
        theme = localStorage.getItem('renewly-theme');
      }

      if (!theme) {
        var store = localStorage.getItem('renewly-store');
        if (store) {
          try {
            var parsed = JSON.parse(store);
            var state = parsed && parsed.state ? parsed.state : null;
            theme =
              (state && state.theme) ||
              (state && state.notificationSettings && state.notificationSettings.theme) ||
              null;
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      }

      if (!modeMap.hasOwnProperty(theme)) {
        theme = 'dark-e';
      }

      var root = document.documentElement;
      var isDark = modeMap[theme];
      
      // Set .dark class based on mode
      root.classList.remove('dark');
      if (isDark) {
        root.classList.add('dark');
      }
      
      // Set data-theme-variant attribute
      root.setAttribute('data-theme-variant', theme);
      root.dataset.theme = theme;
    } catch (e) {
      // Fallback to dark-e
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme-variant', 'dark-e');
      document.documentElement.dataset.theme = 'dark-e';
    }
  })();
`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background min-h-screen overflow-x-hidden`}
      >
        <ThemeProvider>
          <ThemeSyncEffect />
          <SubscriptionsProvider>
            <PreferencesBridge />
            <div className="relative isolate min-h-screen overflow-x-hidden">
              <AmbientBackground />
              <div className="relative z-10">
                {children}
                <ToastContainer />
              </div>
            </div>
          </SubscriptionsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
