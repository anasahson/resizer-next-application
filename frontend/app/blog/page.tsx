'use client';

import React, { useState } from 'react';

const BLOG_POSTS = [
  {
    id: 1,
    title: 'Why Client-Side Image Processing Matters',
    slug: 'why-client-side-matters',
    category: 'Privacy',
    readTime: '8 min',
    excerpt: 'Your images stay on YOUR device. No upload to servers = no data breach. Learn why client-side processing is the future.',
    image: '🔒',
  },
  {
    id: 2,
    title: 'AVIF vs WebP: The 2026 Showdown',
    slug: 'avif-vs-webp-2026',
    category: 'Technical',
    readTime: '6 min',
    excerpt: 'Comprehensive comparison of next-gen image formats. File size, quality, and browser compatibility.',
    image: '📊',
  },
  {
    id: 3,
    title: 'How to Achieve 80% Compression Without Losing Quality',
    slug: 'achieve-80-percent-compression',
    category: 'Tutorial',
    readTime: '10 min',
    excerpt: 'Advanced compression techniques, quality trade-offs, and real before/after examples.',
    image: '⚙️',
  },
  {
    id: 4,
    title: 'HIPAA-Compliant Image Compression for Healthcare',
    slug: 'hipaa-compliant-healthcare',
    category: 'Industry',
    readTime: '7 min',
    excerpt: 'Privacy-first approach to medical imaging. No server logs. Zero data breach risk.',
    image: '🏥',
  },
  {
    id: 5,
    title: 'Batch Process 1000 Images in 2 Minutes',
    slug: 'batch-process-1000-images',
    category: 'Tutorial',
    readTime: '5 min',
    excerpt: 'Step-by-step guide to process large image datasets locally without slowing down.',
    image: '⚡',
  },
  {
    id: 6,
    title: 'Remove EXIF Data for Complete Privacy',
    slug: 'remove-exif-data-privacy',
    category: 'Privacy',
    readTime: '6 min',
    excerpt: 'What metadata reveals about you. How to strip it safely. Privacy checklist included.',
    image: '🔐',
  },
  {
    id: 7,
    title: 'Why We Beat TinyPNG on Privacy',
    slug: 'resizer-vs-tinypng',
    category: 'Comparison',
    readTime: '4 min',
    excerpt: 'Server-side vs client-side. Privacy implications. Speed comparison. Real numbers.',
    image: '⚡',
  },
  {
    id: 8,
    title: 'GDPR Compliance Made Simple',
    slug: 'gdpr-compliance-simple',
    category: 'Compliance',
    readTime: '9 min',
    excerpt: 'How Resizer helps companies meet GDPR requirements without complex infrastructure.',
    image: '✅',
  },
];

const CATEGORIES = ['All', 'Privacy', 'Technical', 'Tutorial', 'Industry', 'Comparison', 'Compliance'];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Privacy-First Image Optimization</h1>
          <p className="text-lg text-blue-100">
            Learn how to compress images while keeping your data safe. Your privacy matters.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer hover:scale-105"
            >
              {/* Image */}
              <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <span className="text-6xl">{post.image}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{post.readTime}</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 hover:text-blue-600">
                  {post.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.excerpt}</p>

                <a
                  href={`/blog/${post.slug}`}
                  className="inline-block text-blue-600 hover:text-blue-700 font-bold text-sm"
                >
                  Read More →
                </a>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No articles found. Try a different search or filter.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-3xl font-bold text-blue-600">{BLOG_POSTS.length}</p>
            <p className="text-gray-600 mt-2">In-Depth Articles</p>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-3xl font-bold text-green-600">100%</p>
            <p className="text-gray-600 mt-2">Privacy Focused</p>
          </div>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-3xl font-bold text-purple-600">Free</p>
            <p className="text-gray-600 mt-2">No Paywalls</p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-12 mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Compress Privately?</h2>
          <p className="mb-6 text-blue-100">Start processing images locally. No signup. No tracking. No BS.</p>
          <div className="flex gap-4 justify-center">
            <a
              href="/processor"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-bold transition"
            >
              Start Processing
            </a>
            <a
              href="/pricing"
              className="border-2 border-white text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-bold transition"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
