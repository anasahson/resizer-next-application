'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
                title: '🚫 Zero Server Upload',
                desc: 'Images process entirely in your browser. Nothing reaches our servers.',
              },
              {
                title: '🔐 No Data Collection',
                desc: 'We don\'t collect, store, or sell your image data. Ever.',
              },
              {
                title: '📊 No Tracking',
                desc: 'No analytics pixels, no cookies, no hidden tracking.',
              },
              {
                title: '⚖️ GDPR Compliant',
                desc: 'By design. No data = no compliance burden.',
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
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Details */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">How We Keep You Private</h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">Client-Side Processing</h3>
              <p className="text-gray-700 mb-4">
                All image processing happens in your browser using WebAssembly (WASM) and JavaScript.
                Your files never transmit to any server.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Sharp.js for compression</li>
                <li>libvips compiled to WASM</li>
                <li>Local file access only</li>
                <li>No network requests</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">No Logs, No Storage</h3>
              <p className="text-gray-700 mb-4">
                We literally don't store anything. No image files, no metadata, no processing logs.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Zero server-side file storage</li>
                <li>No database records of your files</li>
                <li>No backup/archive of images</li>
                <li>Audit-proof architecture</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-8">
              <h3 className="text-xl font-bold mb-3">Metadata Removal</h3>
              <p className="text-gray-700 mb-4">
                Optional feature to strip EXIF data, GPS coordinates, and other identifying metadata.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
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
            <table className="w-full bg-white rounded-lg shadow overflow-hidden">
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
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
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
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Legal */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Legal & Compliance</h2>
          <div className="bg-white rounded-lg shadow p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-2">GDPR Compliance</h3>
              <p className="text-gray-700">
                Resizer is GDPR-compliant by design. We don't collect personal data, so GDPR requirements
                don't apply to us. Your images are yours alone.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">CCPA (California Privacy Rights)</h3>
              <p className="text-gray-700">
                We don't collect or sell personal data. CCPA rights are not applicable because there's
                nothing to regulate.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">HIPAA (Healthcare)</h3>
              <p className="text-gray-700">
                Healthcare professionals can use Resizer for patient image processing without HIPAA
                complications. No server storage = no breach risk.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Privacy Policy</h3>
              <p className="text-gray-700">
                We literally have nothing to disclose. No data collection, no analytics, no third-party
                integrations. Your privacy policy is simple: you're in control.
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
