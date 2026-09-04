'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeDraggable from './ThemeDraggable';
import {
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const pageContext = pathname === '/pricing'
    ? { label: 'Plans', message: 'Choose a plan that keeps your image workflow moving.' }
    : pathname.startsWith('/blog')
      ? { label: 'Insights', message: 'Practical ideas for faster, lighter, better images.' }
      : pathname === '/dashboard'
        ? { label: 'Workspace', message: 'Your workspace for fast, private image processing.' }
        : pathname === '/tools' || pathname === '/processor'
          ? { label: 'Image tools', message: 'Resize, compress, and convert without leaving your browser.' }
          : { label: 'Resizer', message: 'A focused image workflow for lighter, faster digital experiences.' };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 2500);
  };

  return (
    <footer aria-labelledby="footer-heading" className="bg-surface-elevated dark:bg-zinc-950/95 border-t border-border/80 text-primary dark:text-zinc-200 transition-colors duration-300 relative overflow-hidden">
      <h2 id="footer-heading" className="sr-only">Resizer site footer</h2>
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12 space-y-10 sm:space-y-12">
        
        {/* ========================================================================= */}
        {/* TOP SECTION: BRAND LOGO + DRAGGABLE DAY/NIGHT SWITCHER + NEWSLETTER       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 sm:pb-12 border-b border-border/70 items-start">
          
          {/* Brand Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                R
              </div>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-blue-600 to-indigo-600 dark:from-white dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Resizer
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-muted dark:text-zinc-400 leading-relaxed max-w-sm">
              Next-generation image optimization suite powered by Sharp and libvips. Convert to WebP & AVIF, resize, and compress with zero data leakage.
            </p>

            <p className="text-sm font-semibold text-primary dark:text-zinc-200 max-w-sm">
              <span className="text-blue-600 dark:text-blue-400">{pageContext.label}:</span>{' '}
              {pageContext.message}
            </p>

            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (Sharp Engine v0.33)</span>
            </div>
          </div>

          {/* Draggable Day & Night Mode Controller (3 cols) */}
          <div className="lg:col-span-3 flex flex-col justify-start">
            <ThemeDraggable />
          </div>

          {/* Newsletter Subscription Box (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Weekly Optimization Digest</span>
            </h3>
            <p className="text-xs text-muted dark:text-zinc-400">
              Get benchmarks on new image codecs, browser performance audits, and Sharp updates.
            </p>

            {subscribed ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed! Check your inbox soon.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <label htmlFor="footer-newsletter-email" className="sr-only">Email address for the optimization digest</label>
                <input
                  id="footer-newsletter-email"
                  type="email"
                  required
                  placeholder="name@work.com"
                  autoComplete="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-primary dark:text-white placeholder:text-muted focus:outline-none focus:border-blue-500 shadow-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all shrink-0"
                >
                  <span>Join</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* ========================================================================= */}
        {/* LINK COLUMNS (4 Columns)                                                  */}
        {/* ========================================================================= */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10 text-xs">
          
          {/* Column 1: Image Tools */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-primary dark:text-white text-[11px]">
              Conversion Tools
            </h4>
            <ul className="space-y-2 text-muted dark:text-zinc-400">
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Convert to WebP</span>
                  <span className="text-[9px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">Popular</span>
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Convert to AVIF</span>
                  <span className="text-[9px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono">Next-Gen</span>
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Convert to JPG / JPEG
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Convert to PNG (Lossless)
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Compress Image Online
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform & Features */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-primary dark:text-white text-[11px]">
              Platform & Engine
            </h4>
            <ul className="space-y-2 text-muted dark:text-zinc-400">
              <li>
                <Link href="/features" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Sharp libvips Engine
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Lossless Quantization
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Batch Multi-File Pipeline
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Privacy-First Security
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Pricing & Quotas
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Blog */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-primary dark:text-white text-[11px]">
              Resources & Insights
            </h4>
            <ul className="space-y-2 text-muted dark:text-zinc-400">
              <li>
                <Link href="/blog" className="hover:text-blue-600 dark:hover:text-white transition-colors flex items-center gap-1.5">
                  <span>Engineering Blog</span>
                  <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-mono">New</span>
                </Link>
              </li>
              <li>
                <Link href="/blog/webp-vs-avif-modern-image-formats" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  WebP vs AVIF Benchmark
                </Link>
              </li>
              <li>
                <Link href="/blog/core-web-vitals-lcp-image-optimization" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Core Web Vitals Guide
                </Link>
              </li>
              <li>
                <Link href="/blog/lossless-png-compression-techniques" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  PNG Compression Deep Dive
                </Link>
              </li>
              <li>
                <Link href="/blog/nextjs-image-and-sharp-backend-pipeline" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Node.js Sharp Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Account & Support */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-primary dark:text-white text-[11px]">
              Account & Legal
            </h4>
            <ul className="space-y-2 text-muted dark:text-zinc-400">
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  User Workspace & Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Sign In / Access Account
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Create Free Account
                </Link>
              </li>
              <li>
                <a href="mailto:support@resizer.com" className="hover:text-blue-600 dark:hover:text-white transition-colors">
                  Contact support
                </a>
              </li>
            </ul>
          </div>

        </nav>

        {/* ========================================================================= */}
        {/* BOTTOM BAR: COPYRIGHT + SOCIAL ICONS                                      */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-border/70 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted dark:text-zinc-500">
          <p className="flex items-center gap-1 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Resizer Inc. Built for fast, private image processing.</span>
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary dark:hover:text-white transition-colors p-1"
              aria-label="GitHub Repository"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary dark:hover:text-white transition-colors p-1"
              aria-label="Twitter Community"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary dark:hover:text-white transition-colors p-1"
              aria-label="LinkedIn Profile"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c.97 0 1.75-.78 1.75-1.75s-.78-1.76-1.75-1.76-1.76.79-1.76 1.76.79 1.75 1.76 1.75M7.85 18.5v-8.37H5.06v8.37h2.79z" />
              </svg>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
