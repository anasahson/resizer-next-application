import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features & Architecture — High-Speed libvips & In-Browser Processing',
  description:
    "Explore Resizora's performance architecture: 100% private client-side processing, sub-millisecond libvips Sharp engine, WebP and AVIF quantization, and batch workflows.",
  keywords: [
    'image resizing features',
    'sharp engine',
    'libvips image processing',
    'client-side image resizer',
    'lossless image quantization',
    'batch image pipeline',
  ],
  alternates: {
    canonical: '/features',
  },
  openGraph: {
    title: 'Features & Architecture — Resizora Image Processing',
    description:
      'Explore our high-speed image processing features: in-browser security, sub-millisecond engine, and next-gen format conversion.',
    url: '/features',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
