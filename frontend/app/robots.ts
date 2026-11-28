import { MetadataRoute } from 'next';

// No trailing slash: a trailing slash here produced `Sitemap: https://host//sitemap.xml`
// in robots.txt, and the Host directive must be a bare hostname (no scheme, no slash).
const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/tools',
          '/features',
          '/guide',
          '/analyzer',
          '/remove-background',
          '/presets',
          '/pricing',
          '/blog',
          '/blog/',
          '/blog/*',
          '/privacy',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/processor',
          '/referral',
          '/login',
          '/register',
          '/share',
          '/share/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/tools',
          '/features',
          '/guide',
          '/analyzer',
          '/remove-background',
          '/presets',
          '/pricing',
          '/blog',
          '/blog/',
          '/blog/*',
          '/privacy',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/api/*',
          '/login',
          '/register',
          '/share',
          '/share/*',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: new URL(SITE_URL).host,
  };
}
