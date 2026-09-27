import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Blog & Image Optimization Guides — Resizora',
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
    title: 'Engineering Blog & Image Optimization Guides — Resizora',
    description:
      'Learn modern image compression, codec comparisons, and responsive picture techniques from Resizora engineers.',
    url: '/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
