import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
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
    default: "Resizer AI — Image Editing Tools",
    template: "%s | Resizer AI",
  },
  description:
    "Resize, crop, compress, and convert images with a practical toolkit for product photos, online stores, and everyday creative work.",
  keywords: [
    "image resizer",
    "image editing tools",
    "image compressor",
    "batch image processing",
    "product image optimization",
    "convert image formats",
    "avif converter",
    "pdf to images",
  ],
  authors: [{ name: "Resizer AI Engineering", url: SITE_URL }],
  creator: "Resizer AI",
  publisher: "Resizer AI",
  applicationName: "Resizer AI Image Studio",
  category: "MultimediaApplication",
  openGraph: {
    title: "Resizer AI — Image Editing Tools",
    description:
      "Resize, crop, compress, and convert images with a toolkit built for product photos, online stores, and everyday creative work.",
    siteName: "Resizer AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Resizer AI — resize, compress and convert images, and turn PDF pages into images",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resizer AI — Image Editing Tools",
    description:
      "Resize, crop, compress, and convert images with a toolkit built for product photos and online stores.",
    images: ["/opengraph-image"],
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
        "Free online tools to resize, crop, compress, and convert product images. Core processing uses the configured service with a browser fallback.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Resize images by exact pixels (width and height)",
        "Resize images by scale percentage (25%, 50%, 75%, 200%)",
        "Lock aspect ratio to prevent distortion",
        "Lossless and lossy compression with fine-grained quality control",
        "Convert to WebP, AVIF, PNG, JPEG, and HEIC",
        "Batch image resize up to 50 photos simultaneously",
        "Configured image processing with a browser fallback",
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
        url: `${SITE_URL}/opengraph-image`,
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
            text: "Image processing uses the configured backend with a browser fallback. The app does not permanently store image files, but processing metadata may be recorded. Optional AI background removal sends the selected image to its provider when you submit it.",
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
              <SiteChrome>{children}</SiteChrome>
            </PostHogProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
