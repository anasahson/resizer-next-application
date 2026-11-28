'use client';

import Link from 'next/link';
import { ArrowUpRight, Image as ImageIcon, ShieldCheck } from 'lucide-react';

const footerGroups = [
  {
    title: 'Create',
    links: [
      ['Image studio', '/'],
      ['Convert images', '/tools?tool=convert'],
      ['Resize images', '/tools?tool=resize'],
      ['Compress images', '/tools?tool=compress'],
    ],
  },
  {
    title: 'Explore',
    links: [
      ['Image presets', '/presets'],
      ['PDF to images', '/tools?tool=pdf'],
      ['Images to PDF', '/tools?tool=image-pdf'],
      ['Remove background', '/remove-background'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Features', '/features'],
      ['Quick start guide', '/guide'],
      ['Guides', '/blog'],
      ['Image analyzer', '/analyzer'],
      ['Contact', '/contact'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-white/75 text-primary backdrop-blur-xl dark:bg-zinc-950/90 dark:text-zinc-100">
      <div className="mx-auto max-w-[1440px] px-4 pb-8 pt-12 sm:px-6 lg:px-8 lg:pt-14">
        <div className="grid gap-10 border-b border-border/70 pb-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="Resizer AI home">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                <ImageIcon className="h-5 w-5" />
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                Resizer <span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted">
              A focused image workspace for resizing, converting, compressing, and preparing assets for every channel.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Browser-first image processing
            </div>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary dark:text-white">
                  {group.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Resizer AI. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition-colors hover:text-primary dark:hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-primary dark:hover:text-white">Terms</Link>
            <Link href="/dashboard" className="transition-colors hover:text-primary dark:hover:text-white">Workspace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
