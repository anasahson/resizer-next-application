'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  badge?: string;
  description: string;
  highlight: string;
  gradient: string;
  details: string[];
}

const CORE_FEATURES: FeatureItem[] = [
  {
    id: 'privacy-engine',
    icon: '🛡️',
    title: '100% Client-Side Privacy',
    badge: 'Zero Cloud Uploads',
    description: 'All image transformation, cropping, and compression runs completely within your browser using local canvas and WebAssembly engines.',
    highlight: 'Your confidential photos and documents never touch external servers or third-party databases.',
    gradient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
    details: [
      'Zero latency: Instant processing without waiting for upload/download rounds',
      'No data collection or metadata tracking',
      'Works seamlessly offline once cached in browser',
      'Full compliance with GDPR, HIPAA, and strict privacy standards',
    ],
  },
  {
    id: 'nextgen-formats',
    icon: '✨',
    title: 'Next-Gen Format Conversion',
    badge: 'Up to 85% Smaller',
    description: 'Transform images between AVIF, WebP, JPG, PNG, and HEIC instantly with precision quantization algorithms.',
    highlight: 'Drastically reduce page load times and bandwidth consumption without sacrificing visible image fidelity.',
    gradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    details: [
      'AVIF: Superior compression efficiency for modern browsers',
      'WebP: Balanced lightweight standard for all web workflows',
      'PNG: Crisp lossless compression with full alpha channel preservation',
      'JPG/JPEG: Maximum compatibility for legacy systems',
    ],
  },
  {
    id: 'batch-engine',
    icon: '⚡',
    title: 'High-Throughput Batch Processing',
    badge: 'Up to 50 Images',
    description: 'Drag and drop entire folders of assets and resize or convert them simultaneously in parallel threads.',
    highlight: 'Automate repetitive workflows and export all processed assets in one convenient batch.',
    gradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    details: [
      'Multi-image batch queue with thumbnail preview controls',
      'Uniform dimensions or proportion-based batch scaling',
      'Instant memory reclamation to keep browser responsive',
      'One-click multi-file download stream',
    ],
  },
  {
    id: 'smart-presets',
    icon: '📐',
    title: 'Social & Marketplace Presets',
    badge: 'Pixel Perfect',
    description: 'Pre-configured dimension templates for Instagram, X/Twitter, YouTube, LinkedIn, Facebook, and Amazon.',
    highlight: 'No need to memorize complex aspect ratios or recommended platform dimensions.',
    gradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    details: [
      'Instagram Post (1080x1080) & Story (1080x1920)',
      'YouTube Thumbnail (1280x720) & Channel Art',
      'Amazon Product Catalog standard (2000x2000)',
      'Custom width, height, and scale percentage controls',
    ],
  },
  {
    id: 'realtime-estimator',
    icon: '📊',
    title: 'Real-Time Size & Savings Estimator',
    badge: 'Live Calculation',
    description: 'Interactive feedback gives immediate estimates of output file size and bandwidth savings percentage before you export.',
    highlight: 'Fine-tune quality sliders and dimension ratios while watching predicted savings update in real time.',
    gradient: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    details: [
      'Format multiplier and quality percentage calculations',
      'Proportional aspect ratio locks to prevent distortion',
      'Fit, Fill, and Stretch aspect cropping options',
      'Direct before/after dimension readouts',
    ],
  },
  {
    id: 'modern-ux',
    icon: '🎨',
    title: 'Ultra-Clean Responsive UI',
    badge: 'Dark & Light Mode',
    description: 'Fluid dark mode support, glassmorphic headers, drag-and-drop hotzones, and keyboard accessible controls.',
    highlight: 'A polished, modern user experience designed for designers, developers, marketers, and content creators.',
    gradient: 'from-rose-500/20 to-red-500/20 border-rose-500/30',
    details: [
      'Dynamic dark/light theme switcher with persistent settings',
      'Accessible focus states and ARIA labels',
      'Smooth micro-interactions and instant visual feedback',
      'Zero installation, zero accounts, and zero paywalls',
    ],
  },
];

const FORMAT_COMPARISON = [
  {
    format: 'AVIF',
    efficiency: 'Exceptional (90/100)',
    transparency: 'Yes',
    animation: 'Yes',
    browserSupport: '93%+',
    idealFor: 'Next-gen web graphics, maximum size reduction',
    savings: '~70-85%',
  },
  {
    format: 'WebP',
    efficiency: 'Very High (85/100)',
    transparency: 'Yes',
    animation: 'Yes',
    browserSupport: '97%+',
    idealFor: 'Standard web publishing, high compatibility',
    savings: '~60-75%',
  },
  {
    format: 'PNG',
    efficiency: 'Moderate (45/100)',
    transparency: 'Yes (Lossless)',
    animation: 'No (APNG only)',
    browserSupport: '100%',
    idealFor: 'Logos, UI icons, screenshots with sharp text',
    savings: 'Baseline',
  },
  {
    format: 'JPG / JPEG',
    efficiency: 'Good (60/100)',
    transparency: 'No',
    animation: 'No',
    browserSupport: '100%',
    idealFor: 'Photographs, legacy systems, universal print/web',
    savings: '~30-50%',
  },
  {
    format: 'HEIC',
    efficiency: 'Very High (88/100)',
    transparency: 'Yes',
    animation: 'Yes (Live Photos)',
    browserSupport: 'Apple Ecosystem',
    idealFor: 'iPhone camera workflows and Apple device archival',
    savings: '~65-80%',
  },
];

const FAQS = [
  {
    question: 'How does Resizer process files without sending them to a server?',
    answer:
      'Resizer utilizes the modern HTML5 Canvas API and client-side JavaScript within your browser. When you drop an image, the browser decodes the file in local memory, performs bilinear and bicubic resizing or format encoding, and generates a downloadable blob locally. Your files never transit across any network.',
  },
  {
    question: 'What is the difference between WebP and AVIF?',
    answer:
      'AVIF is a newer image format derived from the AV1 video codec that provides 20-30% smaller file sizes than WebP at comparable visual quality. WebP offers broader legacy support, while AVIF is ideal for modern high-performance web applications.',
  },
  {
    question: 'Is there a limit on how many images I can resize?',
    answer:
      'You can batch process up to 50 images per session. Because processing takes place on your device, total throughput depends on your computer or phone hardware, ensuring no server bottlenecks or rate limits.',
  },
  {
    question: 'Will resizing or converting reduce the image quality?',
    answer:
      'Resizer gives you granular quality slider controls (1-100%). For PNG, compression is completely lossless. For WebP, AVIF, and JPG, you can choose the optimal balance between visual clarity and file size reduction.',
  },
  {
    question: 'Is Resizer free to use for commercial projects?',
    answer:
      'Yes, Resizer is 100% free with no subscriptions, no hidden watermarks, no account registration requirements, and no daily usage caps.',
  },
];

export default function FeaturesPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('AVIF');

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* ===== HERO SECTION ===== */}
      <section className="text-center max-w-3xl mx-auto mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>✨</span>
          <span>Next-Gen Image Processing Suite</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
          Engineered for Speed, Privacy & Precision
        </h1>

        <p className="text-lg sm:text-xl text-muted leading-relaxed mb-8">
          Every tool you need to resize, convert, compress, and optimize your images directly in your browser with zero data leakage and blazing-fast execution.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            id="hero-launch-resizer-btn"
            href="/"
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <span>Start Resizing Free</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <Link
            id="hero-explore-tools-btn"
            href="/tools"
            className="px-8 py-3.5 bg-surface dark:bg-zinc-900 border border-border hover:border-primary/50 text-primary dark:text-white font-semibold rounded-2xl hover:bg-surface-elevated dark:hover:bg-zinc-800 transition-all duration-200"
          >
            Browse All Tools
          </Link>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-border/60">
          <div className="p-3 bg-surface-elevated dark:bg-zinc-900/60 rounded-2xl border border-border/50 text-center">
            <div className="text-2xl font-bold text-primary dark:text-white">100%</div>
            <div className="text-xs text-muted mt-0.5">Browser Client-Side</div>
          </div>
          <div className="p-3 bg-surface-elevated dark:bg-zinc-900/60 rounded-2xl border border-border/50 text-center">
            <div className="text-2xl font-bold text-primary dark:text-white">0 KB</div>
            <div className="text-xs text-muted mt-0.5">Uploaded to Cloud</div>
          </div>
          <div className="p-3 bg-surface-elevated dark:bg-zinc-900/60 rounded-2xl border border-border/50 text-center">
            <div className="text-2xl font-bold text-primary dark:text-white">50</div>
            <div className="text-xs text-muted mt-0.5">Batch File Limit</div>
          </div>
          <div className="p-3 bg-surface-elevated dark:bg-zinc-900/60 rounded-2xl border border-border/50 text-center">
            <div className="text-2xl font-bold text-primary dark:text-white">~85%</div>
            <div className="text-xs text-muted mt-0.5">Max Size Reduction</div>
          </div>
        </div>
      </section>

      {/* ===== CORE CAPABILITIES GRID ===== */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-primary dark:text-white">
            Comprehensive Image Engineering
          </h2>
          <p className="text-muted text-base sm:text-lg">
            Built with modern web standards to deliver desktop-grade performance directly inside your browser tab.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_FEATURES.map((feature) => (
            <div
              key={feature.id}
              id={`feature-card-${feature.id}`}
              className="group bg-surface dark:bg-zinc-900 border border-border/80 rounded-3xl p-6 sm:p-7 hover:border-blue-500/50 dark:hover:border-blue-400/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <span className="px-3 py-1 bg-accent/10 text-accent dark:bg-accent/20 rounded-full text-xs font-semibold">
                      {feature.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-primary dark:text-white mb-2 group-hover:text-accent transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-muted mb-4 leading-relaxed">
                  {feature.description}
                </p>

                <div className="p-3 bg-surface-elevated dark:bg-zinc-800/60 rounded-2xl border border-border/40 text-xs font-medium text-secondary dark:text-zinc-300 mb-5">
                  💡 {feature.highlight}
                </div>
              </div>

              <ul className="space-y-2 pt-4 border-t border-border/50 text-xs text-muted">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ARCHITECTURE COMPARISON: CLIENT VS CLOUD ===== */}
      <section className="mb-24">
        <div className="bg-gradient-to-br from-surface to-surface-elevated dark:from-zinc-900 dark:to-zinc-950 border border-border rounded-3xl p-8 sm:p-12 shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider">
              Architecture Comparison
            </span>
            <h2 className="text-3xl font-bold mt-3 mb-2 text-primary dark:text-white">
              Why In-Browser Processing Wins
            </h2>
            <p className="text-muted text-sm sm:text-base">
              Comparing Resizer's zero-cloud architecture with conventional online image convertors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resizer Way */}
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Resizer (Client-Side Engine)</h3>
                  <p className="text-xs text-muted">Zero-knowledge local execution</p>
                </div>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-primary dark:text-zinc-200">
                    <strong>100% Private:</strong> Files never leave your RAM. Zero server risk.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-primary dark:text-zinc-200">
                    <strong>Instant Response:</strong> No upload or download network queue lag.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-primary dark:text-zinc-200">
                    <strong>Unlimited Usage:</strong> No credit card, no daily credits, no subscriptions.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-primary dark:text-zinc-200">
                    <strong>High Quality Canvas Rendering:</strong> Smooth bilinear filtering and custom quantization.
                  </span>
                </div>
              </div>
            </div>

            {/* Traditional Cloud Resizers */}
            <div className="p-6 sm:p-8 rounded-2xl bg-red-500/5 dark:bg-red-950/20 border border-red-500/20 opacity-90">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Traditional Online Resizers</h3>
                  <p className="text-xs text-muted">Cloud server dependent</p>
                </div>
              </div>

              <div className="space-y-3.5 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Uploads files to unknown remote servers and logs IP addresses.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Slow upload and download times on large batches and mobile networks.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Forced account creation, intrusive ads, and restrictive file size paywalls.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Risk of cloud data breaches and persistent server retention.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FORMAT MATRIX TABLE ===== */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-bold mb-3 text-primary dark:text-white">
            Image Format Comparison Matrix
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Understand the capabilities, compression rates, and ideal use cases for each output format.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-border bg-surface dark:bg-zinc-900 shadow-md">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface-elevated dark:bg-zinc-800/80 border-b border-border text-xs uppercase tracking-wider text-muted font-semibold">
                <th className="py-4 px-6">Format</th>
                <th className="py-4 px-6">Compression Efficiency</th>
                <th className="py-4 px-6">Alpha Transparency</th>
                <th className="py-4 px-6">Browser Support</th>
                <th className="py-4 px-6">Expected Savings</th>
                <th className="py-4 px-6">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {FORMAT_COMPARISON.map((row) => (
                <tr
                  key={row.format}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 px-6 font-bold text-primary dark:text-white">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-xs">
                      {row.format}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-secondary dark:text-zinc-300 font-medium">
                    {row.efficiency}
                  </td>
                  <td className="py-4 px-6 text-muted">
                    {row.transparency}
                  </td>
                  <td className="py-4 px-6 text-muted font-mono text-xs">
                    {row.browserSupport}
                  </td>
                  <td className="py-4 px-6 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {row.savings}
                  </td>
                  <td className="py-4 px-6 text-muted text-xs">
                    {row.idealFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== FREQUENTLY ASKED QUESTIONS ===== */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-3 text-primary dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-muted text-sm sm:text-base">
            Everything you need to know about how Resizer processes images and ensures security.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="border border-border/80 rounded-2xl bg-surface dark:bg-zinc-900 overflow-hidden transition-all duration-200"
              >
                <button
                  id={`faq-toggle-${idx}`}
                  onClick={() => toggleFaq(idx)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-primary dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <span className="text-base">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-accent' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-muted leading-relaxed border-t border-border/40">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== BOTTOM CTA BANNER ===== */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-10 sm:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Ready to Optimize & Resize Your Images?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg mb-8 leading-relaxed">
              No account creation, no download limits, and 100% private. Start transforming images in seconds.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                id="bottom-cta-launch-btn"
                href="/"
                className="px-8 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Open Resizer Studio
              </Link>
              <Link
                id="bottom-cta-tools-btn"
                href="/tools"
                className="px-8 py-4 bg-white/15 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/25 transition-all duration-200"
              >
                Explore Specific Tools
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
