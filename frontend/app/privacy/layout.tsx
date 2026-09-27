import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero-Cloud Security — 100% In-Browser Privacy',
  description:
    'Our strict privacy commitment: your images never leave your browser. Zero server uploads, zero telemetry on your photos, and 100% client-side WebAssembly execution.',
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
    title: 'Privacy Policy — Resizora Zero-Knowledge Image Studio',
    description:
      'Learn how Resizora protects your privacy with 100% client-side in-browser image optimization.',
    url: '/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
