const aiService = require('../services/ai.service');
const blogService = require('../services/blog.service');

/**
 * AI Settings Controller Handlers
 */
const handleGetAISettings = async (req, res) => {
  try {
    const settings = await aiService.getAISettings();
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load admin data.' });
  }
};

const handleSaveAISettings = async (req, res) => {
  try {
    const settings = await aiService.saveAISettings(req.body);
    return res.status(200).json({
      success: true,
      message: 'System and AI configurations saved to MySQL database successfully!',
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load admin data.' });
  }
};

const handleTestAIConnection = async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;
    const result = await aiService.testAIConnection({ provider, apiKey, model });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('[AI blog generation]', error.message);
    return res.status(502).json({
      success: false,
      message: error.message || 'AI blog generation failed.',
    });
  }
};

/**
 * AI Content Generation Handlers
 */
const handleAIGeneratePost = async (req, res) => {
  try {
    const { prompt, category, tone, provider } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Article topic or prompt is required.' });
    }
    const generatedData = await aiService.generatePostWithAI({ prompt, category, tone, customProvider: provider });
    return res.status(200).json({ success: true, data: generatedData });
  } catch (error) {
    console.error('[AI image generation]', error.message);
    return res.status(502).json({
      success: false,
      message: error.message || 'AI image generation failed.',
    });
  }
};

const handleAIGenerateImage = async (req, res) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Image prompt is required.' });
    }
    const result = await aiService.generateImageWithAI({ prompt, style });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update admin data.' });
  }
};

/**
 * SuperAdmin Blog Post CRUD Handlers
 */
const handleAdminGetPosts = async (req, res) => {
  try {
    const { page, limit, search, category } = req.query;
    const result = await blogService.getBlogPosts({
      page,
      limit,
      search,
      category,
      publishedOnly: false, // SuperAdmin sees all posts including drafts
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load admin data.' });
  }
};

const handleAdminCreatePost = async (req, res) => {
  try {
    const { title, slug, seoTitle, metaDescription, excerpt, category, readTime, authorName, authorRole, featuredImage, tags, content, faqs, isPublished } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Post title is required.' });
    }

    const newPost = await blogService.createBlogPost({
      title,
      slug,
      seoTitle,
      metaDescription,
      excerpt,
      category,
      readTime,
      authorName: authorName || req.user?.name || 'SuperAdmin',
      authorRole: authorRole || 'Technical Architect',
      featuredImage,
      tags,
      content,
      faqs,
      isPublished,
    });

    return res.status(201).json({ success: true, message: 'Blog post published successfully!', data: newPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update admin data.' });
  }
};

const handleAdminUpdatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPost = await blogService.updateBlogPost(id, req.body);
    return res.status(200).json({ success: true, message: 'Blog post updated successfully!', data: updatedPost });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update admin data.' });
  }
};

const handleAdminDeletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await blogService.deleteBlogPost(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blog post not found.' });
    }
    return res.status(200).json({ success: true, message: 'Blog post deleted successfully!' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to update admin data.' });
  }
};

module.exports = {
  handleGetAISettings,
  handleSaveAISettings,
  handleTestAIConnection,
  handleAIGeneratePost,
  handleAIGenerateImage,
  handleAdminGetPosts,
  handleAdminCreatePost,
  handleAdminUpdatePost,
  handleAdminDeletePost,
};
