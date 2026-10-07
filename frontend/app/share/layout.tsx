import type { Metadata } from 'next';

/**
 * Shared-image pages are token-gated, thin, single-image pages. They should
 * not be crawled or indexed (the image itself is the shareable asset).
 */
export const metadata: Metadata = {
  title: 'Shared Image',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}