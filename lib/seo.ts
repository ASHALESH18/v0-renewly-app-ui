// SEO Best Practices Configuration for Renewly

export const SEO_CONFIG = {
  // Core SEO Settings
  siteName: 'Renewly',
  siteUrl: 'https://renewly.app',
  description: 'Premium subscription tracking and management platform for discerning individuals.',
  
  // Keywords
  primaryKeywords: [
    'subscription tracking',
    'subscription management',
    'recurring payment management',
    'subscription cancellation',
    'expense tracking',
  ],
  
  secondaryKeywords: [
    'fintech',
    'money management',
    'budget tracking',
    'financial intelligence',
    'subscription audit',
    'recurring billing',
  ],
  
  // Author & Organization
  author: 'Renewly',
  organization: {
    name: 'Renewly',
    url: 'https://renewly.app',
    logo: 'https://renewly.app/logo.png',
    description: 'Premium subscription tracking and management',
  },
  
  // Social Media
  socialHandles: {
    twitter: '@renewlyapp',
    linkedin: 'company/renewly',
  },
  
  // Performance & SEO Best Practices
  imageOptimization: {
    format: 'webp',
    sizes: {
      thumbnail: '400px',
      small: '640px',
      medium: '1024px',
      large: '1920px',
    },
  },
  
  // Structured Data
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Renewly',
    description: 'Premium subscription tracking and management platform',
    url: 'https://renewly.app',
    applicationCategory: 'FinanceApplication',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '2400',
    },
  },
}

// Open Graph Defaults
export const OPEN_GRAPH_DEFAULTS = {
  type: 'website',
  locale: 'en_US',
  siteName: 'Renewly',
  images: [
    {
      url: 'https://renewly.app/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Renewly - Premium Subscription Management',
    },
  ],
}

// Twitter Card Defaults
export const TWITTER_DEFAULTS = {
  card: 'summary_large_image',
  creator: '@renewlyapp',
  site: '@renewlyapp',
}

// SEO Best Practices Checklist
export const SEO_CHECKLIST = {
  metadata: [
    'Meta title (50-60 chars)',
    'Meta description (150-160 chars)',
    'Keywords present in content',
    'H1 tag present (only one per page)',
    'Header hierarchy correct (H1 > H2 > H3)',
  ],
  
  performance: [
    'Core Web Vitals optimized',
    'Images optimized and lazy-loaded',
    'CSS and JS minified',
    'Gzip compression enabled',
    'Browser caching configured',
  ],
  
  structure: [
    'Semantic HTML used',
    'Structured data (JSON-LD) added',
    'Mobile-friendly responsive design',
    'Canonical URLs implemented',
    'Internal linking strategy',
  ],
  
  accessibility: [
    'Alt text for all images',
    'ARIA labels where needed',
    'Color contrast sufficient',
    'Keyboard navigation working',
    'Screen reader compatible',
  ],
  
  content: [
    'Original, unique content',
    'Fresh content regularly updated',
    'Readability optimized',
    'User intent addressed',
    'Clear call-to-actions',
  ],
  
  external: [
    'Sitemap.xml created',
    'Robots.txt configured',
    'Google Search Console linked',
    'Google Analytics tracked',
    'Social media integration',
  ],
}

// Pagination & Canonical URLs
export const getCanonicalUrl = (path: string): string => {
  return `${SEO_CONFIG.siteUrl}${path}`
}

// Generate Schema Markup
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SEO_CONFIG.organization.name,
  url: SEO_CONFIG.organization.url,
  logo: SEO_CONFIG.organization.logo,
  description: SEO_CONFIG.organization.description,
  sameAs: [
    `https://twitter.com/${SEO_CONFIG.socialHandles.twitter.replace('@', '')}`,
    `https://linkedin.com/company/${SEO_CONFIG.socialHandles.linkedin.replace('company/', '')}`,
  ],
})

// Generate Breadcrumb Schema
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})
