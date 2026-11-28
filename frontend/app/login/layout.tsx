import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Resizer AI account to manage saved presets and batch history. Image processing uses the configured backend with a browser fallback.",
  alternates: { canonical: "/login" },
  // Auth screens have no search value and must stay out of the index.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
