import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Plans — Free In-Browser Processing & Batch Upgrades',
  description:
    'Simple, transparent pricing for creators, marketers, and developers. Free unlimited in-browser image resizing forever, with Pro and Business tiers for high-throughput batch and API pipelines.',
  keywords: [
    'image resizer pricing',
    'free image resizer',
    'bulk image resize plan',
    'image processing subscription',
    'image api pricing',
  ],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing & Plans — Resizora Image Optimizer',
    description:
      'Free in-browser image resizing forever. Upgrade to Pro for high-speed batch and cloud Sharp workflows.',
    url: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
