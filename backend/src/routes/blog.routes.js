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
    return res.status(500).json({ success: false, message: 'Unable to load blog posts.' });
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
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load the requested article.' });
  }
});

module.exports = router;
