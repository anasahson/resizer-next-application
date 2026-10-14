import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

/**
 * Structured data for the /tools hub.
 *
 * Deliberately static (no fetch): these runs inside a server component that is
 * prerendered at build time. A data fetch here would flip /tools back to
 * dynamic rendering, which is exactly the regression fixed in PostHogProvider
 * that made this page invisible to crawlers.
 *
 * Every URL listed below is a real anchor on the page (the four tool tabs), so
 * the markup can never advertise a link that 404s.
 */
const toolsSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/tools#webapp`,
      name: 'Resizer AI Image Tools',
      url: `${SITE_URL}/tools`,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires a modern browser with Canvas support',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Convert images to WebP, AVIF, PNG and JPG',
        'Compress images up to 90% without visible quality loss',
        'Resize by pixels or percentage with fit-mode control',
        'Batch convert and compress multiple images at once',
        'Rotate, flip, crop, watermark and filter images',
        'Strip EXIF metadata for privacy',
      ],
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/tools#tools`,
      name: 'Resizer AI image tools',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: 4,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Image converter — WebP, AVIF, PNG, JPG',
          description: 'Convert between modern and legacy image formats directly in your browser.',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Image compressor',
          description: 'Reduce image file size with quality, progressive and metadata controls.',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Image resizer',
          description: 'Resize images by exact pixel dimensions or percentage, with fit modes.',
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Batch processor',
          description: 'Convert, compress and resize many images at once, then export as a ZIP.',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}/tools#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Image Tools', item: `${SITE_URL}/tools` },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'Online Image Tools — Convert to WebP, AVIF, PNG, JPG & Batch Compress',
  description:
    'Free image conversion and compression tools. Convert between WebP, AVIF, PNG, JPG, and HEIC, compress photos up to 90%, and batch resize images in your browser.',
  keywords: [
    'image tools',
    'convert to webp',
    'convert to avif',
    'convert to png',
    'convert to jpg',
    'compress image online',
    'batch image converter',
    'online photo tools',
  ],
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    title: 'Online Image Tools — Convert to WebP, AVIF, PNG, JPG & Batch Compress',
    description:
      'Free image conversion and compression tools. High efficiency WebP & AVIF conversion directly in your browser.',
    url: '/tools',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Structured data for crawlers — emitted from a server component so it is
          present in the prerendered HTML, not added after hydration. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }}
      />
      {children}
    </>
  );
}
