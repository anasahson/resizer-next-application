'use client';

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time?: string;
  readTime?: string;
  featured_image?: string | null;
  featuredImage?: string | null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/blog/posts?limit=100`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load blog posts.');
        return response.json();
      })
      .then((result) => setPosts(result.data?.posts || []))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts]
  );

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const query = searchTerm.toLowerCase();
    return matchesCategory && `${post.title} ${post.excerpt}`.toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Resizer Engineering Blog</h1>
          <p className="text-lg text-blue-100">Articles published from the live Resizer database.</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 overflow-x-auto pt-4 pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-8 py-16">
        {loading && <p className="text-center py-12 text-gray-600">Loading published articles...</p>}
        {error && <p className="text-center py-12 text-red-600">{error}</p>}
        {!loading && !error && filteredPosts.length === 0 && (
          <p className="text-center py-12 text-gray-600">No published articles are available yet.</p>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                {post.featured_image || post.featuredImage ? (
                  <img src={post.featured_image || post.featuredImage || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-blue-600">Resizer</span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{post.category}</span>
                  <span className="text-xs text-gray-500">{post.read_time || post.readTime || ''}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h2>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
                <a href={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-700 font-bold text-sm">Read More &rarr;</a>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
