import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizora.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tools', '/features', '/pricing', '/blog', '/privacy'],
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/processor',
          '/referral',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/tools', '/features', '/pricing', '/blog', '/privacy'],
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
