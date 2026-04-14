// Root layout - Renewly subscription management app
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ToastContainer } from '@/components/toast-container'
import { ThemeProvider } from '@/components/theme-provider'
import { AmbientBackground } from '@/components/ambient-background'
import './globals.css'
import { PreferencesBridge } from '@/components/preferences-bridge'


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
  metadataBase: new URL('https://www.renewly.in'),
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
      url: 'https://www.renewly.in',
    },
  }

  return (
    <html
      lang="en"
      className={initialTheme === 'dark' ? 'dark' : ''}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function () {
    try {
      var cookieMatch = document.cookie.match(/(?:^|; )renewly-theme=(light|dark)/);
      var theme = cookieMatch ? cookieMatch[1] : null;

      if (!theme) {
        theme = localStorage.getItem('renewly-theme');
      }

      if (!theme) {
        var store = localStorage.getItem('renewly-store');
        if (store) {
          var parsed = JSON.parse(store);
          var state = parsed && parsed.state ? parsed.state : null;
          theme =
            (state && state.theme) ||
            (state && state.notificationSettings && state.notificationSettings.theme) ||
            'dark';
        }
      }

      theme = theme || 'dark';

      var root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }

      root.dataset.theme = theme;
    } catch (e) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="renewly-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PreferencesBridge />
          {/* Global ambient background - flowing silk ribbons */}
          <AmbientBackground />
          {children}
          <ToastContainer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
