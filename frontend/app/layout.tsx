import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import PostHogProvider from "./components/PostHogProvider";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || "https://resizer-ai.com").replace(/\/+$/, "");

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
    default: "Image Resizer — AI Resize, Compress, and Convert | Resizer AI",
    template: "%s | Resizer AI Image Resizer",
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
  authors: [{ name: "Resizer AI Engineering", url: SITE_URL }],
  creator: "Resizer AI",
  publisher: "Resizer AI",
  applicationName: "Resizer AI Image Studio",
  category: "MultimediaApplication",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Image Resizer — Free Online Image Resize, Compressor & Converter",
    description:
      "Resize, compress & convert images for free in your browser. Exact pixel dimensions, percentage scaling, WebP/AVIF support, and batch processing up to 50 photos.",
    url: SITE_URL,
    siteName: "Resizer AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Resizer AI — Free Online Image Resizer & Compressor",
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
    creator: "@resizer_ai",
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
  
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: "Resizer AI — Free Online Image Resizer & Compressor",
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
      name: "Resizer AI",
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
          text: "Upload or drag and drop your JPG, PNG, WebP, or AVIF image files into the Resizer AI Image Resizer.",
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
      "@type": "ItemList",
      "@id": `${SITE_URL}/#dimensions-presets`,
      name: "Popular Presets & Dimensions: Recommended Dimensions for Social Media & Web",
      description: "Official guide to standard pixel dimensions, aspect ratios, and resolutions for social networks, web banners, e-commerce, and passport photos.",
      numberOfItems: 12,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Instagram Square Post",
          description: "1080 × 1080 pixels (1:1 aspect ratio). Best format: WebP or JPG.",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Instagram Story, Reel & TikTok Video",
          description: "1080 × 1920 pixels (9:16 vertical aspect ratio). Best format: WebP or JPG.",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "YouTube Video Thumbnail",
          description: "1280 × 720 pixels (16:9 widescreen aspect ratio). Best format: WebP or JPG under 2MB.",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "YouTube Channel Banner",
          description: "2560 × 1440 pixels (16:9 aspect ratio). Best format: PNG or WebP under 6MB.",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Facebook Post & Shared Image",
          description: "1200 × 630 pixels (1.91:1 landscape aspect ratio). Best format: PNG or JPG.",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "X / Twitter In-Stream Post",
          description: "1200 × 675 pixels (16:9 aspect ratio). Best format: WebP or JPG.",
        },
        {
          "@type": "ListItem",
          position: 7,
          name: "LinkedIn Company Banner",
          description: "1584 × 396 pixels (4:1 panoramic aspect ratio). Best format: PNG or JPG.",
        },
        {
          "@type": "ListItem",
          position: 8,
          name: "Amazon & Shopify Product Listing",
          description: "2000 × 2000 pixels (1:1 high resolution square for zoom). Best format: WebP or JPG.",
        },
        {
          "@type": "ListItem",
          position: 9,
          name: "US Official Passport Photo",
          description: "600 × 600 pixels (2×2 inches at 300 DPI, 1:1 square). Best format: JPG.",
        },
        {
          "@type": "ListItem",
          position: 10,
          name: "Schengen & UK Passport Photo",
          description: "413 × 531 pixels (35×45 mm at 300 DPI). Best format: JPG.",
        },
        {
          "@type": "ListItem",
          position: 11,
          name: "4K Ultra HD Display Wallpaper",
          description: "3840 × 2160 pixels (16:9 aspect ratio). Best format: AVIF or WebP.",
        },
        {
          "@type": "ListItem",
          position: 12,
          name: "Full HD 1080p Standard Display",
          description: "1920 × 1080 pixels (16:9 aspect ratio). Best format: AVIF or WebP.",
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
            text: "Drag and drop your image into the Resizer AI Image Resizer, enter your custom width and height in pixels (or scale by percentage), choose your preferred format like WebP or JPG, and click Download to save the resized image instantly.",
          },
        },
        {
          "@type": "Question",
          name: "Will resizing an image reduce its quality?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Resizer AI uses advanced bicubic and Lanczos resampling algorithms alongside fine-tuned quantization to ensure maximum sharpness, edge definition, and accurate color preservation during resizing and compression.",
          },
        },
        {
          "@type": "Question",
          name: "Can I batch resize multiple images at once?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! You can upload up to 50 images at once. Resizer AI processes each file in parallel and allows you to download all resized images individually or packaged into a single ZIP file.",
          },
        },
        {
          "@type": "Question",
          name: "Is my data private and secure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, 100%. Resizer AI runs local browser canvas and WebAssembly algorithms directly on your machine. Your images and personal photos are never uploaded to remote servers or stored in any database.",
          },
        },
        {
          "@type": "Question",
          name: "What image formats are supported for resizing and conversion?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Resizer AI supports JPEG, JPG, PNG, WebP, AVIF, HEIC, GIF, and BMP. You can cross-convert between any of these formats with customizable compression levels.",
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

      <body className="min-h-full flex flex-col bg-surface text-primary dark:bg-zinc-950 dark:text-white transition-colors duration-300">
        <AuthProvider>
          <Suspense fallback={null}>
            <PostHogProvider>
              <Navbar />
              <main className="flex-1 pt-16">
                {children}
              </main>
              <Footer />
            </PostHogProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
