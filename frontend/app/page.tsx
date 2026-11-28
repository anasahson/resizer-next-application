import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

const title = 'Free Online Image Resizer & Compressor for Product Photos | Resizer AI';
const description =
  'Resize product photos for stores, marketplaces, and the web. Batch crop, compress, and convert images to WebP or AVIF, then download ready-to-publish files.';

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    'product image resizer',
    'image resizer online',
    'resize product photos',
    'ecommerce image optimizer',
    'compress product images',
    'batch image resizer',
    'convert images to WebP',
    'convert images to AVIF',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: 'Resizer AI',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Resizer AI product image workspace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
