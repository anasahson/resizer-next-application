import type { Metadata } from 'next';

const title = 'Remove Image Background Online';
const description =
  'Create transparent PNG cutouts from JPEG, PNG, or WebP images with browser-based AI. Your image stays on your device.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['remove image background', 'transparent PNG maker', 'AI background remover'],
  alternates: { canonical: '/remove-background' },
  openGraph: {
    title,
    description,
    url: '/remove-background',
    type: 'website',
  },
};

export default function RemoveBackgroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
