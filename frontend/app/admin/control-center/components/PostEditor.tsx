'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link2,
  Save,
  Trash2,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  X,
  Search,
  Globe,
  Sliders,
  HelpCircle,
  Clock,
  BookOpen,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';
import { BUILT_IN_POST_CATEGORIES, loadCustomPostCategories, saveCustomPostCategories } from './postCategories';

interface FAQ {
  question: string;
  answer: string;
}

interface Section {
  heading: string;
  body: string;
  codeSnippet?: string;
  tip?: string;
}

interface PostData {
  id?: string;
  title: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  readTime: string;
  authorName: string;
  authorRole: string;
  featuredImage: string;
  tags: string[];
  content: {
    overview: string;
    sections: Section[];
    takeaways: string[];
    internalLinks?: { anchorText: string; href: string; reason: string }[];
  };
  faqs: FAQ[];
  isPublished: boolean;
}

interface Props {
  initialPost?: Partial<PostData> | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function PostEditor({ initialPost, onSaveSuccess, onCancel }: Props) {
  // Form State
  const [title, setTitle] = useState(initialPost?.title || '');
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [seoTitle, setSeoTitle] = useState(initialPost?.seoTitle || '');
  const [metaDescription, setMetaDescription] = useState(initialPost?.metaDescription || '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || '');
  const [category, setCategory] = useState(initialPost?.category || 'Engineering');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [readTime, setReadTime] = useState(initialPost?.readTime || '6 min read');
  const [authorName, setAuthorName] = useState(initialPost?.authorName || 'Resizer Engineering');
  const [authorRole, setAuthorRole] = useState(initialPost?.authorRole || 'Media Pipeline Architect');
  const [featuredImage, setFeaturedImage] = useState(initialPost?.featuredImage || '');
  const [tags, setTags] = useState<string[]>(initialPost?.tags || []);
  const [tagInput, setTagInput] = useState('');

  // Structured Content State
  const [overview, setOverview] = useState(initialPost?.content?.overview || '');
  const [sections, setSections] = useState<Section[]>(
    initialPost?.content?.sections || []
  );
  const [takeaways, setTakeaways] = useState<string[]>(
    initialPost?.content?.takeaways || []
  );
  const [internalLinks, setInternalLinks] = useState<{ anchorText: string; href: string; reason: string }[]>(initialPost?.content?.internalLinks || []);
  const [takeawayInput, setTakeawayInput] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>(initialPost?.faqs || []);

  // UI Modes & Modals
  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [aiPostModalOpen, setAiPostModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState('auto');

  const categories = [...BUILT_IN_POST_CATEGORIES, ...customCategories];

  useEffect(() => {
    const categoryTimer = window.setTimeout(() => {
      setCustomCategories(loadCustomPostCategories());
    }, 0);
    return () => window.clearTimeout(categoryTimer);
  }, []);

  const addCustomCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) return;
    const exists = categories.some((item) => item.toLowerCase() === trimmedCategory.toLowerCase());
    if (exists) {
      setCategory(categories.find((item) => item.toLowerCase() === trimmedCategory.toLowerCase()) || trimmedCategory);
      setNewCategory('');
      return;
    }
    const updatedCategories = [...customCategories, trimmedCategory];
    setCustomCategories(updatedCategories);
    saveCustomPostCategories(updatedCategories);
    setCategory(trimmedCategory);
    setNewCategory('');
  };

  const getAuthToken = () => {
    return typeof window !== 'undefined' ? localStorage.getItem('resizer_superadmin_auth_token') || '' : '';
  };

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialPost?.id) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
      setSeoTitle(`${val} | Resizer`);
    }
  };

  // AI Post Generator
  const handleAIGeneratePost = async () => {
    if (!aiPrompt) return;
    try {
      setAiGenerating(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/ai/generate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          category,
          provider: aiProvider,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setTitle(p.title || '');
        setSlug(
          (p.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        );
        setSeoTitle(p.seoTitle || `${p.title} | Resizer`);
        setMetaDescription(p.metaDescription || '');
        setExcerpt(p.excerpt || '');
        setCategory(p.category || category);
        setReadTime(p.readTime || '6 min read');
        setTags(Array.isArray(p.tags) ? p.tags : Array.isArray(p.content?.tags) ? p.content.tags : []);
        if (p.content) {
          setOverview(p.content.overview || '');
          setSections(p.content.sections || []);
          setTakeaways(p.content.takeaways || []);
          setInternalLinks(Array.isArray(p.internalLinks) ? p.internalLinks : Array.isArray(p.content.internalLinks) ? p.content.internalLinks : []);
          if (Array.isArray(p.content.faqs)) setFaqs(p.content.faqs);
          else if (Array.isArray(p.faqs)) setFaqs(p.faqs);
        } else if (Array.isArray(p.faqs)) {
          setFaqs(p.faqs);
        }

        // Use the auto-generated banner from the AI response (embedded by backend),
        // or fall back to a separate image-generation call if the field is missing.
        if (p.featuredImage) {
          setFeaturedImage(p.featuredImage);
        } else {
          handleAIGenerateImage(p.title);
        }

        setAiPostModalOpen(false);
      } else {
        alert(data.message || 'AI Generation failed.');
      }
    } catch (err: unknown) {
      alert(`AI error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // AI Image Generator
  const handleAIGenerateImage = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || title || 'Web Performance and Codec Optimization';
    try {
      setAiImageGenerating(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ prompt: targetPrompt }),
      });

      const data = await res.json();
      if (data.success && data.imageUri) {
        setFeaturedImage(data.imageUri);
      }
    } catch (err: unknown) {
      alert(`Image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAiImageGenerating(false);
    }
  };

  // Tag Management
  const addTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Section Management
  const addSection = () => {
    setSections([
      ...sections,
      {
        heading: `${sections.length + 1}. New Topic Analysis`,
        body: '',
      },
    ]);
  };

  const updateSection = (index: number, key: keyof Section, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [key]: value };
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  // Takeaway Management
  const addTakeaway = () => {
    if (!takeawayInput.trim()) return;
    setTakeaways([...takeaways, takeawayInput.trim()]);
    setTakeawayInput('');
  };

  const removeTakeaway = (index: number) => {
    setTakeaways(takeaways.filter((_, i) => i !== index));
  };

  // FAQ Management
  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const updateFaq = (index: number, key: keyof FAQ, val: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [key]: val };
    setFaqs(updated);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSavePost = async (publish: boolean) => {
    if (!title.trim()) {
      alert('Please enter a post title.');
      return;
    }

    try {
      setSaving(true);
      const postPayload = {
        title,
        slug,
        seoTitle: seoTitle || title,
        metaDescription: metaDescription || excerpt,
        excerpt,
        category,
        readTime,
        authorName,
        authorRole,
        featuredImage,
        tags,
        content: {
          overview,
          sections,
          takeaways,
          internalLinks,
        },
        faqs,
        isPublished: publish,
      };

      const isEdit = Boolean(initialPost?.id);
      const endpoint = isEdit
        ? `${BACKEND_URL}/api/admin/posts/${initialPost?.id}`
        : `${BACKEND_URL}/api/admin/posts`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      if (data.success) {
        onSaveSuccess();
      } else {
        alert(data.message || 'Failed to save post.');
      }
    } catch (err: unknown) {
      alert(`Save error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="post-editor-theme space-y-6 animate-in fade-in duration-200">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold"
          >
            &larr; Back to Posts List
          </button>
          <span className="text-xs font-mono text-zinc-500">•</span>
          <span className="text-xs font-bold text-white">
            {initialPost?.id ? `Edit: ${initialPost.title}` : 'Create New Technical Article'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* AI Magic Generation Button */}
          <button
            type="button"
            onClick={() => setAiPostModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Generate with AI</span>
          </button>

          {/* AI Picture Button */}
          <button
            type="button"
            onClick={() => handleAIGenerateImage()}
            disabled={aiImageGenerating}
            className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            {aiImageGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            <span>AI Graphic</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleSavePost(false)}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold"
          >
            Save Draft
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={() => handleSavePost(true)}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        {([
          { id: 'editor', label: 'Article Content & Sections', icon: BookOpen },
          { id: 'seo', label: 'SEO & Search Engine Preview', icon: Globe },
          { id: 'preview', label: 'Live Article Preview', icon: Eye },
        ] as const).map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ARTICLE CONTENT & SECTIONS EDITOR                                  */}
      {/* ========================================================================= */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Title & Slug */}
            <div className="space-y-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Article Title (H1)
                </label>
                <input
                  type="text"
                  placeholder="e.g. WebP vs AVIF: Which Next-Gen Format to Choose in 2026?"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm sm:text-base font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">URL Slug</label>
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-400">
                  <span className="text-zinc-600">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 bg-transparent text-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Lead Overview Paragraph</label>
                <textarea
                  rows={3}
                  placeholder="Engaging summary that draws developers into the core problem and benchmark..."
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Sections Builder */}
            <div className="space-y-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Structured Article Sections ({sections.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </div>

              <div className="space-y-6">
                {sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-4 relative group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                        Section #{idx + 1}
                      </span>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remove section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Heading (H2)</label>
                      <input
                        type="text"
                        value={section.heading}
                        onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Section Content & Analysis</label>
                      <textarea
                        rows={4}
                        value={section.body}
                        onChange={(e) => updateSection(idx, 'body', e.target.value)}
                        placeholder="Detailed technical insights, measurements, and architectural guidance..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Code Snippet (Optional)</label>
                      <textarea
                        rows={3}
                        value={section.codeSnippet || ''}
                        onChange={(e) => updateSection(idx, 'codeSnippet', e.target.value)}
                        placeholder="<picture> <source srcset='...' /> </picture>"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Pro Engineering Tip (Optional)</label>
                      <input
                        type="text"
                        value={section.tip || ''}
                        onChange={(e) => updateSection(idx, 'tip', e.target.value)}
                        placeholder="e.g. Always benchmark perceptual SSIM score against raw input"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-blue-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Takeaways Builder */}
            <div className="space-y-4 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Key Takeaways Checklist</span>
              </h3>

              <div className="space-y-2">
                {takeaways.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{t}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTakeaway(idx)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add an actionable takeaway..."
                    value={takeawayInput}
                    onChange={(e) => setTakeawayInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTakeaway();
                      }
                    }}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={addTakeaway}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Settings (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Meta Attributes */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Article Metadata
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                    placeholder="Add custom category"
                    className="min-w-0 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <button type="button" onClick={addCustomCategory} className="px-3 py-2 rounded-xl border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-500/10">Add</button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Estimated Read Time</label>
                <input
                  type="text"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Author Job Title</label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Featured Image Preview / AI Generator */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Featured Graphic
                </h3>
                <button
                  type="button"
                  onClick={() => handleAIGenerateImage()}
                  disabled={aiImageGenerating}
                  className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Regenerate AI Graphic</span>
                </button>
              </div>

              {featuredImage ? (
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <img src={featuredImage} alt="Featured graphic" className="w-full h-36 object-cover" />
                </div>
              ) : (
                <div className="h-32 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                  <ImageIcon className="w-6 h-6" />
                  <span>No graphic attached</span>
                </div>
              )}
            </div>

            {/* Tags Pills */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-3 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Tags & Keywords
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="bg-zinc-950 text-zinc-300 text-xs font-mono px-2.5 py-1 rounded-lg border border-zinc-800 flex items-center gap-1.5"
                  >
                    <span>#{t}</span>
                    <button type="button" onClick={() => removeTag(t)} className="text-zinc-500 hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                >
                  Add
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SEO & GOOGLE SERP PREVIEW                                          */}
      {/* ========================================================================= */}
      {activeTab === 'seo' && (
        <div className="space-y-8 max-w-4xl">
          
          {/* Live Google Search Engine Result Preview */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Google SERP Live Snippet Preview</span>
            </h3>

            {/* Google Search Card simulation */}
            <div className="p-6 rounded-2xl bg-[#202124] border border-[#3c4043] font-sans text-left space-y-1 shadow-2xl">
              <div className="flex items-center gap-2 text-xs text-[#bdc1c6]">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">R</div>
                <span>resizer.app</span>
                <span>› blog › {slug || 'article-slug'}</span>
              </div>
              <h4 className="text-lg text-[#8ab4f8] hover:underline cursor-pointer font-medium leading-snug">
                {seoTitle || title || 'Article Title - Resizer Performance Guide'}
              </h4>
              <p className="text-xs text-[#bdc1c6] leading-relaxed line-clamp-2">
                {metaDescription || excerpt || 'Detailed description of the article that appears in Google search engine result pages.'}
              </p>
            </div>
          </div>

          {/* SEO Input Fields */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-zinc-300">SEO Meta Title</label>
                <span className={`font-mono text-[11px] ${seoTitle.length > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {seoTitle.length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="High-CTR Title under 60 characters..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-zinc-300">SEO Meta Description</label>
                <span className={`font-mono text-[11px] ${metaDescription.length > 160 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metaDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Compelling description between 140 and 160 characters to maximize Google CTR..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">Social Share Excerpt</label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary for social cards..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* FAQs for Google Schema */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>Google FAQPage Schema Questions ({faqs.length})</span>
              </h3>
              <button
                type="button"
                onClick={addFaq}
                className="px-3 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="absolute top-3 right-3 text-zinc-500 hover:text-rose-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Question (e.g. Is AVIF supported in iOS?)"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, 'question', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Direct Answer..."
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE ARTICLE PREVIEW                                               */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="max-w-4xl mx-auto space-y-8 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase px-3 py-1 rounded-full font-mono">
              {category}
            </span>
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTime}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {title || 'Article Title'}
          </h1>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {authorName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-white">{authorName}</div>
              <div className="text-xs text-zinc-400">{authorRole}</div>
            </div>
          </div>

          {featuredImage && (
            <div className="rounded-2xl overflow-hidden border border-zinc-800">
              <img src={featuredImage} alt="Article visual" className="w-full h-auto max-h-80 object-cover" />
            </div>
          )}

          <div className="p-4 rounded-2xl bg-zinc-950/80 border-l-4 border-l-blue-500 text-xs sm:text-sm text-zinc-300 italic">
            {overview || 'Lead overview paragraph appears here...'}
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-zinc-300">
            {sections.map((s, idx) => (
              <div key={idx} className="space-y-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-white">{s.heading}</h2>
                <p className="leading-relaxed">{s.body}</p>
                {s.codeSnippet && (
                  <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-cyan-300 text-xs overflow-x-auto">
                    <code>{s.codeSnippet}</code>
                  </pre>
                )}
                {s.tip && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                    <span><strong>Pro Tip:</strong> {s.tip}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {takeaways.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/30 to-zinc-900 border border-blue-500/30 space-y-2.5">
              <h3 className="text-xs font-bold uppercase text-blue-400">Key Takeaways</h3>
              <ul className="space-y-1.5 text-xs text-zinc-200">
                {takeaways.map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* AI POST GENERATION MODAL                                                  */}
      {/* ========================================================================= */}
      {aiPostModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Content Generator</span>
                </div>
                <h3 className="text-xl font-bold text-white">Generate Complete Technical Article</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiPostModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Topic / Article Prompt</label>
                <textarea
                  rows={3}
                  placeholder="e.g. How to Build an Ultra-Fast Image Resizing Microservice using Sharp, libvips, and Docker"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Target Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                      placeholder="Add custom category"
                      className="min-w-0 flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    <button type="button" onClick={addCustomCategory} className="px-3 py-2 rounded-xl border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/10">Add</button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">AI Engine</label>
                  <select
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="auto">Auto (Configured Key)</option>
                    <option value="venice">Venice AI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI ChatGPT</option>
                    <option value="smart">Built-in Smart AI</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAiPostModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAIGeneratePost}
                disabled={aiGenerating || !aiPrompt}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Article & Code...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Full Article</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
