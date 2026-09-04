import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Resizer.io — Free Online Image Resizer, Compressor & Converter",
    template: "%s | Resizer.io",
  },
  description:
    "Resize, compress and convert images online for free — no upload, 100% private. Supports WebP, AVIF, JPG, PNG. Batch process up to 50 images instantly.",
  keywords: [
    "image resizer", "resize image online", "free image compressor", "image converter",
    "compress image", "webp converter", "avif converter", "batch image resize",
    "online image editor", "reduce image size", "jpg to webp", "png compressor",
    "image optimizer", "photo resizer", "resize photo online free"
  ],
  authors: [{ name: "Resizer.io" }],
  creator: "Resizer.io",
  metadataBase: new URL("https://resizer.io"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "Resizer.io — Free Online Image Resizer & Compressor",
    description:
      "Resize, compress & convert images for free. No upload needed — runs entirely in your browser. Supports WebP, AVIF, JPG, PNG with batch processing.",
    url: "https://resizer.io",
    siteName: "Resizer.io",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Resizer.io — Free Online Image Resizer" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resizer.io — Free Online Image Resizer & Compressor",
    description:
      "Resize, compress & convert images for free. No upload needed — 100% private. WebP, AVIF, JPG, PNG.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface text-primary dark:bg-zinc-950 dark:text-white transition-colors duration-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
