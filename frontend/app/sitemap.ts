import { MetadataRoute } from 'next';
import { PRESETS } from './lib/presets';
import { TOOL_ITEMS } from './data/tools';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Fallback slugs used ONLY if database is temporarily offline during build.
 * Kept strictly in sync with active published posts in the database.
 *
 * Exported so the /blog structured data (app/blog/layout.tsx) can advertise the
 * same verified set without a second copy drifting out of sync.
 */
export const CURRENT_ACTIVE_BLOG_SLUGS = [
  'smart-ai-image-resizer-resize-photos-online-for-free-architecture-codecs-performance-guide',
  'ultra-fast-webp-transcoding-pipelines',
  'instant-ai-image-resizer-perfect-dimensions-zero-quality-loss',
  'future-of-web-imagery-hdr-jpegxl',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Core high-priority landing pages for Google indexation
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
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
      url: `${SITE_URL}/guide`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/analyzer`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/remove-background`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
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
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Preset landing pages: one URL per high-intent search job, each with its own
  // title, H1 and FAQ schema (see app/presets/[slug]/page.tsx).
  const presetRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/presets`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...PRESETS.map((preset) => ({
      url: `${SITE_URL}/presets/${preset.slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
  ];

  const toolRoutes: MetadataRoute.Sitemap = TOOL_ITEMS.map((tool) => ({
    url: `${SITE_URL}${tool.href}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: tool.badge === 'New' ? 0.82 : 0.88,
  })).concat({
    url: `${SITE_URL}/workflows`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  });

  // Dynamically load active blog post slugs strictly from live database
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_BASE}/blog/posts?limit=500`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const json = await res.json();
      const posts = json?.data?.posts || [];
      if (Array.isArray(posts) && posts.length > 0) {
        blogRoutes = posts.map((post: { slug: string; updated_at?: string; created_at?: string }) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: post.updated_at || post.created_at || currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    }
  } catch (err) {
    console.warn('Sitemap live fetch failed, using active verified slugs fallback:', err);
  }

  // If DB returned nothing, fallback only to the current verified active slugs (never deleted posts)
  if (blogRoutes.length === 0) {
    blogRoutes = CURRENT_ACTIVE_BLOG_SLUGS.map((slug) => ({
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...presetRoutes, ...toolRoutes, ...blogRoutes];
}
