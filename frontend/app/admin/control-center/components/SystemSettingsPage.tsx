'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Sparkles,
  Bot,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Cpu,
  ShieldAlert,
  Sliders,
  ExternalLink,
  Globe,
  Mail,
  SlidersHorizontal,
  Settings,
  Lock,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

const getAuthToken = () =>
  (typeof window !== 'undefined' ? localStorage.getItem('resizer_superadmin_auth_token') || '' : '');

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);

  // AI Form States
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [activeProvider, setActiveProvider] = useState('auto');
  const [openaiModel, setOpenaiModel] = useState('gpt-4.1');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');

  // Platform & Brand Settings
  const [siteName, setSiteName] = useState('Resizer');
  const [siteTagline, setSiteTagline] = useState('Next-Gen Image Optimization Suite');
  const [supportEmail, setSupportEmail] = useState('support@resizer.com');
  const [defaultQuality, setDefaultQuality] = useState('80');
  const [defaultFormat, setDefaultFormat] = useState('webp');
  const [maxBatchSize, setMaxBatchSize] = useState('50');
  const [allowUserRegistration, setAllowUserRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Status Feedback
  const [openaiStatus, setOpenaiStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setOpenaiApiKey(s.openaiApiKey || '');
        setGeminiApiKey(s.geminiApiKey || '');
        setActiveProvider(s.activeProvider || 'auto');
        setOpenaiModel(s.openaiModel || 'gpt-4o-mini');
        setGeminiModel(s.geminiModel || 'gemini-3.5-flash-lite');

        setSiteName(s.siteName || 'Resizer');
        setSiteTagline(s.siteTagline || 'Next-Gen Image Optimization Suite');
        setSupportEmail(s.supportEmail || 'support@resizer.com');
        setDefaultQuality(s.defaultQuality || '80');
        setDefaultFormat(s.defaultFormat || 'webp');
        setMaxBatchSize(s.maxBatchSize || '50');
        setAllowUserRegistration(s.allowUserRegistration !== false);
        setMaintenanceMode(Boolean(s.maintenanceMode));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // The loading flag flips at fetch start so the panel shows its spinner
  // immediately; that synchronous update is intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveMessage(null);

      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          openaiApiKey,
          geminiApiKey,
          activeProvider,
          openaiModel,
          geminiModel,
          siteName,
          siteTagline,
          supportEmail,
          defaultQuality,
          defaultFormat,
          maxBatchSize,
          allowUserRegistration,
          maintenanceMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage('System settings & AI API credentials saved to MySQL database successfully!');
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        // Never fail silently: a rejected save used to leave the operator
        // believing fresh API keys were live while the old broken ones ran.
        setSaveMessage(`Save failed: ${data.message || `HTTP ${res.status}`}`);
        console.error('[System settings] save rejected:', res.status, data);
      }
    } catch (err) {
      alert(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: 'openai' | 'gemini') => {
    try {
      if (provider === 'openai') {
        setTestingOpenAI(true);
        setOpenaiStatus(null);
      } else {
        setTestingGemini(true);
        setGeminiStatus(null);
      }

      const res = await fetch(`${BACKEND_URL}/api/admin/settings/ai/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          provider,
          apiKey: provider === 'openai' ? openaiApiKey : geminiApiKey,
          model: provider === 'openai' ? openaiModel : geminiModel,
        }),
      });

      const data = await res.json();
      if (provider === 'openai') {
        setOpenaiStatus({ success: data.success, message: data.message });
      } else {
        setGeminiStatus({ success: data.success, message: data.message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (provider === 'openai') {
        setOpenaiStatus({ success: false, message });
      } else {
        setGeminiStatus({ success: false, message });
      }
    } finally {
      if (provider === 'openai') setTestingOpenAI(false);
      else setTestingGemini(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Loading system & AI configurations from MySQL...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-surface to-indigo-500/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-indigo-950/40 border border-blue-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <Settings className="w-3.5 h-3.5" />
            <span>Master System Settings Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Integrations &amp; Platform Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
            Configure your ChatGPT and Google Gemini API keys, default compression thresholds, site branding, and security policies. Stored securely in Docker MySQL.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md self-start md:self-auto"
          title="Reload settings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 dark:text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* ========================================================================= */}
        {/* SECTION 1: AI & LLM PROVIDER CREDENTIALS                                  */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Engine &amp; API Credentials</h3>
          </div>

          {/* Active Provider Routing */}
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active AI Generation Provider</h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Select which engine is prioritized for automated blog post generation, SEO tags, and AI graphics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              {[
                { id: 'auto', title: 'Auto (Smart Route)', desc: 'Prioritizes Gemini if key is set, else OpenAI, or Native Engine' },
                { id: 'gemini', title: 'Google Gemini', desc: 'Fast generation with Gemini 1.5/2.0 multimodal models' },
                { id: 'openai', title: 'OpenAI ChatGPT', desc: 'Flagship reasoning with GPT-4o / GPT-4o-mini' },
                { id: 'smart', title: 'Built-in Engine', desc: 'Zero API keys needed. Native compression intelligence' },
              ].map((prov) => {
                const selected = activeProvider === prov.id;
                return (
                  <div
                    key={prov.id}
                    onClick={() => setActiveProvider(prov.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold ${selected ? 'text-blue-600 dark:text-blue-300' : 'text-slate-800 dark:text-zinc-200'}`}>
                        {prov.title}
                      </span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-snug">{prov.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* API Keys 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Google Gemini Card */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center font-bold text-sm">
                      G
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Gemini API</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">Google AI Studio API Key</p>
                    </div>
                  </div>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Gemini API Key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Gemini Model</label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro — Best multimodal understanding &amp; reasoning</option>
                    <option value="gemini-3.7-flash">Gemini 3.7 Flash — Complex coding &amp; agentic workflows</option>
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash — Fast &amp; capable generation</option>
                  </select>
                </div>

                {geminiStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      geminiStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    {geminiStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                    )}
                    <span className="truncate">{geminiStatus.message}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => testConnection('gemini')}
                disabled={testingGemini}
                className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-600/15 hover:bg-purple-100 dark:hover:bg-purple-600/25 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {testingGemini ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Test Google Gemini Connection</span>
              </button>
            </div>

            {/* OpenAI ChatGPT Card */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      OA
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">OpenAI ChatGPT API</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">OpenAI Platform Secret Key</p>
                    </div>
                  </div>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>OpenAI API Key</span>
                  </label>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">OpenAI Model</label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gpt-4.1">GPT-4.1 — Available on your plan</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                    Only models accessible to your OpenAI project are listed.
                  </p>
                </div>

                {openaiStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      openaiStatus.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                    }`}
                  >
                    {openaiStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
                    )}
                    <span className="truncate">{openaiStatus.message}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => testConnection('openai')}
                disabled={testingOpenAI}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-600/15 hover:bg-emerald-100 dark:hover:bg-emerald-600/25 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {testingOpenAI ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Test OpenAI Connection</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PLATFORM & BRAND CONFIGURATIONS                                */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Platform &amp; Branding Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-sm">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Website Name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">Displayed in Navbar, Footer, and Page Titles.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-sm">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Support Contact Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">Official email for system notifications and support.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-sm">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Default Target Format</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="webp">WebP (Standard High Compression)</option>
                <option value="avif">AVIF (Next-Gen Maximum Savings)</option>
                <option value="jpeg">JPG / JPEG (Universal Legacy)</option>
                <option value="png">PNG (Lossless &amp; Alpha)</option>
              </select>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">Default conversion codec preselected in image studio.</p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: SYSTEM SECURITY & QUOTA CONTROLS                               */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-zinc-800">
            <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">System Security &amp; Quotas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Allow Registration Toggle */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Allow Public User Signups</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  When enabled, visitors can create standard user accounts via /register.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllowUserRegistration(!allowUserRegistration)}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  allowUserRegistration
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{allowUserRegistration ? 'Registration Open' : 'Registration Closed'}</span>
              </button>
            </div>

            {/* Max Batch Size */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-3 shadow-sm">
              <label className="text-xs font-bold text-slate-900 dark:text-white">Max Batch Files Limit</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxBatchSize}
                onChange={(e) => setMaxBatchSize(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">Maximum concurrent images allowed per batch conversion.</p>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-3 flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Maintenance Mode</h4>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                  Put site in maintenance mode for engine upgrades or database migration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  maintenanceMode
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{maintenanceMode ? 'Maintenance ACTIVE' : 'Normal Operation (Live)'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save All System Configurations</span>
          </button>
        </div>

      </form>
    </div>
  );
}
