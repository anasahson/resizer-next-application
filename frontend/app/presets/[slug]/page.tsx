import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPreset, presetHref, PRESETS, PRESET_SLUGS } from '../../lib/presets';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return PRESET_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const preset = getPreset(slug);

  if (!preset) {
    return { title: 'Preset not found' };
  }

  return {
    title: preset.title,
    description: preset.description,
    alternates: { canonical: `/presets/${preset.slug}` },
    openGraph: {
      title: preset.title,
      description: preset.description,
      url: `/presets/${preset.slug}`,
      type: 'website',
    },
  };
}

export default async function PresetPage({ params }: PageProps) {
  const { slug } = await params;
  const preset = getPreset(slug);

  if (!preset) {
    notFound();
  }

  const related = preset.related
    .map((relatedSlug) => getPreset(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/presets/${preset.slug}#page`,
        url: `${SITE_URL}/presets/${preset.slug}`,
        name: preset.title,
        description: preset.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'HowTo',
        name: preset.h1,
        description: preset.intro,
        totalTime: 'PT1M',
        step: [
          { '@type': 'HowToStep', position: 1, name: 'Open the preset', text: `Open the ${preset.name} preset — it loads ${preset.format.toUpperCase()} at quality ${preset.quality} with the correct dimensions already set.` },
          { '@type': 'HowToStep', position: 2, name: 'Drop your image', text: 'Drag the photo into the studio. Processing uses the configured image API with a browser fallback; image files are not permanently stored by this app.' },
          { '@type': 'HowToStep', position: 3, name: 'Download', text: 'Download the result, or process a whole batch and take it as a single ZIP.' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: preset.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Presets', item: `${SITE_URL}/presets` },
          { '@type': 'ListItem', position: 3, name: preset.name, item: `${SITE_URL}/presets/${preset.slug}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/presets" className="hover:text-accent">Presets</Link>
          <span aria-hidden>/</span>
          <span className="text-foreground">{preset.name}</span>
        </nav>

        <header className="rounded-3xl border border-border bg-surface p-6 sm:p-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            One-click preset
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{preset.h1}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{preset.intro}</p>

          <dl className="mt-6 flex flex-wrap gap-2">
            {[preset.specLabel, `${preset.format.toUpperCase()} · Q${preset.quality}`, preset.maxKB ? `≤ ${preset.maxKB} KB` : null]
              .filter((item): item is string => Boolean(item))
              .map((item) => (
                <div key={item} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold">
                  {item}
                </div>
              ))}
          </dl>

          <div className="mt-7 flex flex-wrap items-end gap-3">
            <form action="/tools" method="get" className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="preset" value={preset.slug} />
              <input type="hidden" name="tool" value={preset.tool} />
              <label htmlFor="preset-output-format" className="grid gap-1.5 text-xs font-semibold text-muted">
                Output format
                <select
                  id="preset-output-format"
                  name="format"
                  defaultValue={preset.format}
                  className="min-h-12 min-w-36 rounded-xl border border-border bg-background px-3 text-sm font-bold text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:text-white"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent/90"
              >
                Open with these settings
                <span aria-hidden>→</span>
              </button>
            </form>
            <Link
              href="/presets"
              className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold transition-colors hover:border-accent/60 hover:text-accent"
            >
              All presets
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            No watermark. Core processing uses the configured service with a browser fallback.
          </p>
        </header>

        <section aria-labelledby="why-heading" className="mt-10">
          <h2 id="why-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Why this preset exists
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {preset.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-muted">
                <span aria-hidden className="mt-0.5 text-accent">✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps-heading" className="mt-10">
          <h2 id="steps-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
            How it works
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { title: 'Open the preset', text: 'Dimensions, format and quality are already set — no configuration needed.' },
              { title: 'Drop your image', text: 'The configured processing service handles the image; a browser fallback is available.' },
              { title: 'Download', text: 'Save one file or batch-process a set and export a ZIP.' },
            ].map((step, index) => (
              <li key={step.title} className="rounded-2xl border border-border bg-surface p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-sm font-black text-accent">
                  {index + 1}
                </span>
                <h3 className="mt-3 text-sm font-bold">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="faq-heading" className="mt-10">
          <h2 id="faq-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-3">
            {preset.faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-border bg-surface p-5">
                <summary className="cursor-pointer list-none text-sm font-bold marker:hidden">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Related presets
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/presets/${item.slug}`}
                  className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/60"
                >
                  <p className="text-sm font-bold group-hover:text-accent">{item.name}</p>
                  <p className="mt-1 text-xs text-muted">{item.specLabel}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 rounded-3xl border border-accent/30 bg-accent/5 p-6 text-center sm:p-8">
          <h2 className="text-lg font-extrabold sm:text-xl">Ready to try it?</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
            The preset opens the studio already configured for {preset.name.toLowerCase()}. Drop a file and download.
          </p>
          <Link
            href={presetHref(preset)}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-bold text-white"
          >
            Start with {preset.name}
            <span aria-hidden>→</span>
          </Link>
        </section>

        <p className="mt-8 text-center text-xs text-muted">
          {PRESETS.length} presets available · <Link href="/presets" className="text-accent hover:underline">browse all</Link>
        </p>
      </div>
    </div>
  );
}
