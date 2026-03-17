import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/auth/', '/'],
        disallow: ['/api/', '/admin/', '/app/'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/auth/', '/'],
        disallow: ['/api/', '/admin/', '/app/'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/auth/', '/'],
        disallow: ['/api/', '/admin/', '/app/'],
      },
    ],
    sitemap: 'https://renewly.app/sitemap.xml',
  }
}
