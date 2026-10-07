import type { Metadata } from 'next';

/**
 * The user dashboard is private (behind JWT auth) and contains no indexable
 * content, so it must never appear in search results. robots.ts also
 * disallows /dashboard for crawler-budget hygiene; this meta tag is the
 * authoritative "do not index this document" signal.
 */
export const metadata: Metadata = {
  title: 'Your Dashboard',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nocache: true,
    },
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}