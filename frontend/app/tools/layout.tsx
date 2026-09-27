import type { Metadata } from 'next';

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
  return <>{children}</>;
}
