'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Sliders,
  ExternalLink,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

const getAuthToken = () =>
  (typeof window !== 'undefined' ? localStorage.getItem('resizer_superadmin_auth_token') || '' : '');

export default function AISettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);

  // Form states
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [activeProvider, setActiveProvider] = useState('auto');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [geminiModel, setGeminiModel] = useState('gemini-3.5-flash-lite');

  // Status feedback
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
        setOpenaiApiKey(data.data.openaiApiKey || '');
        setGeminiApiKey(data.data.geminiApiKey || '');
        setActiveProvider(data.data.activeProvider || 'auto');
        setOpenaiModel(data.data.openaiModel || 'gpt-4o-mini');
        setGeminiModel(data.data.geminiModel || 'gemini-3.5-flash-lite');
      }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage('AI API Keys and Provider configurations saved to MySQL database!');
        setTimeout(() => setSaveMessage(null), 4000);
      } else {
        // Never fail silently: a rejected save used to leave the operator
        // believing fresh API keys were live while the old broken ones ran.
        setSaveMessage(`Save failed: ${data.message || `HTTP ${res.status}`}`);
        console.error('[AI settings] save rejected:', res.status, data);
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
        <span>Loading AI credentials & provider configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-zinc-900 to-indigo-950/40 border border-blue-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-LLM Intelligence Matrix</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Engine & API Keys Configuration
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Connect OpenAI or Google Gemini, or use the server-side Venice AI configuration for 1-click blog post generation, SEO metadata optimization, and AI featured graphic synthesis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all shadow-md"
            title="Reload settings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Active Provider Selector */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Active AI Generation Routing</h3>
          </div>
          <p className="text-xs text-zinc-400">
            Choose which AI engine should handle generation requests across the platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
            {[
              { id: 'auto', title: 'Auto (Smart Route)', desc: 'Uses Gemini if configured, otherwise OpenAI or Smart Engine' },
              { id: 'gemini', title: 'Google Gemini', desc: 'Fastest generation with Gemini 1.5/2.0 multimodal models' },
              { id: 'openai', title: 'OpenAI ChatGPT', desc: 'Industry-standard reasoning with GPT-4o / GPT-4o-mini' },
              { id: 'venice', title: 'Venice AI', desc: 'Server-side Venice inference for private blog and image generation' },
              { id: 'smart', title: 'Built-in Engine', desc: 'Zero API keys required. Uses native compression AI' },
            ].map((prov) => {
              const selected = activeProvider === prov.id;
              return (
                <div
                  key={prov.id}
                  onClick={() => setActiveProvider(prov.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selected
                      ? 'bg-blue-600/15 border-blue-500 shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold ${selected ? 'text-blue-300' : 'text-zinc-200'}`}>
                      {prov.title}
                    </span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">{prov.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Google Gemini */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-sm">
                    G
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Google Gemini API</h3>
                    <p className="text-[11px] text-zinc-400">Google AI Studio API Key</p>
                  </div>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Gemini Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Gemini API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="AQ.... or AIza..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              {/* Gemini Model Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Preferred Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Free Tier — fastest / lowest cost)</option>
                  <option value="gemini-3.7-flash">Gemini 3.7 Flash (Free Tier — higher quality)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Free Tier — balanced)</option>
                </select>
              </div>

              {/* Gemini Status Alert */}
              {geminiStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    geminiStatus.success
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {geminiStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="truncate">{geminiStatus.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => testConnection('gemini')}
              disabled={testingGemini}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {testingGemini ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>Test Google Gemini Connection</span>
            </button>
          </div>

          {/* Card 2: OpenAI ChatGPT */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                    OA
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">OpenAI ChatGPT API</h3>
                    <p className="text-[11px] text-zinc-400">OpenAI Platform Secret Key</p>
                  </div>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Get API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* OpenAI Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OpenAI API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* OpenAI Model Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Preferred Model</label>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Efficient)</option>
                  <option value="gpt-4o">GPT-4o (Full Flagship Intelligence)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Comprehensive Context)</option>
                </select>
              </div>

              {/* OpenAI Status Alert */}
              {openaiStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    openaiStatus.success
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {openaiStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span className="truncate">{openaiStatus.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => testConnection('openai')}
              disabled={testingOpenAI}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
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

        {/* Submit Bar */}
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
            <span>Save All AI Configurations</span>
          </button>
        </div>

      </form>
    </div>
  );
}
