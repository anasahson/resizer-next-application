import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getLivePostBySlug,
  getAllPostSlugs,
  BlogPost,
} from '../../lib/blogData';
import {
  Clock,
  Calendar,
  User,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Share2,
  Layers,
  ChevronRight,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. Next.js Static Generation: Generate static routes for all posts at build time
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// 2. Next.js Dynamic SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getLivePostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Resizer Engineering Blog',
      description: 'The requested article could not be found.',
    };
  }

  const url = `https://resizer.app/blog/${post.slug}`;

  return {
    title: `${post.seoTitle} | Resizer`,
    description: post.metaDescription,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.seoTitle,
      description: post.metaDescription,
      url,
      siteName: 'Resizer Engineering',
      type: 'article',
      publishedTime: post.isoDate,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.metaDescription,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getLivePostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Related articles (same category or others, excluding current)
  const relatedPosts: BlogPost[] = [];

  // 3. JSON-LD Structured Data Schema for Google Search Rich Results
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.isoDate,
    dateModified: post.isoDate,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Resizer',
      logo: {
        '@type': 'ImageObject',
        url: 'https://resizer.app/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://resizer.app/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://resizer.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://resizer.app/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://resizer.app/blog/${post.slug}`,
      },
    ],
  };

  const faqSchema =
    post.content.faqs && post.content.faqs.length > 0
      ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.content.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
      : null;

  return (
    <div className="min-h-screen bg-background text-primary dark:text-zinc-100 selection:bg-blue-500 selection:text-white pb-24">
      {/* Inject JSON-LD Schema Scripts for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* ========================================================================= */}
        {/* BREADCRUMBS NAVIGATION                                                    */}
        {/* ========================================================================= */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-primary dark:hover:text-zinc-200 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
          <Link href="/blog" className="hover:text-primary dark:hover:text-zinc-200 transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted" />
          <span className="text-primary dark:text-zinc-200 truncate max-w-xs sm:max-w-md font-medium">
            {post.title}
          </span>
        </nav>

        {/* ========================================================================= */}
        {/* ARTICLE HEADER                                                            */}
        {/* ========================================================================= */}
        <header className="space-y-4 pb-8 border-b border-border dark:border-zinc-800/80">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold uppercase px-3 py-1 rounded-full font-mono">
              {post.category}
            </span>
            <span className="text-xs text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span>{post.readTime}</span>
            </span>
            <span className="text-xs text-muted">•</span>
            <span className="text-xs text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              <time dateTime={post.isoDate}>{post.date}</time>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary dark:text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-secondary dark:text-zinc-300 leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>

          {/* Author Capsule */}
          <div className="flex items-center gap-3.5 pt-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
              {post.author.avatar}
            </div>
            <div>
              <div className="text-sm font-bold text-primary dark:text-white">{post.author.name}</div>
              <div className="text-xs text-muted">{post.author.role}</div>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* FEATURED HERO IMAGE / CATEGORY BANNER                                    */}
        {/* ========================================================================= */}
        <div className="rounded-3xl overflow-hidden border border-border dark:border-zinc-800/80 shadow-2xl shadow-black/20 dark:shadow-black/40">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={`Featured banner for: ${post.title}`}
              className="w-full object-cover"
              style={{ maxHeight: '420px' }}
            />
          ) : (
            /* Rich gradient fallback for static / no-image posts */
            <div
              className="w-full flex flex-col items-start justify-end relative overflow-hidden"
              style={{ minHeight: '300px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #09090b 100%)' }}
            >
              {/* Ambient glows */}
              <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-blue-600/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-purple-600/20 blur-3xl" />
              {/* Content */}
              <div className="relative z-10 p-8 sm:p-12 space-y-3 w-full">
                <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase px-3 py-1 rounded-full tracking-widest">
                  {post.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight max-w-3xl">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-400 flex items-center gap-3">
                  <span>{post.author.name}</span>
                  <span className="text-zinc-600">•</span>
                  <span>{post.readTime}</span>
                </p>
              </div>
            </div>
          )}
        </div>


        {/* ========================================================================= */}
        {/* MAIN ARTICLE BODY & TABLE OF CONTENTS                                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">


          {/* Article Main Content (8 cols on desktop) */}
          <article className="lg:col-span-8 space-y-8">

            {/* Lead Overview */}
            <div className="p-5 rounded-2xl bg-surface dark:bg-zinc-900/60 border border-border dark:border-zinc-800/80 text-sm sm:text-base text-secondary dark:text-zinc-300 leading-relaxed italic border-l-4 border-l-blue-500">
              {post.content.overview}
            </div>

            {/* Sections */}
            <div className="space-y-8 text-sm sm:text-base text-secondary dark:text-zinc-300 leading-relaxed">
              {post.content.sections.map((section, idx) => (
                <section key={idx} className="space-y-3.5 scroll-mt-24" id={`section-${idx}`}>
                  <h2 className="text-xl sm:text-2xl font-bold text-primary dark:text-white tracking-tight">
                    {section.heading}
                  </h2>
                  <p className="text-secondary dark:text-zinc-300 leading-relaxed">
                    {section.body}
                  </p>

                  {section.codeSnippet && (
                    <div className="my-4 rounded-2xl overflow-hidden border border-border dark:border-zinc-800 bg-zinc-950 shadow-xl">
                      <div className="bg-zinc-900/80 px-4 py-2 text-[11px] font-mono text-zinc-400 border-b border-zinc-800 flex justify-between items-center">
                        <span>Code Example</span>
                        <span className="text-blue-400">HTML / JS</span>
                      </div>
                      <pre className="p-4 text-xs sm:text-sm font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                        <code>{section.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {section.tip && (
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs sm:text-sm text-blue-600 dark:text-blue-300 flex items-start gap-3 my-4">
                      <Sparkles className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-primary dark:text-white block mb-0.5 font-bold">Pro Engineering Tip:</strong>
                        <span>{section.tip}</span>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Key Takeaways Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-950/20 via-surface to-indigo-950/20 dark:from-blue-950/30 dark:via-zinc-900 dark:to-indigo-950/30 border border-blue-500/30 space-y-4 shadow-xl">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Key Takeaways for Developers</span>
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-secondary dark:text-zinc-200">
                {post.content.takeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-blue-500 dark:text-blue-400 font-extrabold text-base leading-none">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQ Section for SEO Rich Results */}
            {post.content.faqs && post.content.faqs.length > 0 && (
              <section className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-3">
                  {post.content.faqs.map((faq, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-surface dark:bg-zinc-900/60 border border-border dark:border-zinc-800/80 space-y-2"
                    >
                      <h4 className="text-sm font-bold text-primary dark:text-white">{faq.question}</h4>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Author Biography Box */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-zinc-900/50 border border-border dark:border-zinc-800/80 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20 shrink-0">
                {post.author.avatar}
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">About the Author</span>
                <h4 className="text-base font-bold text-primary dark:text-white">{post.author.name}</h4>
                <p className="text-xs text-muted leading-relaxed">
                  {post.author.bio}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-xs text-muted">Tags:</span>
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="bg-surface dark:bg-zinc-900 text-muted text-xs font-mono px-3 py-1 rounded-xl border border-border dark:border-zinc-800"
                >
                  #{t}
                </span>
              ))}
            </div>

          </article>

          {/* Sidebar (4 cols on desktop) */}
          <aside className="lg:col-span-4 space-y-6 sticky top-20">

            {/* Table of Contents */}
            <div className="bg-surface dark:bg-zinc-900/70 border border-border dark:border-zinc-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Table of Contents</span>
              </h4>
              <nav className="space-y-1.5 text-xs">
                {post.content.sections.map((section, idx) => (
                  <a
                    key={idx}
                    href={`#section-${idx}`}
                    className="block py-1 px-2.5 rounded-lg text-muted hover:text-primary dark:hover:text-white hover:bg-surface-elevated dark:hover:bg-zinc-800/60 transition-colors truncate"
                  >
                    {section.heading}
                  </a>
                ))}
              </nav>
            </div>

            {/* Instant Tool Conversion CTA */}
            <div className="bg-gradient-to-br from-blue-950/20 via-surface to-indigo-950/20 dark:from-blue-950/40 dark:via-zinc-900 dark:to-indigo-950/40 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-primary dark:text-white">Optimize Your Images Now</h4>
                <p className="text-xs text-muted">
                  Convert JPG, PNG to WebP and AVIF with up to 80% compression in seconds.
                </p>
              </div>
              <Link
                href="/tools"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Open Resizer Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Back to Blog Hub */}
            <Link
              href="/blog"
              className="w-full py-2.5 px-4 rounded-xl bg-surface dark:bg-zinc-900 hover:bg-surface-elevated dark:hover:bg-zinc-800 border border-border dark:border-zinc-800 text-secondary dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Articles</span>
            </Link>

          </aside>

        </div>

        {/* ========================================================================= */}
        {/* RELATED ARTICLES                                                          */}
        {/* ========================================================================= */}
        <div className="pt-12 border-t border-border dark:border-zinc-800/80 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span>Related Engineering Insights</span>
            </h3>
            <Link href="/blog" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <Link
                key={rPost.id}
                href={`/blog/${rPost.slug}`}
                className="bg-surface dark:bg-zinc-900/60 border border-border dark:border-zinc-800/80 hover:border-blue-500/40 rounded-2xl p-5 backdrop-blur-xl transition-all hover:-translate-y-1 shadow-lg group flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] text-muted">
                    <span className="font-mono uppercase text-blue-500 dark:text-blue-400 font-bold">{rPost.category}</span>
                    <span>{rPost.readTime}</span>
                  </div>
                  <h4 className="text-sm font-bold text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors leading-snug">
                    {rPost.title}
                  </h4>
                  <p className="text-xs text-muted line-clamp-2">
                    {rPost.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-border dark:border-zinc-800/60 flex items-center justify-between text-xs text-muted">
                  <span>{rPost.author.name}</span>
                  <span className="text-blue-500 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}