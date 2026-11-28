import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com';

const highlights = [
  {
    title: 'Transparent processing',
    text: 'Core image processing uses the configured backend with a browser fallback. Optional AI processing sends a selected image to its provider only after submission.',
  },
  {
    title: 'No personal image storage',
    text: 'The app does not permanently store image files. The backend may record processing metadata, and cloud hosting is available only through an explicit action.',
  },
  {
    title: 'Consent-first analytics',
    text: 'Analytics only starts after you choose to accept. If you decline, no tracking scripts initialize and no consent cookie is set.',
  },
  {
    title: 'GDPR-aware controls',
    text: 'We designed the consent flow for transparency, user control, and easy withdrawal of analytics preferences.',
  },
];

const faqItems = [
  {
    question: 'How are my images processed?',
    answer:
      'Core image processing uses the configured backend and falls back to browser processing when needed. The app does not permanently store image files, but processing metadata may be recorded. Background removal sends the selected image to the configured provider after you submit it.',
  },
  {
    question: 'Do you store my photos or metadata?',
    answer:
      'The backend records processing metadata, but the app does not permanently store image bytes. Metadata stripping is applied only when you enable that option.',
  },
  {
    question: 'What analytics do you collect?',
    answer:
      'Only anonymous product analytics, and only after consent. We do not record your image content, files, or screen activity. Session replay is disabled by default.',
  },
  {
    question: 'Can I withdraw consent later?',
    answer:
      'Yes. Clearing the consent flag in your browser will remove the stored preference and the analytics banner will appear again the next time you visit.',
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'PrivacyPolicy',
            name: 'Resizer AI Privacy Policy',
            url: `${SITE_URL}/privacy`,
            description:
              'Resizer AI privacy policy covering image processing, provider-backed tools, analytics consent, and data handling.',
            inLanguage: 'en-US',
            publisher: {
              '@type': 'Organization',
              name: 'Resizer AI',
              url: SITE_URL,
            },
            mainEntity: {
              '@type': 'WebPage',
              name: 'Privacy Policy',
              url: `${SITE_URL}/privacy`,
            },
          }),
        }}
      />

      <section className="border-b border-slate-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 text-white dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-50">
              Privacy-first design
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              Privacy policy for image processing and optional AI tools.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
              Resizer AI is built to put you in control. Processing behavior is disclosed, provider-backed features require an explicit request, and analytics only run after consent.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <span className="text-lg font-bold">✓</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-300">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Our promise</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">
                We do not treat your images as a database asset.
              </h2>
              <div className="mt-5 space-y-5 text-base leading-8 text-slate-600 dark:text-zinc-300">
                <p>
                  Core image jobs are sent to the configured processing backend, with a browser fallback if the service is unavailable. The HTML analyzer parses pasted or uploaded markup locally and does not visit the referenced website.
                </p>
                <p>
                  Image files are not permanently stored by this app. Backend processing metadata may be recorded. Optional AI background removal sends the selected image to the configured provider only after you submit the request; cloud hosting is a separate explicit action.
                </p>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">How it works</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Processing choices and data handling</h2>
              <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-600 dark:text-zinc-300">
                <li><strong className="text-slate-900 dark:text-white">Core image processing:</strong> requests use the configured processing API, with browser-side fallback when needed.</li>
                <li><strong className="text-slate-900 dark:text-white">Provider-backed AI:</strong> background removal sends the selected image to the configured provider only after you submit it.</li>
                <li><strong className="text-slate-900 dark:text-white">No permanent image storage:</strong> the app does not keep source or processed image files in its database; processing metadata may be recorded.</li>
                <li><strong className="text-slate-900 dark:text-white">Markup analyzer:</strong> pasted or uploaded HTML is analyzed locally and is not sent to the backend.</li>
              </ul>
            </article>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm dark:border-zinc-800 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">What we do not do</p>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-200">
              <li>• We do not sell your images, metadata, or browsing behavior.</li>
              <li>• We do not build ad profiles from the files you process.</li>
              <li>• We do not require an account to use the core resizing tools.</li>
              <li>• We do not turn your files into a telemetry product.</li>
            </ul>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Need help?</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Questions about privacy, consent, or data handling can be sent to{' '}
                <a href="mailto:support@resizer-ai.com" className="font-semibold text-white underline underline-offset-4">
                  support@resizer-ai.com
                </a>
                .
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Analytics & consent</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">We only track if you explicitly agree.</h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-zinc-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">What is collected</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
                If analytics are accepted, we may collect anonymous usage data such as page views, feature usage, and high-level interaction patterns. We do not collect file contents, user photos, or image payloads.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-zinc-950">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">What we deliberately do not collect</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
                We do not record screen activity, image pixels, exact file names, uploaded image data, or any user document content as part of analytics. Session replays are disabled.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm leading-7 text-slate-600 dark:text-zinc-300">
              Consent is stored locally in your browser. The banner appears again after you clear your browser storage, so you always retain control. If you decline analytics, no tracking scripts are initialized and no cookies are set by default.
            </p>
          </div>
        </section>

        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">Frequently asked privacy questions</h2>
          <div className="mt-8 space-y-4">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-100 to-blue-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-blue-950/40 sm:p-8">
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">Your privacy controls, included by design.</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {['Processing disclosed', 'No hidden tracking', 'Explicit provider action', 'Local HTML audit', 'Easy withdrawal'].map((tag) => (
              <span key={tag} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Back to the resizer
            </Link>
            <a
              href="mailto:support@resizer-ai.com"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            >
              Contact privacy support
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
