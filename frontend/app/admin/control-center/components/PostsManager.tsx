'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PostEditor from './PostEditor';
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Layers,
  Globe,
} from 'lucide-react';
import { BUILT_IN_POST_CATEGORIES, loadCustomPostCategories } from './postCategories';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

const POST_CATEGORIES = [
  { value: 'All', label: 'All posts', description: 'Every article' },
  { value: 'Formats', label: 'Image formats', description: 'WebP, AVIF, JPEG' },
  { value: 'Performance', label: 'Web performance', description: 'Core Web Vitals, LCP' },
  { value: 'Engineering', label: 'Image engineering', description: 'Sharp, Node.js, libvips' },
  { value: 'Best Practices', label: 'Best practices', description: 'Responsive images, srcset' },
];

export default function PostsManager() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const pageSize = 10;
  const categoryFilters = [
    ...POST_CATEGORIES,
    ...customCategories
      .filter((item) => !BUILT_IN_POST_CATEGORIES.includes(item))
      .map((item) => ({ value: item, label: item, description: 'Custom post category' })),
  ];

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('resizer_superadmin_auth_token') || '' : '';
  };

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [category]);
  
  useEffect(() => {
    setCustomCategories(loadCustomPostCategories());
    const refreshCategories = () => setCustomCategories(loadCustomPostCategories());
    window.addEventListener('resizer-post-categories-updated', refreshCategories);
    return () => window.removeEventListener('resizer-post-categories-updated', refreshCategories);
  }, []);

  const fetchPosts = async (requestedPage = page) => {
    try {
      setLoading(true);
      const url = `${BACKEND_URL}/api/admin/posts?page=${requestedPage}&limit=${pageSize}&category=${category === 'All' ? '' : category}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPosts(data.data.posts || []);
        setPage(data.data.pagination?.page || requestedPage);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.filter((p) => p.id !== id));
      } else {
        alert(data.message || 'Failed to delete post.');
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // If in Create or Edit mode, display PostEditor
  if (isCreating || editingPost) {
    return (
      <PostEditor
        initialPost={editingPost}
        onSaveSuccess={() => {
          setIsCreating(false);
          setEditingPost(null);
          fetchPosts();
        }}
        onCancel={() => {
          setIsCreating(false);
          setEditingPost(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-surface to-indigo-500/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-indigo-950/40 border border-blue-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Content Management System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Blog Posts &amp; Engineering Insights CMS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Create, edit, and publish high-ranking technical articles, format benchmarks, and tutorials into the MySQL database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {categoryFilters.map((cat) => {
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                title={cat.description}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchPosts();
              }}
              className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => fetchPosts(page)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-xl shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 dark:text-zinc-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading articles from MySQL...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 dark:text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300">No blog posts found in database</h4>
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              Click &quot;Write New Article&quot; to create your first SEO-optimized post with AI assistance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-950/80 text-slate-600 dark:text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3.5 px-6">Article &amp; Slug</th>
                  <th className="py-3.5 px-6">Category &amp; Tags</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Read Time</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white max-w-sm sm:max-w-md truncate">
                          {post.title}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 truncate max-w-xs">
                          /blog/{post.slug}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full font-mono">
                          {post.category}
                        </span>
                        {(post.tags || []).slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] text-slate-500 dark:text-zinc-400">#{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Draft</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                      {post.readTime}
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-zinc-400 text-[11px]">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="View Live Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-600/15 hover:bg-blue-100 dark:hover:bg-blue-600/30 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors"
                          title="Edit Post"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-600/15 hover:bg-rose-100 dark:hover:bg-rose-600/30 text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200 transition-colors"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fetchPosts(page - 1)} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:border-blue-400">Previous</button>
            <button type="button" onClick={() => fetchPosts(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 disabled:opacity-40 hover:border-blue-400">Next</button>
          </div>
        </div>
      )}

    </div>
  );
}
