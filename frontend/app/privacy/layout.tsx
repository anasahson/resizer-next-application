import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Image Processing & Data Use | Resizer AI',
  description:
    'Learn how Resizer AI processes image files, records limited processing metadata, and handles optional provider-backed AI requests.',
  keywords: [
    'private image resizer',
    'zero upload image resizer',
    'image privacy',
    'gdpr image resizer',
    'in browser image converter',
  ],
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy — Resizer AI',
    description:
      'Learn how Resizer AI handles image processing, analytics and optional AI providers.',
    url: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
