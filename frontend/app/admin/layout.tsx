import type { Metadata } from 'next';

/**
 * SuperAdmin control center — strictly internal. Never index, never follow
 * links out of it, and never index any images rendered inside it.
 */
export const metadata: Metadata = {
  title: 'SuperAdmin Control Center',
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}