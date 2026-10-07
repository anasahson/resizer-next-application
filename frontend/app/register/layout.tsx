import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create Free Account",
  description: "Create a free Resizora account to keep your workspace and batch settings. Resizing, compression, and conversion stay in your browser.",
  alternates: { canonical: "/register" },
  // Same as /login — no thin/duplicate auth pages in the index.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
