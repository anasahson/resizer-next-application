import type { Metadata } from 'next';
import { CURRENT_ACTIVE_BLOG_SLUGS } from '../sitemap';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

/**
 * Structured data for the /blog index.
 *
 * Static by design: this runs in a server component that is prerendered at
 * build time. Fetching posts here would turn /blog dynamic again — the exact
 * regression that made every static page invisible to crawlers. It also reuses
 * CURRENT_ACTIVE_BLOG_SLUGS from app/sitemap.ts, so the markup can only ever
 * advertise URLs that are already declared live in the sitemap.
 */
const blogSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/blog#page`,
      url: `${SITE_URL}/blog`,
      name: 'Engineering Blog & Image Optimization Guides',
      description:
        'In-depth guides on image compression codecs, WebP vs AVIF benchmarks, Core Web Vitals LCP optimization, and Node.js image processing pipelines.',
      isPartOf: { '@id': `${SITE_URL}/blog#website` },
      inLanguage: 'en',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/blog#website`,
      url: SITE_URL,
      name: 'Resizer AI',
      publisher: { '@id': `${SITE_URL}/blog#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/blog#organization`,
      name: 'Resizer AI',
      url: SITE_URL,
      // No `logo` here on purpose: /og-image.png is not in public/, so pointing
      // at it would advertise a 404 to crawlers. Omitted rather than wrong.
    },
    {
      '@type': 'Blog',
      '@id': `${SITE_URL}/blog#blog`,
      url: `${SITE_URL}/blog`,
      name: 'Resizer AI Engineering Blog',
      description:
        'Technical articles on image compression, codec selection, performance budgets and responsive image delivery.',
      publisher: { '@id': `${SITE_URL}/blog#organization` },
      isPartOf: { '@id': `${SITE_URL}/blog#website` },
      inLanguage: 'en',
      blogPost: CURRENT_ACTIVE_BLOG_SLUGS.map((slug, index) => ({
        '@type': 'BlogPosting',
        position: index + 1,
        url: `${SITE_URL}/blog/${slug}`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
      })),
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/blog#posts`,
      name: 'Latest articles',
      numberOfItems: CURRENT_ACTIVE_BLOG_SLUGS.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: CURRENT_ACTIVE_BLOG_SLUGS.map((slug, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/blog/${slug}`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/blog#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'Engineering Blog & Image Optimization Guides — Resizer AI',
  description:
    'In-depth guides on image compression codecs, WebP vs AVIF benchmarks, Core Web Vitals LCP optimization, and Node.js Sharp processing pipelines.',
  keywords: [
    'image optimization blog',
    'webp vs avif',
    'core web vitals lcp image',
    'sharp image tutorial',
    'image compression techniques',
    'libvips benchmarks',
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Engineering Blog & Image Optimization Guides — Resizer AI',
    description:
      'Learn modern image compression, codec comparisons, and responsive picture techniques from Resizer AI engineers.',
    url: '/blog',
    siteName: 'Resizer AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engineering Blog & Image Optimization Guides — Resizer AI',
    description: 'Modern image compression, codec comparisons and responsive picture techniques.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Structured data for crawlers — emitted from a server component so it is
          present in the prerendered HTML, not added after hydration. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      {children}
    </>
  );
}
