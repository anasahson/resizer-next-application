'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">🔒 Your Privacy Matters</h1>
          <p className="text-xl text-blue-100">
            Your images never leave your browser. 100% client-side processing. Zero server storage.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Our Privacy Promise</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: '🖼️ Zero Image Upload',
                desc: 'Images process entirely in your browser. Nothing reaches our servers.',
              },
              {
                title: '🔐 No Image Data Collection',
                desc: 'We don\'t collect, store, or sell your image data. Ever.',
              },
              {
                title: '📊 Analytics Only With Consent',
                desc: 'We use PostHog for anonymous usage statistics, and only after you click Accept. Decline and nothing is collected. Session recording is always off.',
              },
              {
                title: '⚖️ GDPR Compliant',
                desc: 'Consent-first analytics, no cookies set before you choose, and one click to withdraw it.',
              },
              {
                title: '✅ No Signup Required',
                desc: 'Use Resizer without creating an account.',
              },
              {
                title: '🌐 Works Offline',
                desc: 'Process images without internet connection.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-700 dark:text-zinc-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Details */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">How We Keep You Private</h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">Client-Side Processing</h3>
              <p className="text-gray-700 dark:text-zinc-300 mb-4">
                All image processing happens in your browser using WebAssembly (WASM) and JavaScript.
                Your files never transmit to any server.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-zinc-300 space-y-2">
                <li>Sharp.js for compression</li>
                <li>libvips compiled to WASM</li>
                <li>Local file access only</li>
                <li>No network requests</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">No Logs, No Storage</h3>
              <p className="text-gray-700 dark:text-zinc-300 mb-4">
                We literally don't store anything. No image files, no metadata, no processing logs.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-zinc-300 space-y-2">
                <li>Zero server-side file storage</li>
                <li>No database records of your files</li>
                <li>No backup/archive of images</li>
                <li>Audit-proof architecture</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">Metadata Removal</h3>
              <p className="text-gray-700 dark:text-zinc-300 mb-4">
                Optional feature to strip EXIF data, GPS coordinates, and other identifying metadata.
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-zinc-300 space-y-2">
                <li>Remove EXIF data (camera model, timestamp)</li>
                <li>Strip GPS coordinates</li>
                <li>Remove device fingerprints</li>
                <li>Clean XMP metadata</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Resizer vs. The Competition</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow overflow-hidden">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Feature</th>
                  <th className="px-6 py-3 text-center">Resizer</th>
                  <th className="px-6 py-3 text-center">TinyPNG</th>
                  <th className="px-6 py-3 text-center">Photoshop</th>
                  <th className="px-6 py-3 text-center">Canva</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { feature: 'Client-Side Processing', resizer: '✅', tinypng: '❌', photoshop: '✅', canva: '❌' },
                  { feature: 'No Server Upload', resizer: '✅', tinypng: '❌', photoshop: '✅', canva: '❌' },
                  { feature: 'No Tracking', resizer: '✅', tinypng: '❌', photoshop: '❌', canva: '❌' },
                  { feature: 'No Signup Required', resizer: '✅', tinypng: '❌', photoshop: '❌', canva: '❌' },
                  { feature: 'Works Offline', resizer: '✅', tinypng: '❌', photoshop: '✅', canva: '❌' },
                  { feature: 'GDPR Compliant', resizer: '✅', tinypng: '⚠️', photoshop: '⚠️', canva: '⚠️' },
                  { feature: 'Free Tier', resizer: '✅', tinypng: '✅', photoshop: '❌', canva: '⚠️' },
                  { feature: 'Batch Processing', resizer: '✅', tinypng: '✅', photoshop: '✅', canva: '⚠️' },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-zinc-800' : ''}>
                    <td className="px-6 py-3 font-bold">{row.feature}</td>
                    <td className="px-6 py-3 text-center text-lg">{row.resizer}</td>
                    <td className="px-6 py-3 text-center text-lg">{row.tinypng}</td>
                    <td className="px-6 py-3 text-center text-lg">{row.photoshop}</td>
                    <td className="px-6 py-3 text-center text-lg">{row.canva}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Who Should Use Resizer?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: '🏥 Healthcare Professionals',
                desc: 'HIPAA-compliant image compression with zero server logs.',
              },
              {
                title: '⚖️ Lawyers',
                desc: 'Prepare court documents without exposing metadata.',
              },
              {
                title: '📸 Photographers',
                desc: 'Remove GPS data from field photos before publishing.',
              },
              {
                title: '🏠 Real Estate Agents',
                desc: 'Strip location data from property photos.',
              },
              {
                title: '💼 Corporate Teams',
                desc: 'Process sensitive documents locally. Zero compliance debt.',
              },
              {
                title: '🎨 Content Creators',
                desc: 'Batch process social media content privately.',
              },
              {
                title: '🔒 Privacy Advocates',
                desc: 'Support tools that respect your data.',
              },
              {
                title: '🌍 Anyone Anywhere',
                desc: 'Process images without internet. Works offline.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-700 dark:text-zinc-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Analytics &amp; Cookies</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">What we collect (only if you accept)</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                We use <b>PostHog</b> to understand which pages and features people actually use,
                so we know what to improve. If you accept, we collect aggregate events such as
                page views, which sections of a page were scrolled into view, and which controls
                were used. JavaScript errors are also reported so we can fix crashes.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-gray-700 dark:text-zinc-300">
                <li>
                  <b>Session recording is always disabled.</b> We never record your screen, clicks
                  or DOM interactions.
                </li>
                <li>
                  <b>Your images are never part of this.</b> Filenames, dimensions of your files,
                  file inputs and any text you type are never sent.
                </li>
                <li>
                  Passwords, emails and other personal fields are excluded by design. Only
                  bucketed values are sent for safe controls (for example a slider range, not your
                  exact input).
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">When it starts</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                Nothing is loaded and no cookie is set until you press{' '}
                <b>Accept analytics</b> on the banner. Until then PostHog is never initialised —
                its script is not even requested. If you press <b>Decline</b> (or dismiss the
                banner), no analytics run at all and every feature still works.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Cookies &amp; storage</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                PostHog is configured not to use cookies; its device identifier is kept in your
                browser&apos;s <code>localStorage</code>. Your own consent choice is stored in{' '}
                <code>localStorage</code> under <code>resizer_analytics_consent</code> so we only
                ask once. Clearing your browser storage removes both and the banner will ask again.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Change or withdraw your choice</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                You can withdraw consent at any time by clearing your browser storage for this
                site, which brings the banner back — or by running this in your browser console:
              </p>
              <pre className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-zinc-950 text-xs overflow-x-auto text-gray-800 dark:text-zinc-200">
                localStorage.removeItem(&apos;resizer_analytics_consent&apos;)
              </pre>
              <p className="mt-3 text-gray-700 dark:text-zinc-300">
                Withdrawing stops capture immediately and drops any stored analytics identity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-2">Data processor</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                PostHog, Inc. acts as our data processor for these anonymous analytics events.
                We do not sell analytics data to anyone.
              </p>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Legal & Compliance</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">GDPR Compliance</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                Resizer is GDPR-compliant by design. We don't collect personal data, so GDPR requirements
                don't apply to us. Your images are yours alone.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">CCPA (California Privacy Rights)</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                We don't collect or sell personal data. CCPA rights are not applicable because there's
                nothing to regulate.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">HIPAA (Healthcare)</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                Healthcare professionals can use Resizer for patient image processing without HIPAA
                complications. No server storage = no breach risk.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Privacy Policy</h3>
              <p className="text-gray-700 dark:text-zinc-300">
                Your <b>images</b> never leave your device, so there is no image data to disclose.
                The one exception to our no-third-party rule is anonymous product analytics
                (PostHog), which is fully described in the &ldquo;Analytics &amp; Cookies&rdquo;
                section below and only runs if you accept it.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Privacy Starts Here</h2>
          <p className="mb-6 text-blue-100">
            Stop uploading your images to random servers. Start processing them locally.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/processor"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-bold transition"
            >
              Start Compressing Now
            </a>
            <a
              href="/blog"
              className="border-2 border-white text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-bold transition"
            >
              Learn More on Blog
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
