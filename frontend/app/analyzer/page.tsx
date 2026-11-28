'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import { FileSearch, Upload } from 'lucide-react';

const MAX_HTML_CHARACTERS = 2 * 1024 * 1024;

interface ImageAuditRow {
  source: string;
  format: string;
  dimensions: string;
  altText: string;
  loading: string;
  recommendations: string[];
}

function getFormat(source: string): string {
  const match = source.match(/\.(avif|webp|jpe?g|png|gif|svg)(?:[?#]|$)/i);
  if (match) return match[1].toUpperCase().replace('JPG', 'JPEG');
  const dataUrl = source.match(/^data:image\/([^;,]+)/i);
  return dataUrl ? dataUrl[1].toUpperCase() : 'Unknown';
}

function analyzeHtml(html: string): ImageAuditRow[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll('img')).map((image) => {
    const source = image.getAttribute('src')
      || image.getAttribute('data-src')
      || image.getAttribute('srcset')
      || '(no source found)';
    const width = image.getAttribute('width');
    const height = image.getAttribute('height');
    const alt = image.getAttribute('alt');
    const loading = image.getAttribute('loading') || 'not set';
    const format = getFormat(source);
    const recommendations: string[] = [];

    if (alt === null) recommendations.push('Add an alt attribute; use empty text only for decorative images.');
    if (loading !== 'lazy') recommendations.push('Consider lazy-loading when this image is below the fold.');
    if (!width || !height) recommendations.push('Set width and height to reduce layout shift.');
    if (!['AVIF', 'WEBP'].includes(format)) recommendations.push('Consider a WebP or AVIF source for modern browsers.');

    return {
      source,
      format,
      dimensions: width && height ? `${width} × ${height}` : 'Not declared',
      altText: alt === null ? 'Missing' : alt.trim() || 'Decorative (empty)',
      loading,
      recommendations,
    };
  });
}

export default function AnalyzerPage() {
  const [html, setHtml] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');
  const rows = useMemo(() => analyzed ? analyzeHtml(html) : [], [analyzed, html]);
  const missingAlt = rows.filter((row) => row.altText === 'Missing').length;
  const missingDimensions = rows.filter((row) => row.dimensions === 'Not declared').length;
  const nonModern = rows.filter((row) => !['AVIF', 'WEBP'].includes(row.format)).length;

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_HTML_CHARACTERS) {
      setError('HTML files must be 2 MB or smaller.');
      return;
    }
    try {
      setHtml(await file.text());
      setAnalyzed(false);
      setError('');
    } catch {
      setError('Could not read that HTML file.');
    }
  };

  const runAnalysis = () => {
    if (!html.trim()) {
      setError('Paste HTML or choose an .html file to analyze.');
      setAnalyzed(false);
      return;
    }
    if (html.length > MAX_HTML_CHARACTERS) {
      setError('HTML content must be 2 MB or smaller.');
      setAnalyzed(false);
      return;
    }
    setError('');
    setAnalyzed(true);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">Image analyzer</span>
      </nav>

      <header className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <FileSearch className="h-4 w-4" />
          Local HTML audit
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Audit image markup on a page</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Paste or upload HTML to review image formats, alt text, declared dimensions, and lazy-loading hints.
          Analysis stays in this browser; this tool does not visit or crawl the website.
        </p>
      </header>

      <section className="mt-8 rounded-3xl border border-border bg-surface p-4 sm:p-6">
        <label htmlFor="html-input" className="mb-2 block text-sm font-bold">Page HTML</label>
        <textarea
          id="html-input"
          value={html}
          onChange={(event) => {
            setHtml(event.target.value);
            setAnalyzed(false);
            setError('');
          }}
          placeholder={'Paste a page’s HTML here…\n<img src="/images/product.webp" alt="Product" width="800" height="600" loading="lazy">'}
          className="min-h-56 w-full resize-y rounded-2xl border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          maxLength={MAX_HTML_CHARACTERS}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:border-accent hover:text-accent">
            <Upload className="h-4 w-4" />
            Choose HTML file
            <input type="file" accept=".html,.htm,text/html" className="sr-only" onChange={handleFile} />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{html.length.toLocaleString()} / 2,097,152 characters</span>
            <button type="button" onClick={runAnalysis} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white">
              Analyze markup
            </button>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      </section>

      {analyzed && (
        <section className="mt-8" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Images found', value: rows.length },
              { label: 'Missing alt text', value: missingAlt },
              { label: 'Missing dimensions', value: missingDimensions },
              { label: 'Not WebP / AVIF', value: nonModern },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="mt-1 text-2xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {rows.length ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-surface-elevated text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Image source</th>
                      <th className="px-4 py-3 font-semibold">Format</th>
                      <th className="px-4 py-3 font-semibold">Dimensions</th>
                      <th className="px-4 py-3 font-semibold">Alt / loading</th>
                      <th className="px-4 py-3 font-semibold">Suggestions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.source}-${index}`} className="border-t border-border align-top">
                        <td className="max-w-56 break-all px-4 py-3 font-mono">{row.source}</td>
                        <td className="px-4 py-3">{row.format}</td>
                        <td className="px-4 py-3">{row.dimensions}</td>
                        <td className="px-4 py-3">
                          <span className={row.altText === 'Missing' ? 'text-danger' : ''}>{row.altText}</span>
                          <span className="mt-1 block text-muted">loading: {row.loading}</span>
                        </td>
                        <td className="px-4 py-3">
                          {row.recommendations.length ? row.recommendations.join(' ') : 'No markup suggestions.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border px-4 py-3 text-xs text-muted">
                File bytes and exact compression savings are not fetched or estimated; this is a markup-only audit.
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">No image elements were found in the supplied HTML.</p>
          )}
        </section>
      )}
    </main>
  );
}
