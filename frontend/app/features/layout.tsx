import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Product Image Editing Features — Resizer AI',
  description:
    "Explore Resizer AI's product image workflow: resize, crop, compress, batch process, and export modern image formats with clear processing details.",
  keywords: [
    'image resizing features',
    'sharp engine',
    'libvips image processing',
    'product image editing',
    'image format conversion',
    'batch image pipeline',
  ],
  alternates: {
    canonical: '/features',
  },
  openGraph: {
    title: 'Product Image Editing Features — Resizer AI',
    description:
      'Explore tools for resizing, cropping, compressing, batch processing, and converting product images.',
    url: '/features',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
