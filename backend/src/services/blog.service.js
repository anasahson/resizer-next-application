const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Get blog posts with pagination, search, and category filter
 */
async function getBlogPosts({ page = 1, limit = 20, search = '', category = '', publishedOnly = true }) {
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const whereConditions = [];
  const params = [];

  if (publishedOnly) {
    whereConditions.push('is_published = TRUE');
  }

  if (category && category !== 'All') {
    whereConditions.push('LOWER(category) = LOWER(?)');
    params.push(category);
  }

  if (search) {
    whereConditions.push('(title LIKE ? OR excerpt LIKE ? OR tags LIKE ?)');
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count
  const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM blog_posts ${whereClause}`, params);
  const total = countResult[0].total;

  // Get paginated posts
  const [rows] = await pool.query(
    `SELECT id, slug, title, seo_title, meta_description, excerpt, category, read_time, author_name, author_role, featured_image, tags, content, faqs, is_published, created_at, updated_at 
     FROM blog_posts ${whereClause} 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

  const posts = rows.map(formatPostRow);

  return {
    posts,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Get a single blog post by slug
 */
async function getPostBySlug(slug) {
  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE slug = ?', [slug]);
  if (rows.length === 0) return null;
  return formatPostRow(rows[0]);
}

/**
 * Get a single blog post by ID
 */
async function getPostById(id) {
  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return formatPostRow(rows[0]);
}

/**
 * Create a new blog post
 */
async function createBlogPost(data) {
  const id = `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  let slug = data.slug || generateSlug(data.title);

  // Ensure unique slug
  let uniqueSlug = slug;
  let counter = 1;
  while (true) {
    const [existing] = await pool.query('SELECT id FROM blog_posts WHERE slug = ?', [uniqueSlug]);
    if (existing.length === 0) break;
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const tagsJson = Array.isArray(data.tags) ? JSON.stringify(data.tags) : JSON.stringify([]);
  const contentJson = typeof data.content === 'object' ? JSON.stringify(data.content) : data.content;
  const faqsJson = Array.isArray(data.faqs) ? JSON.stringify(data.faqs) : JSON.stringify([]);

  await pool.query(
    `INSERT INTO blog_posts (
      id, slug, title, seo_title, meta_description, excerpt, category, read_time,
      author_name, author_role, featured_image, tags, content, faqs, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      uniqueSlug,
      data.title,
      data.seoTitle || data.title,
      data.metaDescription || data.excerpt || '',
      data.excerpt || '',
      data.category || 'Engineering',
      data.readTime || '5 min read',
      data.authorName || 'Resizer Engineering',
      data.authorRole || 'Technical Staff',
      data.featuredImage || null,
      tagsJson,
      contentJson,
      faqsJson,
      data.isPublished !== undefined ? data.isPublished : true,
    ]
  );

  return getPostById(id);
}

/**
 * Update an existing blog post
 */
async function updateBlogPost(id, data) {
  const existing = await getPostById(id);
  if (!existing) {
    throw new Error('Blog post not found');
  }

  const updates = [];
  const params = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }
  if (data.slug !== undefined) {
    updates.push('slug = ?');
    params.push(data.slug);
  }
  if (data.seoTitle !== undefined) {
    updates.push('seo_title = ?');
    params.push(data.seoTitle);
  }
  if (data.metaDescription !== undefined) {
    updates.push('meta_description = ?');
    params.push(data.metaDescription);
  }
  if (data.excerpt !== undefined) {
    updates.push('excerpt = ?');
    params.push(data.excerpt);
  }
  if (data.category !== undefined) {
    updates.push('category = ?');
    params.push(data.category);
  }
  if (data.readTime !== undefined) {
    updates.push('read_time = ?');
    params.push(data.readTime);
  }
  if (data.authorName !== undefined) {
    updates.push('author_name = ?');
    params.push(data.authorName);
  }
  if (data.authorRole !== undefined) {
    updates.push('author_role = ?');
    params.push(data.authorRole);
  }
  if (data.featuredImage !== undefined) {
    updates.push('featured_image = ?');
    params.push(data.featuredImage);
  }
  if (data.tags !== undefined) {
    updates.push('tags = ?');
    params.push(Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags);
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    params.push(typeof data.content === 'object' ? JSON.stringify(data.content) : data.content);
  }
  if (data.faqs !== undefined) {
    updates.push('faqs = ?');
    params.push(Array.isArray(data.faqs) ? JSON.stringify(data.faqs) : data.faqs);
  }
  if (data.isPublished !== undefined) {
    updates.push('is_published = ?');
    params.push(data.isPublished);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  return getPostById(id);
}

/**
 * Delete a blog post
 */
async function deleteBlogPost(id) {
  const [result] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/**
 * Helper to generate slug from title
 */
function generateSlug(title) {
  return (title || 'untitled-article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Helper to format database row
 */
function formatPostRow(row) {
  let parsedContent = row.content;
  try {
    if (typeof row.content === 'string' && (row.content.startsWith('{') || row.content.startsWith('['))) {
      parsedContent = JSON.parse(row.content);
    }
  } catch (_) {}

  let parsedTags = [];
  try {
    parsedTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [];
  } catch (_) {
    parsedTags = row.tags ? row.tags.split(',').map((t) => t.trim()) : [];
  }

  let parsedFaqs = [];
  try {
    parsedFaqs = typeof row.faqs === 'string' ? JSON.parse(row.faqs) : row.faqs || [];
  } catch (_) {}

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    seoTitle: row.seo_title || row.title,
    metaDescription: row.meta_description || row.excerpt,
    excerpt: row.excerpt,
    category: row.category,
    readTime: row.read_time,
    author: {
      name: row.author_name || 'Resizer Team',
      role: row.author_role || 'Staff Writer',
      avatar: (row.author_name || 'R').charAt(0).toUpperCase(),
    },
    featuredImage: row.featured_image,
    tags: parsedTags,
    content: parsedContent,
    faqs: parsedFaqs,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getBlogPosts,
  getPostBySlug,
  getPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
};
