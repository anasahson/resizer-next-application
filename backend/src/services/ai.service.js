const { pool } = require('../config/db');

/**
 * Get all system and AI settings from system_settings table
 */
async function getAISettings() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');

  const settingsMap = {};
  rows.forEach((r) => {
    settingsMap[r.setting_key] = r.setting_value;
  });

  return {
    // AI Credentials & Models
    openaiApiKey: settingsMap['openai_api_key'] ? maskKey(settingsMap['openai_api_key']) : '',
    hasOpenaiKey: !!settingsMap['openai_api_key'],
    geminiApiKey: settingsMap['gemini_api_key'] ? maskKey(settingsMap['gemini_api_key']) : '',
    hasGeminiKey: !!settingsMap['gemini_api_key'],
    activeProvider: settingsMap['ai_active_provider'] || 'auto',
    openaiModel: settingsMap['openai_model'] || 'gpt-4o-mini',
    geminiModel: settingsMap['gemini_model'] || 'gemini-1.5-flash',

    // Platform & Brand Settings
    siteName: settingsMap['site_name'] || 'Resizer',
    siteTagline: settingsMap['site_tagline'] || 'High-Performance Image Optimization Suite',
    supportEmail: settingsMap['support_email'] || 'support@resizer.com',
    defaultQuality: settingsMap['default_quality'] || '80',
    defaultFormat: settingsMap['default_format'] || 'webp',
    maxBatchSize: settingsMap['max_batch_size'] || '50',
    allowUserRegistration: settingsMap['allow_user_registration'] !== 'false',
    maintenanceMode: settingsMap['maintenance_mode'] === 'true',
  };
}

/**
 * Get raw (unmasked) API keys and settings for internal execution
 */
async function getRawAISettings() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
  const map = {};
  rows.forEach((r) => {
    map[r.setting_key] = r.setting_value;
  });
  return map;
}

/**
 * Mask API key for UI display
 */
function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return `${key.substring(0, 4)}••••••••${key.substring(key.length - 4)}`;
}

/**
 * Save all system & AI settings
 */
async function saveAISettings(settings) {
  const connection = await pool.getConnection();
  try {
    const stringKeys = [
      ['openai_api_key', settings.openaiApiKey, true],
      ['gemini_api_key', settings.geminiApiKey, true],
      ['ai_active_provider', settings.activeProvider],
      ['openai_model', settings.openaiModel],
      ['gemini_model', settings.geminiModel],
      ['site_name', settings.siteName],
      ['site_tagline', settings.siteTagline],
      ['support_email', settings.supportEmail],
      ['default_quality', settings.defaultQuality],
      ['default_format', settings.defaultFormat],
      ['max_batch_size', settings.maxBatchSize],
      ['allow_user_registration', settings.allowUserRegistration !== undefined ? String(settings.allowUserRegistration) : undefined],
      ['maintenance_mode', settings.maintenanceMode !== undefined ? String(settings.maintenanceMode) : undefined],
    ];

    for (const [key, val, isSecret] of stringKeys) {
      if (val !== undefined) {
        if (isSecret && typeof val === 'string' && val.includes('••••')) {
          continue; // Don't overwrite with masked string
        }
        await connection.query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, String(val), String(val)]
        );
      }
    }

    return getAISettings();
  } finally {
    connection.release();
  }
}

/**
 * Test connection to OpenAI or Gemini
 */
async function testAIConnection({ provider, apiKey, model }) {
  const rawSettings = await getRawAISettings();
  const targetProvider = provider || rawSettings['ai_active_provider'] || 'openai';
  const effectiveKey = (apiKey && !apiKey.includes('••••'))
    ? apiKey
    : targetProvider === 'gemini'
    ? rawSettings['gemini_api_key']
    : rawSettings['openai_api_key'];

  if (!effectiveKey) {
    return {
      success: false,
      message: `No API key provided for ${targetProvider.toUpperCase()}. Please enter an API key first.`,
    };
  }

  if (targetProvider === 'gemini') {
    try {
      const selectedModel = model || rawSettings['gemini_model'] || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${effectiveKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with: "Gemini connection successful!"' }] }],
        }),
      });

      const data = await response.json();
      if (response.ok && data.candidates && data.candidates[0]) {
        return {
          success: true,
          message: `Connected successfully to Google Gemini (${selectedModel})!`,
          provider: 'gemini',
        };
      } else {
        return {
          success: false,
          message: data.error?.message || 'Google Gemini API key validation failed.',
        };
      }
    } catch (err) {
      return { success: false, message: `Gemini test error: ${err.message}` };
    }
  } else {
    try {
      const selectedModel = model || rawSettings['openai_model'] || 'gpt-4o-mini';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Respond with: "OpenAI connection successful!"' }],
          max_tokens: 20,
        }),
      });

      const data = await response.json();
      if (response.ok && data.choices && data.choices[0]) {
        return {
          success: true,
          message: `Connected successfully to OpenAI (${selectedModel})!`,
          provider: 'openai',
        };
      } else {
        return {
          success: false,
          message: data.error?.message || 'OpenAI API key validation failed.',
        };
      }
    } catch (err) {
      return { success: false, message: `OpenAI test error: ${err.message}` };
    }
  }
}

/**
 * Generate full SEO Blog Post with AI (OpenAI / Gemini / Smart Fallback)
 */
async function generatePostWithAI({ prompt, category = 'Engineering', tone = 'technical', customProvider }) {
  const rawSettings = await getRawAISettings();
  const activeProvider = customProvider || rawSettings['ai_active_provider'] || 'auto';
  const openaiKey = rawSettings['openai_api_key'];
  const geminiKey = rawSettings['gemini_api_key'];

  const systemInstruction = `You are a world-class Web Media & Performance Technical Writer and SEO Specialist. 
Generate a comprehensive, engaging, highly informative, and SEO-optimized article about the user's exact topic: "${prompt}".
The article must be tailored for category: "${category}".
Do not reuse Resizer marketing slogans, generic introductions, unrelated Sharp/WebP examples, or wording from other articles. Use current, topic-specific facts only when you can state them accurately; otherwise explain the limitation instead of inventing statistics.
Generate the article content from the user's topic, not from this instruction's examples. Include a topic-specific image brief and useful internal link suggestions with natural anchor text.

Return ONLY valid JSON matching this exact structure:
{
  "title": "Engaging H1 Blog Title",
  "seoTitle": "High CTR SEO Title (under 60 chars) | Resizer",
  "metaDescription": "Compelling search engine meta description between 140 and 160 characters.",
  "excerpt": "2-3 sentence executive summary of the article.",
  "category": "${category}",
  "readTime": "6 min read",
  "tags": ["3 to 5 specific SEO keyword tags"],
  "imagePrompt": "A precise visual brief for a relevant article hero image",
  "internalLinks": [
    { "anchorText": "Natural relevant anchor text", "href": "/tools", "reason": "Why this link helps the reader" }
  ],
  "content": {
    "overview": "Engaging lead paragraph explaining the problem and context.",
    "sections": [
      {
        "heading": "1. Section Heading",
        "body": "Detailed technical explanation with actionable insights.",
        "codeSnippet": "Optional practical code, HTML, CSS, CLI, or config example. Include it only when it directly supports the article topic.",
        "tip": "Optional pro engineering tip"
      },
      {
        "heading": "2. Benchmark & Architecture",
        "body": "Comparative analysis and performance numbers.",
        "tip": "Another practical implementation tip"
      },
      {
        "heading": "3. Implementation & Best Practices",
        "body": "Step by step integration guidance."
      }
    ],
    "takeaways": [
      "Key actionable takeaway 1",
      "Key actionable takeaway 2",
      "Key actionable takeaway 3"
    ],
    "faqs": [
      {
        "question": "Frequently asked question 1?",
        "answer": "Clear, concise direct answer."
      },
      {
        "question": "Frequently asked question 2?",
        "answer": "Clear, concise direct answer."
      }
    ]
  }
}`;

  const normalizeGeneratedPost = (post) => {
    const content = post.content && typeof post.content === 'object' ? post.content : {};
    const tags = Array.isArray(post.tags) ? post.tags : Array.isArray(content.tags) ? content.tags : [];
    const faqs = Array.isArray(content.faqs) ? content.faqs : Array.isArray(post.faqs) ? post.faqs : [];

    return {
      ...post,
      tags: tags.filter((tag) => typeof tag === 'string' && tag.trim()),
      content: {
        ...content,
        sections: Array.isArray(content.sections) ? content.sections : [],
        takeaways: Array.isArray(content.takeaways) ? content.takeaways : [],
        faqs: faqs.filter((faq) => faq && typeof faq.question === 'string' && typeof faq.answer === 'string'),
      },
    };
  };

  // 1. Try Google Gemini if configured
  if ((activeProvider === 'gemini' || (activeProvider === 'auto' && geminiKey)) && geminiKey) {
    try {
      const selectedModel = rawSettings['gemini_model'] || 'gemini-3.7-flash';
      // Gemini 3.x models use v1beta endpoint
      const apiVersion = selectedModel.startsWith('gemini-3') ? 'v1beta' : 'v1beta';
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${selectedModel}:generateContent?key=${geminiKey}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemInstruction}\n\nUser Request: "${prompt}"\n\nReturn ONLY valid JSON matching the structure above. No markdown, no code fences.`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 6144,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('[Gemini] API error:', data.error?.message || JSON.stringify(data));
        throw new Error(data.error?.message || 'Gemini API error');
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleaned = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = normalizeGeneratedPost(JSON.parse(cleaned));
        parsed.generatedBy = `Google Gemini (${selectedModel})`;
        // Auto-generate a matching topic-aware banner
        const imgResult = generateImageWithAI({
          prompt: parsed.imagePrompt || parsed.title || prompt,
          tags: parsed.tags || [],
          category: parsed.category || category,
        });
        parsed.featuredImage = imgResult.imageUri;
        return parsed;
      } else {
        console.warn('[Gemini] Empty response, trying fallback');
      }
    } catch (err) {
      console.warn('[Gemini] Generation failed, using built-in fallback:', err.message);
    }
  }

  // 2. Try OpenAI if configured
  if ((activeProvider === 'openai' || (activeProvider === 'auto' && openaiKey)) && openaiKey) {
    try {
      const selectedModel = rawSettings['openai_model'] || 'gpt-4.1';
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are a world-class Technical Writer and SEO Specialist. Always respond with valid JSON only — no markdown, no code fences, just the raw JSON object.',
            },
            {
              role: 'user',
              content: `${systemInstruction}\n\nGenerate blog post for topic: "${prompt}"\n\nRemember: Return ONLY valid JSON, no markdown formatting.`,
            },
          ],
          max_tokens: 5000,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('[OpenAI] API error:', data.error?.message || JSON.stringify(data));
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      if (data.choices?.[0]?.message?.content) {
        const raw = data.choices[0].message.content.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = normalizeGeneratedPost(JSON.parse(raw));
        parsed.generatedBy = `OpenAI ChatGPT (${selectedModel})`;
        // Auto-attach a topic-aware SVG banner
        const imgResult = generateImageWithAI({
          prompt: parsed.imagePrompt || parsed.title || prompt,
          tags: parsed.tags || [],
          category: parsed.category || category,
        });
        parsed.featuredImage = imgResult.imageUri;
        return parsed;
      }
    } catch (err) {
      console.warn('[OpenAI] Generation failed, using built-in fallback:', err.message);
    }
  }

  throw new Error('No external AI provider is configured. Add an OpenAI or Gemini API key in SuperAdmin AI Settings to generate topic-specific articles.');
}

/**
 * Generate a rich, topic-aware SVG banner dynamically tailored to the blog post
 */
function generateImageWithAI({ prompt, style = 'modern', tags = [], category = 'Engineering' }) {
  const cleanTitle = (prompt || 'Next-Gen Image Processing').trim();

  // Category-driven color palettes
  const palettes = {
    Formats:        { primary: '#3b82f6', secondary: '#06b6d4', accent: '#a855f7', label: 'Format & Codec' },
    Performance:    { primary: '#10b981', secondary: '#34d399', accent: '#06b6d4', label: 'Performance' },
    Engineering:    { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899', label: 'Engineering' },
    'Best Practices': { primary: '#f59e0b', secondary: '#f97316', accent: '#ef4444', label: 'Best Practices' },
  };
  const palette = palettes[category] || palettes.Engineering;

  // Extract up to 3 keywords from title for tech badge chips
  const stopWords = new Set(['the','a','an','and','or','in','on','of','for','to','with','how','why','what','is','are','vs','versus','using','your','by','from','into']);
  const keywords = cleanTitle
    .replace(/[^a-zA-Z0-9 .]/g, '')
    .split(' ')
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
    .slice(0, 3)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1));

  // Wrap long titles across up to 2 lines
  const words = cleanTitle.split(' ');
  let line1 = '', line2 = '';
  let current = '';
  for (const w of words) {
    if ((current + w).length <= 38) {
      current += (current ? ' ' : '') + w;
    } else {
      if (!line1) { line1 = current; current = w; }
      else { line2 += (line2 ? ' ' : '') + w; }
    }
  }
  if (!line1) { line1 = current; } else { line2 += (line2 ? ' ' : '') + current; }
  if (line2.length > 42) line2 = line2.substring(0, 39) + '…';

  const gid = `g${Math.random().toString(36).substring(2, 8)}`;
  const badgeSpacing = 210;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="${gid}bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="45%" stop-color="#0f0f1a"/>
      <stop offset="100%" stop-color="#0d0d1f"/>
    </linearGradient>
    <linearGradient id="${gid}title" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.primary}"/>
      <stop offset="60%" stop-color="${palette.secondary}"/>
      <stop offset="100%" stop-color="${palette.accent}"/>
    </linearGradient>
    <linearGradient id="${gid}bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${palette.primary}"/>
      <stop offset="100%" stop-color="${palette.accent}"/>
    </linearGradient>
    <filter id="${gid}glow">
      <feGaussianBlur stdDeviation="70" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="${gid}softglow">
      <feGaussianBlur stdDeviation="4" result="blur2"/>
      <feComposite in="SourceGraphic" in2="blur2" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#${gid}bg)"/>

  <!-- Ambient glow blobs -->
  <circle cx="180" cy="160" r="250" fill="${palette.primary}" opacity="0.10" filter="url(#${gid}glow)"/>
  <circle cx="1050" cy="500" r="280" fill="${palette.accent}" opacity="0.12" filter="url(#${gid}glow)"/>
  <circle cx="650" cy="320" r="200" fill="${palette.secondary}" opacity="0.07" filter="url(#${gid}glow)"/>

  <!-- Decorative grid lines -->
  <line x1="0" y1="0" x2="1200" y2="630" stroke="${palette.primary}" stroke-width="0.4" opacity="0.07"/>
  <line x1="1200" y1="0" x2="0" y2="630" stroke="${palette.accent}" stroke-width="0.4" opacity="0.07"/>

  <!-- Content area -->
  <g transform="translate(90, 120)">

    <!-- Category chip -->
    <rect x="0" y="0" width="${palette.label.length * 9 + 32}" height="34" rx="17" fill="${palette.primary}" opacity="0.18" stroke="${palette.primary}" stroke-width="1.2"/>
    <text x="${(palette.label.length * 9 + 32) / 2}" y="22" fill="${palette.primary}" font-family="system-ui,-apple-system,sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1.8">${palette.label.toUpperCase()}</text>

    <!-- Main title line 1 -->
    <text x="0" y="110" fill="url(#${gid}title)" font-family="system-ui,-apple-system,sans-serif" font-size="${line1.length > 28 ? 48 : 54}" font-weight="900" filter="url(#${gid}softglow)">${line1}</text>
    ${line2 ? `<text x="0" y="${line2.length > 30 ? 168 : 172}" fill="#e2e8f0" font-family="system-ui,-apple-system,sans-serif" font-size="${line2.length > 32 ? 40 : 44}" font-weight="800" opacity="0.92">${line2}</text>` : ''}

    <!-- Gradient accent bar -->
    <rect x="0" y="${line2 ? 205 : 150}" width="520" height="4" rx="2" fill="url(#${gid}bar)" opacity="0.85"/>

    <!-- Subtitle descriptor -->
    <text x="0" y="${line2 ? 250 : 198}" fill="#94a3b8" font-family="system-ui,-apple-system,sans-serif" font-size="19" font-weight="500" letter-spacing="0.3">Technical Deep-Dive — Resizer Engineering Blog</text>

    <!-- Keyword badge chips -->
    ${keywords.map((kw, i) => `
    <rect x="${i * badgeSpacing}" y="${line2 ? 285 : 230}" width="${kw.length * 10 + 28}" height="38" rx="10" fill="#18181b" stroke="${i === 0 ? palette.primary : i === 1 ? palette.secondary : palette.accent}" stroke-width="1.5"/>
    <text x="${i * badgeSpacing + (kw.length * 10 + 28) / 2}" y="${line2 ? 309 : 254}" fill="${i === 0 ? palette.primary : i === 1 ? palette.secondary : palette.accent}" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="700" text-anchor="middle">${kw}</text>
    `).join('')}
  </g>

  <!-- Bottom brand strip -->
  <rect x="0" y="570" width="1200" height="60" fill="#09090b" opacity="0.95"/>
  <rect x="0" y="570" width="1200" height="2" fill="url(#${gid}bar)" opacity="0.6"/>
  <text x="90" y="603" fill="#475569" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="600">resizer.app</text>
  <text x="1110" y="603" fill="#475569" font-family="system-ui,-apple-system,sans-serif" font-size="14" font-weight="600" text-anchor="end">AI-Generated Banner</text>

  <!-- Corner logo mark -->
  <rect x="1120" y="20" width="60" height="60" rx="14" fill="${palette.primary}" opacity="0.18" stroke="${palette.primary}" stroke-width="1.2"/>
  <text x="1150" y="59" fill="${palette.primary}" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="900" text-anchor="middle">R</text>
</svg>`;

  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  return {
    success: true,
    prompt: cleanTitle,
    imageUri: dataUri,
    format: 'svg+xml',
    aspectRatio: '16:9',
  };
}

module.exports = {
  getAISettings,
  saveAISettings,
  testAIConnection,
  generatePostWithAI,
  generateImageWithAI,
};


