'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Clock, ArrowRight, BookOpen, Sparkles, Filter } from 'lucide-react';
import { BLOG_POSTS, BlogPost as StaticBlogPost } from '../lib/blogData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time?: string;
  readTime?: string;
  featured_image?: string | null;
  featuredImage?: string | null;
  date?: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/blog/posts?limit=100`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load from API');
        return response.json();
      })
      .then((result) => {
        if (result.data?.posts && result.data.posts.length > 0) {
          setPosts(result.data.posts);
        } else {
          // Graceful fallback to static catalog
          setPosts(
            BLOG_POSTS.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              excerpt: p.excerpt,
              category: p.category,
              readTime: p.readTime,
              featuredImage: p.featuredImage,
              date: p.date,
            }))
          );
        }
      })
      .catch(() => {
        // Safe offline / fallback
        setPosts(
          BLOG_POSTS.map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            excerpt: p.excerpt,
            category: p.category,
            readTime: p.readTime,
            featuredImage: p.featuredImage,
            date: p.date,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || `${post.title} ${post.excerpt}`.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-background text-primary dark:text-zinc-100 selection:bg-blue-500 selection:text-white pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-600/10 via-background to-background dark:from-blue-950/30 dark:via-zinc-950 dark:to-zinc-950 py-16 px-4 sm:px-6 lg:px-8 border-b border-border dark:border-zinc-800/80">
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Engineering & Performance Publications</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary dark:text-white">
            Resizer Engineering Blog
          </h1>
          <p className="text-base sm:text-lg text-secondary dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Technical deep-dives, compression benchmarks, modern codecs (WebP, AVIF, JPEG XL), and sub-second rendering strategies for engineering teams.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 dark:bg-zinc-950/80 border-b border-border dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search articles, codecs, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-surface dark:bg-zinc-900 border border-border dark:border-zinc-800 text-primary dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-surface dark:bg-zinc-900 text-secondary dark:text-zinc-400 hover:text-primary dark:hover:text-white hover:bg-surface-elevated dark:hover:bg-zinc-800 border border-border dark:border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted">Loading technical publications...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-surface dark:bg-zinc-900/40 rounded-3xl border border-dashed border-border dark:border-zinc-800 p-8 max-w-lg mx-auto">
            <BookOpen className="w-10 h-10 text-muted mx-auto" />
            <h3 className="text-base font-bold text-primary dark:text-white">No articles matched your criteria</h3>
            <p className="text-xs text-muted">Try clearing your search query or selecting a different category filter.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}
              className="mt-2 text-xs font-semibold text-blue-500 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const imageSrc = post.featured_image || post.featuredImage;
              const readTime = post.read_time || post.readTime || '5 min read';

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block group h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-3xl"
                >
                  <article
                    className="h-full bg-surface dark:bg-zinc-900/60 border border-border dark:border-zinc-800/80 group-hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/15 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Hero Thumbnail Banner */}
                      <div className="relative h-44 bg-zinc-950 overflow-hidden border-b border-border dark:border-zinc-800/80">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-900/40 via-zinc-900 to-indigo-950/40 flex items-center justify-center p-6 text-center">
                            <span className="text-lg font-extrabold text-blue-400 font-mono tracking-wider">{post.category}</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full group-hover:bg-blue-600 transition-colors">
                          {post.category}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2 text-[11px] text-muted">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          <span>{readTime}</span>
                          {post.date && (
                            <>
                              <span>•</span>
                              <span>{post.date}</span>
                            </>
                          )}
                        </div>

                        <h2 className="text-lg font-bold text-primary dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-secondary dark:text-zinc-400 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6 pt-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1.5 transition-transform"
                      >
                        <span>Read Full Deep-Dive</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
