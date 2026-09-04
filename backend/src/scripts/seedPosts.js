const { pool } = require('../config/db');

async function seed() {
  const posts = [
    {
      id: 'post_001_webp_vs_avif',
      slug: 'webp-vs-avif-modern-image-formats',
      title: 'WebP vs AVIF: Which Next-Gen Image Format Should You Choose in 2026?',
      seo_title: 'WebP vs AVIF: Complete 2026 Comparison & Performance Benchmark',
      meta_description: 'Discover the differences between WebP and AVIF. Benchmark compression ratios, browser compatibility, encoding speed, and image quality for optimal web performance.',
      excerpt: 'A comprehensive technical comparison between WebP and AVIF covering compression ratios, decoding speed, browser support, and lossless alpha transparency.',
      category: 'Formats',
      read_time: '6 min read',
      author_name: 'Dr. Sarah Chen',
      author_role: 'Lead Media Architect',
      tags: JSON.stringify(['WebP', 'AVIF', 'Compression', 'Bandwidth', 'Image Optimization']),
      content: JSON.stringify({
        overview: 'Modern web applications cannot afford heavy uncompressed assets. WebP and AVIF have emerged as the two primary next-generation formats, but each possesses distinct trade-offs in encoding latency, browser decoding efficiency, and compression ratios.',
        sections: [
          {
            heading: '1. Compression Efficiency & Byte Reduction',
            body: 'AVIF (AV1 Image File Format) consistently achieves 20% to 30% higher byte savings compared to WebP at equivalent perceptual quality (measured via SSIM and PSNR), especially in low-frequency textures and gradient-heavy photographs. However, WebP encodes up to 5x faster, making it an ideal choice for on-the-fly dynamic image resizing pipelines.',
            tip: 'Use AVIF for hero graphics and static gallery assets, and WebP for real-time user-generated content uploads.'
          },
          {
            heading: '2. Browser Ecosystem Compatibility & Native Fallbacks',
            body: 'As of 2026, AVIF and WebP enjoy universal support across all major browser engines, including Chromium (Chrome, Edge, Brave), WebKit (Safari on iOS & macOS), and Gecko (Firefox). Using HTML5 picture tags ensures 100% device compatibility with zero overhead.',
            codeSnippet: '<picture>\n  <source srcset="/img/banner.avif" type="image/avif">\n  <source srcset="/img/banner.webp" type="image/webp">\n  <img src="/img/banner.jpg" alt="Optimized Hero Banner" width="1200" height="630" loading="lazy">\n</picture>'
          }
        ],
        takeaways: [
          'AVIF produces 20-30% smaller files than WebP for photographs.',
          'WebP offers significantly faster encoding times for real-time processing.',
          'Leverage HTML5 <picture> tags to seamlessly negotiate the best format for each client.'
        ]
      }),
      faqs: JSON.stringify([
        {
          question: 'Is AVIF better than WebP for SEO and Core Web Vitals?',
          answer: 'Yes. AVIF yields smaller file sizes which decreases download latency and directly improves Largest Contentful Paint (LCP) scores.'
        }
      ]),
      is_published: 1
    },
    {
      id: 'post_002_core_web_vitals',
      slug: 'core-web-vitals-lcp-image-optimization',
      title: 'How Image Optimization Dramatically Improves Core Web Vitals (LCP & CLS)',
      seo_title: 'Improve Core Web Vitals (LCP & CLS) with Image Optimization | Guide',
      meta_description: 'Learn how optimizing hero images, responsive breakpoints, and preloading modern formats improves Largest Contentful Paint (LCP) and eliminates Cumulative Layout Shift (CLS).',
      excerpt: 'Largest Contentful Paint is 70% dominated by image load times. Learn the proven engineering tactics to achieve sub-second LCP scores on Google PageSpeed Insights.',
      category: 'Performance',
      read_time: '8 min read',
      author_name: 'Alex Johnson',
      author_role: 'Web Performance Engineer',
      tags: JSON.stringify(['Core Web Vitals', 'LCP', 'CLS', 'PageSpeed', 'SEO']),
      content: JSON.stringify({
        overview: 'Google search rankings and user bounce rates depend heavily on Core Web Vitals. The largest element in the viewport—almost always a hero image or promotional banner—dictates your Largest Contentful Paint (LCP) score.',
        sections: [
          {
            heading: '1. Eliminating Render-Blocking Media',
            body: 'Never use loading="lazy" on above-the-fold hero images. Add fetchpriority="high" and preload the modern format in the HTML head to trigger immediate resource fetching before CSS/JS finishes parsing.',
            codeSnippet: '<link rel="preload" as="image" href="/hero.avif" type="image/avif" fetchpriority="high">'
          },
          {
            heading: '2. Preventing Cumulative Layout Shift (CLS)',
            body: 'Always specify explicit width and height attributes or CSS aspect-ratio on every image tag. This lets the browser reserve the exact layout box before bytes download.'
          }
        ],
        takeaways: [
          'Preload above-the-fold images with fetchpriority="high".',
          'Always provide width/height or aspect-ratio to prevent CLS.'
        ]
      }),
      faqs: JSON.stringify([]),
      is_published: 1
    },
    {
      id: 'post_003_png_lossless',
      slug: 'lossless-png-compression-techniques',
      title: 'Deep Dive: Lossless PNG Compression and Color Palette Quantization',
      seo_title: 'Lossless PNG Compression: Reduce File Size by 65% | Tech Guide',
      meta_description: 'Learn how color quantization, alpha channel stripping, and Deflate compression reduce PNG file sizes by up to 65% with zero visual quality loss.',
      excerpt: 'How color palette quantization, alpha channel stripping, and Deflate compression reduce PNG file sizes by up to 65% without visual degradation.',
      category: 'Engineering',
      read_time: '5 min read',
      author_name: 'Elena Rostova',
      author_role: 'Graphics Systems Specialist',
      tags: JSON.stringify(['PNG', 'Quantization', 'Lossless', 'Sharp', 'libpng']),
      content: JSON.stringify({
        overview: 'PNG remains the standard for screenshots, UI icons, and assets requiring sharp lines and lossless transparency. However, raw 24-bit/32-bit PNGs carry immense bloat that can be stripped with quantization algorithms.',
        sections: [
          {
            heading: '1. Converting 32-bit RGBA to 8-bit Indexed Color',
            body: 'Quantization algorithms reduce thousands of subtle color shades to a 256-color palette with Floyd-Steinberg dithering, shrinking file sizes by 60-70% while maintaining crisp edges.'
          }
        ],
        takeaways: [
          '8-bit indexed PNGs reduce size by up to 70% with imperceptible visual change.'
        ]
      }),
      faqs: JSON.stringify([]),
      is_published: 1
    },
    {
      id: 'post_004_sharp_pipeline',
      slug: 'nextjs-image-and-sharp-backend-pipeline',
      title: 'Building a High-Performance Media Pipeline with Node.js and Sharp',
      seo_title: 'High-Performance Image Pipeline with Node.js & Sharp Engine',
      meta_description: 'Learn how to build a high-throughput image transformation microservice using Node.js, Express, Sharp, and libvips with streaming memory management.',
      excerpt: 'Explore how the libvips C++ engine empowers Sharp to process tens of thousands of images concurrently with ultra-low memory overhead.',
      category: 'Engineering',
      read_time: '7 min read',
      author_name: 'Marcus Vance',
      author_role: 'Backend Infrastructure Architect',
      tags: JSON.stringify(['Node.js', 'Sharp', 'libvips', 'Backend', 'Microservices']),
      content: JSON.stringify({
        overview: 'When building image processing microservices, memory consumption and throughput are critical. Sharp is 4x to 8x faster than ImageMagick and GraphicsMagick because it uses the multithreaded libvips image processing library.',
        sections: [
          {
            heading: '1. Non-Blocking Streaming Pipelines',
            body: 'Sharp works seamlessly with Node.js Readable and Writable streams, allowing images to be transformed on the fly without loading full buffers into V8 heap memory.',
            codeSnippet: 'const sharp = require("sharp");\nconst pipeline = sharp().resize(800, 600, { fit: "inside" }).webp({ quality: 80 });\nreadableStream.pipe(pipeline).pipe(writableStream);'
          }
        ],
        takeaways: [
          'Sharp leverages libvips for 4x-8x speedups over legacy tools.'
        ]
      }),
      faqs: JSON.stringify([]),
      is_published: 1
    }
  ];

  for (const p of posts) {
    await pool.query(
      `INSERT INTO blog_posts (id, slug, title, seo_title, meta_description, excerpt, category, read_time, author_name, author_role, tags, content, faqs, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`,
      [p.id, p.slug, p.title, p.seo_title, p.meta_description, p.excerpt, p.category, p.read_time, p.author_name, p.author_role, p.tags, p.content, p.faqs, p.is_published]
    );
  }

  const [rows] = await pool.query('SELECT id, slug, title FROM blog_posts');
  console.log('✅ Seeded MySQL Blog Posts successfully. Total in DB:', rows.length);
  rows.forEach(r => console.log(` - [${r.slug}] ${r.title}`));
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
