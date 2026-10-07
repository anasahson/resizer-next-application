const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Built-in foundational blog articles (seeded automatically if the database has 0 posts)
 */
const SEED_BLOG_POSTS = [
  {
    id: 'post_seed_webp_avif',
    slug: 'webp-vs-avif-modern-image-formats',
    title: 'WebP vs AVIF: Which Next-Gen Image Format Should You Choose in 2026?',
    seoTitle: 'WebP vs AVIF: Complete 2026 Comparison & Performance Benchmark',
    metaDescription: 'Discover the differences between WebP and AVIF. Benchmark compression ratios, browser compatibility, encoding speed, and image quality for optimal web performance.',
    excerpt: 'A comprehensive technical comparison between WebP and AVIF covering compression ratios, decoding speed, browser support, and lossless alpha transparency.',
    category: 'Formats',
    readTime: '6 min read',
    authorName: 'Dr. Sarah Chen',
    authorRole: 'Lead Media Architect',
    authorBio: 'Dr. Sarah Chen is a media compression researcher and lead architect specializing in next-gen image codecs and high-throughput streaming pipelines.',
    tags: ['WebP', 'AVIF', 'Compression', 'Bandwidth', 'Image Optimization'],
    content: {
      overview: 'Modern web applications cannot afford heavy uncompressed assets. WebP and AVIF have emerged as the two primary next-generation formats, but each possesses distinct trade-offs in encoding latency, browser decoding efficiency, and compression ratios.',
      sections: [
        {
          heading: '1. Compression Efficiency & Byte Reduction',
          body: 'AVIF (AV1 Image File Format) consistently achieves 20% to 30% higher byte savings compared to WebP at equivalent perceptual quality (measured via SSIM and PSNR), especially in low-frequency textures and gradient-heavy photographs. However, WebP encodes up to 5x faster, making it an ideal choice for on-the-fly dynamic image resizing pipelines.',
          tip: 'Use AVIF for hero graphics and static gallery assets, and WebP for real-time user-generated content uploads.',
        },
        {
          heading: '2. Browser Ecosystem Compatibility & Native Fallbacks',
          body: 'As of 2026, AVIF and WebP enjoy universal support across all major browser engines, including Chromium (Chrome, Edge, Brave), WebKit (Safari on iOS & macOS), and Gecko (Firefox). Using HTML5 picture tags ensures 100% device compatibility with zero overhead.',
          codeSnippet: `<picture>\n  <!-- Serve next-gen AVIF to modern browsers -->\n  <source srcset="/img/banner.avif" type="image/avif">\n  <!-- Fallback to WebP -->\n  <source srcset="/img/banner.webp" type="image/webp">\n  <!-- Standard fallback for legacy crawlers -->\n  <img src="/img/banner.jpg" alt="Optimized Hero Banner" width="1200" height="630" loading="lazy">\n</picture>`,
        },
        {
          heading: '3. HDR and Wide Color Gamut Support',
          body: 'AVIF natively supports 10-bit and 12-bit color depth, HDR (High Dynamic Range), and wide color gamuts (BT.2020), which WebP (strictly limited to 8-bit sRGB) cannot deliver. For e-commerce and photography portfolios, AVIF preserves vibrant highlights and shadow fidelity.',
        },
        {
          heading: '4. Alpha Transparency and Lossless Encoding',
          body: 'Both WebP and AVIF support alpha channel transparency. WebP lossless is exceptionally fast and often produces smaller files than PNG, making it a drop-in replacement for transparent UI icons and stickers.',
        },
      ],
      takeaways: [
        'AVIF produces 20-30% smaller files than WebP for photographs.',
        'WebP offers significantly faster encoding times for real-time processing.',
        'Leverage HTML5 <picture> tags to seamlessly negotiate the best format for each client.',
      ],
      faqs: [
        {
          question: 'Is AVIF better than WebP for SEO and Core Web Vitals?',
          answer: 'Yes. AVIF yields smaller file sizes which decreases download latency and directly improves Largest Contentful Paint (LCP) scores, a crucial Google ranking factor.',
        },
        {
          question: 'Do all modern browsers support WebP and AVIF in 2026?',
          answer: 'Yes, both WebP and AVIF are supported natively by Chrome, Safari, Firefox, Edge, and mobile browsers on iOS and Android.',
        },
        {
          question: 'When should I choose WebP over AVIF?',
          answer: 'Choose WebP when your server performs on-demand image transformations with tight latency requirements, or when replacing lossless transparent PNGs.',
        },
      ],
    },
  },
  {
    id: 'post_seed_lcp_vitals',
    slug: 'core-web-vitals-lcp-image-optimization',
    title: 'How Image Optimization Dramatically Improves Core Web Vitals (LCP & CLS)',
    seoTitle: 'Improve Core Web Vitals (LCP & CLS) with Image Optimization | Guide',
    metaDescription: 'Learn how optimizing hero images, responsive breakpoints, and preloading modern formats improves Largest Contentful Paint (LCP) and eliminates Cumulative Layout Shift (CLS).',
    excerpt: 'Largest Contentful Paint is 70% dominated by image load times. Learn the proven engineering tactics to achieve sub-second LCP scores on Google PageSpeed Insights.',
    category: 'Performance',
    readTime: '8 min read',
    authorName: 'Alex Johnson',
    authorRole: 'Web Performance Engineer',
    authorBio: 'Alex Johnson is a web performance engineer specializing in front-end metrics, sub-second LCP rendering, and lighthouse audits.',
    tags: ['Core Web Vitals', 'LCP', 'CLS', 'PageSpeed', 'SEO'],
    content: {
      overview: 'Google search rankings and user bounce rates depend heavily on Core Web Vitals. The largest element in the viewport—almost always a hero image or promotional banner—dictates your Largest Contentful Paint (LCP) score.',
      sections: [
        {
          heading: '1. Eliminating Render-Blocking Media',
          body: 'Never use `loading="lazy"` on above-the-fold hero images. Add `fetchpriority="high"` and preload the modern format in the HTML head to trigger immediate resource fetching before CSS/JS finishes parsing.',
          codeSnippet: `<link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high">`,
        },
        {
          heading: '2. Preventing Cumulative Layout Shift (CLS)',
          body: 'Always specify explicit `width` and `height` attributes or CSS `aspect-ratio` on every image tag. This lets the browser reserve the exact layout box before bytes download, eliminating layout shifts that hurt SEO.',
        },
        {
          heading: '3. Responsive Breakpoints & Densities',
          body: 'Serving a 4000px desktop banner to a mobile device on 4G ruins LCP. Generate automated responsive sizes: 400w, 800w, 1200w, 1600w with appropriate media queries.',
        },
      ],
      takeaways: [
        'Preload above-the-fold images with fetchpriority="high".',
        'Always provide width/height or aspect-ratio to prevent CLS.',
        'Use modern compression pipelines to keep hero images under 100KB.',
      ],
      faqs: [
        {
          question: 'What is a good LCP score for SEO in 2026?',
          answer: 'A good Largest Contentful Paint (LCP) score is 2.5 seconds or faster. Top-performing e-commerce sites target under 1.2 seconds.',
        },
        {
          question: 'Why does lazy loading hurt hero image LCP?',
          answer: 'Lazy loading delays image fetching until the browser verifies viewport position, delaying the hero image request by hundreds of milliseconds.',
        },
      ],
    },
  },
  {
    id: 'post_seed_png_lossless',
    slug: 'lossless-png-compression-techniques',
    title: 'Deep Dive: Lossless PNG Compression and Color Palette Quantization',
    seoTitle: 'Lossless PNG Compression: Reduce File Size by 65% | Tech Guide',
    metaDescription: 'Learn how color quantization, alpha channel stripping, and Deflate compression reduce PNG file sizes by up to 65% with zero visual quality loss.',
    excerpt: 'How color palette quantization, alpha channel stripping, and Deflate compression reduce PNG file sizes by up to 65% without visual degradation.',
    category: 'Engineering',
    readTime: '5 min read',
    authorName: 'Elena Rostova',
    authorRole: 'Graphics Systems Specialist',
    authorBio: 'Elena Rostova specializes in low-level graphics processing, raster manipulation, and lossless compression algorithms.',
    tags: ['PNG', 'Quantization', 'Lossless', 'Sharp', 'libpng'],
    content: {
      overview: 'PNG remains the standard for screenshots, UI icons, and assets requiring sharp lines and lossless transparency. However, raw 24-bit/32-bit PNGs carry immense bloat that can be stripped with quantization algorithms.',
      sections: [
        {
          heading: '1. Converting 32-bit RGBA to 8-bit Indexed Color',
          body: 'Quantization algorithms (such as pngquant or libimagequant) reduce thousands of subtle color shades to a 256-color palette with Floyd-Steinberg dithering, shrinking file sizes by 60-70% while maintaining crisp edges.',
        },
        {
          heading: '2. Stripping Metadata Chunks',
          body: 'Default camera and design exports (Figma, Photoshop) embed ICC profiles, EXIF data, and timestamp chunks that add unnecessary kilobytes. Stripping these chunks preserves pixels while dropping file size.',
        },
      ],
      takeaways: [
        '8-bit indexed PNGs reduce size by up to 70% with imperceptible visual change.',
        'Always strip non-essential metadata in production pipelines.',
      ],
      faqs: [
        {
          question: 'Can indexed PNGs support transparency?',
          answer: 'Yes, 8-bit PNGs support indexed alpha transparency, allowing translucent gradients or single-color transparency at drastically reduced sizes.',
        },
      ],
    },
  },
  {
    id: 'post_seed_sharp_pipeline',
    slug: 'nextjs-image-and-sharp-backend-pipeline',
    title: 'Building a High-Performance Media Pipeline with Node.js and Sharp',
    seoTitle: 'High-Performance Image Pipeline with Node.js & Sharp Engine',
    metaDescription: 'Learn how to build a high-throughput image transformation microservice using Node.js, Express, Sharp, and libvips with streaming memory management.',
    excerpt: 'Explore how the libvips C++ engine empowers Sharp to process tens of thousands of images concurrently with ultra-low memory overhead.',
    category: 'Engineering',
    readTime: '7 min read',
    authorName: 'Marcus Vance',
    authorRole: 'Backend Infrastructure Architect',
    authorBio: 'Marcus Vance designs distributed media pipelines and containerized microservices handling millions of transformations daily.',
    tags: ['Node.js', 'Sharp', 'libvips', 'Backend', 'Microservices'],
    content: {
      overview: 'When building image processing microservices, memory consumption and throughput are critical. Sharp is 4x to 8x faster than ImageMagick and GraphicsMagick because it uses the multithreaded libvips image processing library.',
      sections: [
        {
          heading: '1. Non-Blocking Streaming Pipelines',
          body: 'Sharp works seamlessly with Node.js Readable and Writable streams, allowing images to be transformed on the fly without loading full buffers into V8 heap memory.',
          codeSnippet: `const sharp = require('sharp');\nconst pipeline = sharp()\n  .resize(800, 600, { fit: 'inside' })\n  .webp({ quality: 80 })\n  .on('info', (info) => console.log('Transformed:', info));\nreadableStream.pipe(pipeline).pipe(writableStream);`,
        },
        {
          heading: '2. Concurrency and Thread Pool Tuning',
          body: 'Tune UV_THREADPOOL_SIZE and sharp.concurrency(N) to match the available CPU cores of your Docker container or VM to maximize throughput.',
        },
      ],
      takeaways: [
        'Sharp leverages libvips for 4x-8x speedups over legacy tools.',
        'Use streaming buffers to prevent V8 memory spikes on large batches.',
      ],
      faqs: [
        {
          question: 'Why is Sharp faster than ImageMagick?',
          answer: 'Sharp uses libvips, which processes image data as a pipeline of scanlines rather than keeping entire uncompressed pixel buffers in RAM.',
        },
      ],
    },
  },
  {
    id: 'post_seed_responsive_art',
    slug: 'responsive-images-art-direction-best-practices',
    title: 'Mastering Responsive Images: Art Direction, Resolution Switching & `sizes`',
    seoTitle: 'Responsive Images Best Practices: srcset, sizes & picture Tag',
    metaDescription: 'Master the syntax and logic of srcset, sizes, and picture elements to deliver the crispest image for every display density without wasting bandwidth.',
    excerpt: 'Master the syntax and logic of srcset, sizes, and picture elements to deliver the crispest image for every display density without wasting bandwidth.',
    category: 'Best Practices',
    readTime: '6 min read',
    authorName: 'Dr. Sarah Chen',
    authorRole: 'Lead Media Architect',
    authorBio: 'Dr. Sarah Chen is a media compression researcher and lead architect specializing in next-gen image codecs and high-throughput streaming pipelines.',
    tags: ['Responsive', 'srcset', 'HTML5', 'CSS', 'Mobile'],
    content: {
      overview: 'High-density Retina screens require double or triple pixel density, while mobile users on 3G need lightweight alternatives. Discover the optimal formula for responsive image delivery.',
      sections: [
        {
          heading: '1. Resolution Switching vs. Art Direction',
          body: 'Resolution switching serves the same photo in varying dimensions for different viewports (srcset + sizes). Art direction crops or changes the composition entirely for mobile viewports using <picture> and media queries.',
        },
        {
          heading: '2. Calculating the Optimal `sizes` Attribute',
          body: 'If your layout is 100vw on mobile and 50vw on desktop, specify sizes="(max-width: 768px) 100vw, 50vw" so the browser downloads the exact matching asset before CSS is parsed.',
        },
      ],
      takeaways: [
        'Never skip the sizes attribute when using srcset with w-descriptors.',
        'Use art direction to crop focal points for mobile vertical screens.',
      ],
      faqs: [
        {
          question: 'What happens if I omit the sizes attribute?',
          answer: 'Browsers assume 100vw by default, which can cause desktop browsers to fetch unnecessarily large image assets.',
        },
      ],
    },
  },
  {
    id: 'post_seed_future_hdr',
    slug: 'future-of-web-imagery-hdr-jpegxl',
    title: 'The Future of Web Imagery: JPEG XL, Ultra HDR, and Neural Super-Resolution',
    seoTitle: 'The Future of Web Imagery: JPEG XL, HDR & AI Super-Resolution',
    metaDescription: 'Explore emerging image formats like JPEG XL, Ultra HDR standards, and client-side WebGPU neural upscaling revolutionizing web performance.',
    excerpt: 'An outlook on emerging image standards, wide gamut displays, progressive multi-layer decoding, and AI-accelerated upscaling for next-generation web applications.',
    category: 'Formats',
    readTime: '9 min read',
    authorName: 'Alex Johnson',
    authorRole: 'Web Performance Engineer',
    authorBio: 'Alex Johnson is a web performance engineer specializing in front-end metrics, sub-second LCP rendering, and lighthouse audits.',
    tags: ['JPEG XL', 'HDR', 'AI Upscaling', 'Future Web', 'WebGPU'],
    content: {
      overview: 'The frontier of web media is shifting towards high dynamic range (Ultra HDR) and intelligent perceptual compression. We explore how modern standards will shape web media over the next decade.',
      sections: [
        {
          heading: '1. JPEG XL: Lossless Legacy JPEG Transcoding',
          body: 'JPEG XL can losslessly transcode existing JPEG files to achieve an immediate 20% file reduction with zero generation loss, and decode faster than any existing format.',
        },
        {
          heading: '2. On-Device Neural Super-Resolution',
          body: 'Modern GPUs allow low-resolution thumbnails to be upscaled client-side using WebGL/WebGPU shaders, saving 90% of transmission bandwidth.',
        },
      ],
      takeaways: [
        'JPEG XL offers lossless backward-compatible transcoding of existing JPEGs.',
        'Client-side WebGPU upscaling is revolutionizing mobile data savings.',
      ],
      faqs: [
        {
          question: 'Can JPEG XL replace existing JPEGs without recompression artifacts?',
          answer: 'Yes, JPEG XL contains a bit-exact lossless transcode mode that reconstructs the exact original JPEG bytes upon demand.',
        },
      ],
    },
  },
];

let isSeeding = false;
/**
 * Auto-seeds initial blog posts if table is currently empty
 */
async function autoSeedIfEmpty() {
  if (isSeeding) return;
  try {
    isSeeding = true;
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM blog_posts');
    if (rows[0].total === 0) {
      console.log('[Blog Service] Auto-seeding foundational articles into empty blog_posts table...');
      const { generateImageWithAI } = require('./ai.service');

      for (const p of SEED_BLOG_POSTS) {
        const banner = await generateImageWithAI({
          prompt: p.title,
          category: p.category,
          tags: p.tags,
        });

        await pool.query(
          `INSERT INTO blog_posts (
            id, slug, title, seo_title, meta_description, excerpt, category, read_time,
            author_name, author_role, featured_image, tags, content, faqs, is_published, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            p.id,
            p.slug,
            p.title,
            p.seoTitle,
            p.metaDescription,
            p.excerpt,
            p.category,
            p.readTime,
            p.authorName,
            p.authorRole,
            banner.imageUri,
            JSON.stringify(p.tags),
            JSON.stringify(p.content),
            JSON.stringify(p.content.faqs || []),
            1,
          ]
        );
      }
      console.log('[Blog Service] Auto-seeded 6 foundational articles successfully.');
    }
  } catch (err) {
    console.warn('[Blog Service] Auto-seed check notice:', err.message);
  } finally {
    isSeeding = false;
  }
}

/**
 * Get blog posts with pagination, search, and category filter
 */
async function getBlogPosts({ page = 1, limit = 20, search = '', category = '', publishedOnly = true }) {
  // Ensure table has initial posts if brand new
  await autoSeedIfEmpty();

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
  const total = countResult[0]?.total || 0;

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
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
    },
  };
}

/**
 * Get a single blog post by slug with related posts
 */
async function getPostBySlug(slug) {
  await autoSeedIfEmpty();

  const [rows] = await pool.query('SELECT * FROM blog_posts WHERE slug = ?', [slug]);
  if (rows.length === 0) {
    // Check fallback seed memory
    const seedMatch = SEED_BLOG_POSTS.find((p) => p.slug === slug);
    if (!seedMatch) return null;
    return formatPostRow({
      ...seedMatch,
      author_name: seedMatch.authorName,
      author_role: seedMatch.authorRole,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_published: 1,
    });
  }

  const post = formatPostRow(rows[0]);

  // Fetch up to 3 related articles from same category or newest
  try {
    const [relatedRows] = await pool.query(
      `SELECT id, slug, title, excerpt, category, read_time, featured_image, created_at 
       FROM blog_posts 
       WHERE slug != ? AND is_published = TRUE 
       ORDER BY (category = ?) DESC, created_at DESC 
       LIMIT 3`,
      [slug, post.category]
    );
    post.relatedPosts = relatedRows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      category: r.category,
      readTime: r.read_time,
      featuredImage: r.featured_image,
    }));
  } catch (_) {
    post.relatedPosts = [];
  }

  return post;
}

/**
 * Get categories with post counts
 */
async function getBlogCategories() {
  await autoSeedIfEmpty();
  const [rows] = await pool.query(
    `SELECT category, COUNT(*) as count 
     FROM blog_posts 
     WHERE is_published = TRUE 
     GROUP BY category 
     ORDER BY count DESC`
  );
  return rows.map((r) => ({ category: r.category, count: parseInt(r.count, 10) }));
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
      author_name, author_role, featured_image, tags, content, faqs, is_published, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
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
 * Helper to format database row into guaranteed safe, structured post object
 */
function formatPostRow(row) {
  let parsedContent = row.content;
  if (typeof row.content === 'string') {
    try {
      if (row.content.startsWith('{') || row.content.startsWith('[')) {
        parsedContent = JSON.parse(row.content);
      }
    } catch (_) {}
  }

  // Ensure content object structure is always guaranteed
  if (!parsedContent || typeof parsedContent !== 'object') {
    const rawText = String(row.content || row.excerpt || '');
    parsedContent = {
      overview: row.excerpt || rawText.substring(0, 300),
      sections: [
        {
          heading: '1. Overview & Architectural Insights',
          body: rawText,
        },
      ],
      takeaways: ['Adopt modern image codecs to reduce bandwidth.', 'Benchmark media pipelines continuously.'],
      faqs: [],
    };
  } else {
    if (!Array.isArray(parsedContent.sections)) parsedContent.sections = [];
    if (!Array.isArray(parsedContent.takeaways)) parsedContent.takeaways = [];
    if (!Array.isArray(parsedContent.faqs)) parsedContent.faqs = [];
    if (!parsedContent.overview) parsedContent.overview = row.excerpt || '';
  }

  let parsedTags = [];
  try {
    parsedTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [];
  } catch (_) {
    parsedTags = row.tags ? String(row.tags).split(',').map((t) => t.trim()) : [];
  }
  if (!Array.isArray(parsedTags)) parsedTags = [];

  let parsedFaqs = [];
  try {
    parsedFaqs = typeof row.faqs === 'string' ? JSON.parse(row.faqs) : row.faqs || [];
  } catch (_) {}
  if (!Array.isArray(parsedFaqs)) parsedFaqs = [];

  const createdDate = row.created_at ? new Date(row.created_at) : new Date();
  const dateFormatted = !isNaN(createdDate.getTime())
    ? createdDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const authorName = row.author_name || 'Resizer Engineering';
  const authorRole = row.author_role || 'Staff Media Architect';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    seoTitle: row.seo_title || row.title,
    metaDescription: row.meta_description || row.excerpt || '',
    excerpt: row.excerpt || '',
    category: row.category || 'Engineering',
    readTime: row.read_time || '6 min read',
    date: dateFormatted,
    isoDate: !isNaN(createdDate.getTime()) ? createdDate.toISOString() : new Date().toISOString(),
    author: {
      name: authorName,
      role: authorRole,
      avatar: authorName.charAt(0).toUpperCase(),
      bio: row.author_bio || `${authorName} is an engineering contributor at Resizer specializing in web performance, media codecs, and high-throughput transformation pipelines.`,
    },
    featuredImage: row.featured_image || null,
    tags: parsedTags,
    content: parsedContent,
    faqs: parsedFaqs.length > 0 ? parsedFaqs : (parsedContent.faqs || []),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  getBlogPosts,
  getPostBySlug,
  getBlogCategories,
  getPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  autoSeedIfEmpty,
};
