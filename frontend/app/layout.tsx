import type { Metadata, Viewport } from "next";
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

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "https://resizora.com";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Image Resizer — Free Online Image Resize, Compressor & Converter | Resizora",
    template: "%s | Resizora Image Resizer",
  },
  description:
    "Free online image resizer to resize images by pixels or percentage, compress file size without losing quality, and convert between WebP, AVIF, PNG, and JPG. 100% private in-browser processing with bulk batch support.",
  keywords: [
    "image resize",
    "resize image",
    "image resizer",
    "free image resizer",
    "resize image online",
    "resize photo",
    "photo resizer",
    "resize picture",
    "online image resizer",
    "reduce image size in kb",
    "image dimension changer",
    "batch image resizer",
    "bulk image resize",
    "image compressor",
    "compress image online",
    "convert image to webp",
    "convert jpg to png",
    "png to webp converter",
    "avif converter",
    "social media image resizer",
    "instagram photo resizer",
    "youtube thumbnail resizer",
    "crop and resize image",
    "high quality image resize",
    "pixel resizer",
    "lossless image compression",
    "free online photo editor",
  ],
  authors: [{ name: "Resizora Engineering", url: SITE_URL }],
  creator: "Resizora",
  publisher: "Resizora",
  applicationName: "Resizora Image Studio",
  category: "MultimediaApplication",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Image Resizer — Free Online Image Resize, Compressor & Converter",
    description:
      "Resize, compress & convert images for free in your browser. Exact pixel dimensions, percentage scaling, WebP/AVIF support, and batch processing up to 50 photos.",
    url: SITE_URL,
    siteName: "Resizora",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Resizora — Free Online Image Resizer & Compressor",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Resizer — Free Online Image Resize, Compressor & Converter",
    description:
      "Resize, compress & convert images online for free. 100% private in-browser engine. WebP, AVIF, JPG, PNG.",
    images: ["/og-image.png"],
    creator: "@resizora",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-token",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "Resizora — Free Online Image Resizer & Compressor",
      url: SITE_URL,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All (Web Browser, Chrome, Firefox, Safari, Edge, Mobile)",
      browserRequirements: "Requires HTML5 Canvas and JavaScript enabled.",
      description:
        "Free online tool to resize images in exact pixels or percentage, compress file sizes up to 90% without quality loss, and convert between WebP, AVIF, JPG, PNG, and HEIC.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "3420",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "Resize images by exact pixels (width and height)",
        "Resize images by scale percentage (25%, 50%, 75%, 200%)",
        "Lock aspect ratio to prevent distortion",
        "Lossless and lossy compression with fine-grained quality control",
        "Convert to WebP, AVIF, PNG, JPEG, and HEIC",
        "Batch image resize up to 50 photos simultaneously",
        "Client-side 100% private processing without server uploads",
        "Preset dimensions for Instagram, YouTube, Facebook, Twitter, and LinkedIn",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Resizora",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    {
      "@type": "HowTo",
      name: "How to Resize an Image Online for Free",
      description: "Quick 3-step guide to resizing images and photos to exact pixel dimensions online.",
      step: [
        {
          "@type": "HowToStep",
          name: "Upload or Drag & Drop Photos",
          text: "Upload or drag and drop your JPG, PNG, WebP, or AVIF image files into the Resizora Image Resizer.",
          position: 1,
        },
        {
          "@type": "HowToStep",
          name: "Select Target Dimensions or Social Media Preset",
          text: "Enter your target width and height in pixels, choose a percentage scale, or pick a preset like Instagram Post, YouTube Thumbnail, or Passport Photo.",
          position: 2,
        },
        {
          "@type": "HowToStep",
          name: "Download the Resized Image",
          text: "Select your desired output format (WebP, AVIF, JPG, PNG) and compression quality, then click Download to get your resized image instantly.",
          position: 3,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I resize an image online for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Drag and drop your image into the Resizora Image Resizer, enter your custom width and height in pixels (or scale by percentage), choose your preferred format like WebP or JPG, and click Download to save the resized image instantly.",
          },
        },
        {
          "@type": "Question",
          name: "Will resizing an image reduce its quality?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Resizora uses advanced bicubic and Lanczos resampling algorithms alongside fine-tuned quantization to ensure maximum sharpness, edge definition, and accurate color preservation during resizing and compression.",
          },
        },
        {
          "@type": "Question",
          name: "Can I batch resize multiple images at once?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! You can upload up to 50 images at once. Resizora processes each file in parallel and allows you to download all resized images individually or packaged into a single ZIP file.",
          },
        },
        {
          "@type": "Question",
          name: "Is my data private and secure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, 100%. Resizora runs local browser canvas and WebAssembly algorithms directly on your machine. Your images and personal photos are never uploaded to remote servers or stored in any database.",
          },
        },
        {
          "@type": "Question",
          name: "What image formats are supported for resizing and conversion?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Resizora supports JPEG, JPG, PNG, WebP, AVIF, HEIC, GIF, and BMP. You can cross-convert between any of these formats with customizable compression levels.",
          },
        },
      ],
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
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
