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
 * The directory links are backed by real tool routes and studio destinations.
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
        'Adjust compression quality to manage output file size',
        'Resize by pixels or percentage with fit-mode control',
        'Batch convert and compress multiple images at once',
        'Rotate, flip, crop, watermark and filter images',
        'Strip EXIF metadata for privacy',
        'Convert PDF pages to PNG, JPEG, and WebP images',
      ],
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE_URL}/tools#tools`,
      name: 'Resizer AI image tools',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: 5,
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
        {
          '@type': 'ListItem',
          position: 5,
          name: 'PDF to images',
          description: 'Render each PDF page as a PNG, JPEG, or WebP image in the browser.',
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
  title: 'Online Image Tools — Convert, Compress, Resize & PDF to Images',
  description:
    'Free image conversion, compression, and PDF-to-image tools. Convert between WebP, AVIF, PNG, JPG, turn PDF pages into images, and batch resize in your browser.',
  keywords: [
    'image tools',
    'convert to webp',
    'convert to avif',
    'convert to png',
    'convert to jpg',
    'compress image online',
    'batch image converter',
    'online photo tools',
    'pdf to images',
    'convert pdf to png',
    'pdf to jpeg',
  ],
  alternates: {
    canonical: '/tools',
  },
  openGraph: {
    title: 'Online Image Tools — Convert, Compress, Resize & PDF to Images',
    description:
      'Free image conversion, compression, and PDF-to-image tools. High efficiency WebP, AVIF, and PDF page export in your browser.',
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
