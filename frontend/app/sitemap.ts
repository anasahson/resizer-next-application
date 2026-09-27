import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizora.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Core high-priority landing pages for Google indexation
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/features`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Dynamically load blog post slugs
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE}/blog/posts?limit=100`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const posts = json?.data?.posts || [];
      blogRoutes = posts.map((post: { slug: string; updated_at?: string; created_at?: string }) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updated_at || post.created_at || currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn('Sitemap generation could not fetch live posts, falling back to static routes:', err);
  }

  return [...staticRoutes, ...blogRoutes];
}
