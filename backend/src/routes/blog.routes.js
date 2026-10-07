const express = require('express');
const router = express.Router();
const blogService = require('../services/blog.service');

// Public listing
router.get('/posts', async (req, res) => {
  try {
    const { page, limit, search, category } = req.query;
    const result = await blogService.getBlogPosts({
      page,
      limit,
      search,
      category,
      publishedOnly: true,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Blog API /posts error]', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load blog posts.' });
  }
});

// Public categories with counts
router.get('/categories', async (req, res) => {
  try {
    const categories = await blogService.getBlogCategories();
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[Blog API /categories error]', error.message);
    return res.status(500).json({ success: false, message: 'Unable to load categories.' });
  }
});

// Public single post by slug
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await blogService.getPostBySlug(slug);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    return res.status(200).json({ success: true, data: post, relatedPosts: post.relatedPosts || [] });
  } catch (error) {
    console.error(`[Blog API /posts/${req.params.slug} error]`, error.message);
    return res.status(500).json({ success: false, message: 'Unable to load the requested article.' });
  }
});

module.exports = router;
