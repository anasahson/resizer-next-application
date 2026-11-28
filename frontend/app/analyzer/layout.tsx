import type { Metadata } from 'next';

const title = 'Image SEO Analyzer — Audit Alt Text, Dimensions & Formats';
const description =
  'Check image markup for missing alt text, undeclared dimensions, format choices, and lazy-loading hints. Analyze pasted or uploaded HTML locally in your browser.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['image SEO analyzer', 'image alt text checker', 'HTML image audit', 'image markup checker'],
  alternates: { canonical: '/analyzer' },
  openGraph: {
    title,
    description,
    url: '/analyzer',
    type: 'website',
  },
};

export default function AnalyzerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
