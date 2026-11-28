import type { Metadata } from 'next';
import Link from 'next/link';
import { PRESETS } from '../lib/presets';

export const metadata: Metadata = {
  title: 'Image Presets & PDF Conversion — Instagram, Store, and Form Sizes',
  description:
    'Use one-click image presets for Instagram, YouTube, passport photos, Shopify products, and form uploads. Convert images to PDF or export PDF pages as PNG, JPEG, or WebP.',
  alternates: { canonical: '/presets' },
};

export default function PresetsIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">Presets</span>
        </nav>

        <header className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Start from a preset
          </span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Pre-configured image jobs
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Each preset sets the exact dimensions, format and quality for one job — an Instagram
            post, a YouTube thumbnail, a passport photo, or a file that has to fit under 50 KB.
            Open one and the studio is already configured; drop a file and download.
          </p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((preset) => (
            <Link
              key={preset.slug}
              href={`/presets/${preset.slug}`}
              className="group flex flex-col justify-between gap-4 rounded-3xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/60"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold group-hover:text-accent">{preset.name}</h2>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {preset.tool}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{preset.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted">{preset.specLabel}</span>
                <span aria-hidden className="text-accent transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </Link>
          ))}
          <Link
            href="/tools?tool=pdf"
            className="group flex flex-col justify-between gap-4 rounded-3xl border border-dashed border-accent/50 bg-accent/5 p-6 transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold group-hover:text-accent">Convert PDF to images</h2>
                <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  Tool
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Render selected PDF pages as PNG, JPEG, or WebP. Choose the output format and resolution before downloading.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted">PNG · JPEG · WebP</span>
              <span aria-hidden className="text-accent transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
          <Link
            href="/tools?tool=image-pdf"
            className="group flex flex-col justify-between gap-4 rounded-3xl border border-dashed border-accent/50 bg-accent/5 p-6 transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold group-hover:text-accent">Convert images to PDF</h2>
                <span className="rounded-full border border-accent/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  Tool
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Combine multiple images into one PDF, with one image per page and optional A4 or Letter sizing.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted">PNG · JPEG · WebP · AVIF</span>
              <span aria-hidden className="text-accent transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </div>

        <section className="mt-12 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-lg font-extrabold">Need custom dimensions?</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Open the full studio for arbitrary pixel sizes, aspect-ratio locking, batch processing,
            format conversion and both image/PDF conversion tools.
          </p>
          <Link
            href="/tools"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white"
          >
            Open the studio
            <span aria-hidden>→</span>
          </Link>
        </section>
      </div>
    </div>
  );
}
