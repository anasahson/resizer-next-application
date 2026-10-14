'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Flag,
  Globe,
  Layers,
  RefreshCw,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

type SubTab = 'overview' | 'pages' | 'sections' | 'inputs' | 'events' | 'errors' | 'ai' | 'flags';

/* ── Response shapes returned by /api/admin/posthog/* ───────────────────────
 * The API proxies PostHog and normalises most of it, but fields can be absent
 * for empty projects, so everything is optional unless arithmetic needs it. */

interface TopEvent { event?: string; count: number }
interface AiTypeCount { type?: string; count?: number }
interface AiOperationCount { operation?: string; count?: number }

interface AiProviderBreakdown {
  provider?: string;
  operations?: AiOperationCount[];
  generations?: number;
  success?: number;
  failed?: number;
}

interface AiRecentFailure { provider?: string; count?: number; error?: string }

interface AiSummary {
  total?: number;
  successRate?: number;
  failed?: number;
  avgLatencySeconds?: number | null;
  byProvider?: AiProviderBreakdown[];
  recentErrors?: AiRecentFailure[];
}

interface OverviewTraffic { pageviews?: number; total?: number; topEvents?: TopEvent[] }
interface OverviewAi { total?: number; successRate?: number; success?: number; failed?: number; byType?: AiTypeCount[] }
interface OverviewErrors { occurrences?: number; distinctTypes?: number }

interface OverviewData {
  projectId?: number | string;
  host?: string;
  visitors?: number | string;
  traffic?: OverviewTraffic;
  ai?: OverviewAi;
  errors?: OverviewErrors;
}

interface PageRow { url?: string; views: number; visitors: number; lastSeen?: string | null }
interface SectionRow { section?: string; path?: string; views?: number; visitors?: number }
interface InputRow { input?: string; control?: string; uses?: number; users?: number; lastUsed?: string | null }
interface LiveEventRow { event?: string; timestamp?: string; distinctId?: string; url?: string }

interface GroupedErrorRow { type?: string; message?: string; count?: number; lastSeen?: string | null }
interface RecentExceptionRow { type?: string; timestamp?: string; message?: string; source?: string; distinctId?: string }

interface ErrorsData {
  totalOccurrences?: number;
  grouped?: GroupedErrorRow[];
  recent?: RecentExceptionRow[];
}

interface FeatureFlagRow {
  id: number;
  key?: string;
  name?: string;
  active?: boolean;
  archived?: boolean;
  rollout?: number | null;
  createdAt?: string;
}

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'pages', label: 'Pages & Visitors', icon: Globe },
  { id: 'sections', label: 'Sections', icon: Layers },
  { id: 'inputs', label: 'Inputs', icon: Sliders },
  { id: 'events', label: 'Live Events', icon: Activity },
  { id: 'errors', label: 'Errors', icon: AlertTriangle },
  { id: 'ai', label: 'AI Usage', icon: Sparkles },
  { id: 'flags', label: 'Feature Flags', icon: Flag },
];

const fmtNum = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v).toLocaleString() : '0');

const fmtTime = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

const fmtTimeShort = (v?: string | null) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

export default function PostHogPanel() {
  const [sub, setSub] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [hint, setHint] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [host, setHost] = useState<string>('https://us.posthog.com');

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [pages, setPages] = useState<PageRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [inputs, setInputs] = useState<InputRow[]>([]);
  const [events, setEvents] = useState<LiveEventRow[]>([]);
  const [errorsData, setErrorsData] = useState<ErrorsData | null>(null);
  const [ai, setAi] = useState<AiSummary | null>(null);
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [toggling, setToggling] = useState<number | null>(null);

  const getAuthToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('resizer_superadmin_auth_token') || '' : '';

  const api = useCallback(async (path: string) => {
    const res = await fetch(`${BACKEND_URL}/api/admin/posthog${path}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }, []);

  const load = useCallback(
    async (tab: SubTab) => {
      setLoading(true);
      setError(null);
      try {
        if (tab === 'overview') {
          const data = await api('/overview');
          if (data.configured === false) {
            setConfigured(false);
            setHint(data.hint || '');
            return;
          }
          setConfigured(true);
          setOverview(data);
          if (data.projectId) setProjectId(String(data.projectId));
          if (data.host) setHost(data.host);
        } else if (tab === 'pages') {
          const data = await api('/pages?limit=60');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setPages(data.pages || []);
        } else if (tab === 'sections') {
          const data = await api('/sections?limit=100');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setSections(data.sections || []);
        } else if (tab === 'inputs') {
          const data = await api('/inputs?limit=100');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setInputs(data.inputs || []);
        } else if (tab === 'events') {
          const data = await api('/events?limit=40');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setEvents(data.events || []);
        } else if (tab === 'errors') {
          const data = await api('/errors');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setErrorsData(data);
        } else if (tab === 'ai') {
          const data = await api('/ai');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setAi(data);
        } else if (tab === 'flags') {
          const data = await api('/flags');
          if (data.configured === false) { setConfigured(false); setHint(data.hint || ''); return; }
          setConfigured(true);
          setFlags(data.flags || []);
        }
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to load PostHog data');
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  // The loading flag flips at the start of each fetch so tab switches show a
  // spinner instead of stale rows; that synchronous update is intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(sub);
  }, [sub, load]);

  const toggleFlag = async (flag: FeatureFlagRow) => {
    setToggling(flag.id);
    setError(null);
    try {
      const data = await (async () => {
        const res = await fetch(`${BACKEND_URL}/api/admin/posthog/flags/${flag.id}/${flag.active ? 'disable' : 'enable'}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAuthToken()}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
        return body;
      })();
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? { ...f, active: data.active } : f)));
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to update flag');
    } finally {
      setToggling(null);
    }
  };

  const dashboardUrl = projectId ? `${host.replace(/\/+$/, '')}/project/${projectId}` : host;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-rose-500/20 rounded-2xl p-5 shadow-sm dark:shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">PostHog Analytics</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Live data read back from PostHog{projectId ? ` · project ${projectId}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(sub)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              Open in PostHog
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {SUB_TABS.map((t) => {
            const Icon = t.icon;
            const active = sub === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSub(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-rose-50 dark:bg-rose-600/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Setup banner when the personal API key is missing */}
      {configured === false && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            Setup required — PostHog personal API key not configured
          </div>
          <p className="text-xs text-amber-800/90 dark:text-amber-200/80 leading-relaxed">
            Reading data back from PostHog needs a <b>personal API key</b> (the public <code>phc_</code> project
            key can only send events in, never read them). One-time setup:
          </p>
          <ol className="text-xs text-amber-900 dark:text-amber-100/90 space-y-1.5 list-decimal list-inside">
            <li>
              In PostHog: <b>Settings → Personal API keys → Create key</b> with scopes{' '}
              <code>query:read</code>, <code>feature_flag:read</code>, <code>feature_flag:write</code>.
            </li>
            <li>
              Paste it into <code>backend/.env</code> as <code>POSTHOG_PERSONAL_API_KEY=phx_...</code>
            </li>
            <li>Restart the backend, then hit Refresh.</li>
          </ol>
          {hint && <p className="text-[11px] text-amber-700 dark:text-amber-300/80 font-mono break-all">{hint}</p>}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 rounded-2xl p-4 text-xs text-rose-700 dark:text-rose-300 font-semibold break-words">
          {error}
        </div>
      )}
      {loading && configured !== false && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 py-6 justify-center">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading PostHog data…
        </div>
      )}


      {/* ======================= OVERVIEW ======================= */}
      {!loading && sub === 'overview' && overview && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Pageviews (7d)', value: overview.traffic?.pageviews, icon: Activity, tone: 'text-indigo-500' },
              { label: 'Visitors (7d)', value: overview.visitors, icon: Users, tone: 'text-cyan-500' },
              { label: 'Events (7d)', value: overview.traffic?.total, icon: BarChart3, tone: 'text-purple-500' },
              { label: 'AI Generations (30d)', value: overview.ai?.total, icon: Sparkles, tone: 'text-emerald-500' },
              { label: 'Errors (30d)', value: overview.errors?.occurrences, icon: AlertTriangle, tone: 'text-rose-500' },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                    <Icon className={`w-4 h-4 shrink-0 ${kpi.tone}`} />
                    {kpi.label}
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {fmtNum(kpi.value)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Top events (7 days)</h3>
              <div className="space-y-2">
                {(overview.traffic?.topEvents || []).slice(0, 10).map((e) => {
                  const max = overview.traffic?.topEvents?.[0]?.count || 1;
                  return (
                    <div key={e.event} className="flex items-center gap-3 text-xs">
                      <span className="w-36 truncate font-mono text-slate-700 dark:text-zinc-300">{e.event}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-rose-500"
                          style={{ width: `${Math.max(4, Math.round((e.count / max) * 100))}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-slate-900 dark:text-white">{fmtNum(e.count)}</span>
                    </div>
                  );
                })}
                {(overview.traffic?.topEvents || []).length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-zinc-500">No events yet — browse the site to see data flow.</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">AI & Errors summary (30 days)</h3>
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-slate-500 dark:text-zinc-400">AI generation success rate</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                  {overview.ai?.successRate ?? 0}% ({fmtNum(overview.ai?.success)} ok / {fmtNum(overview.ai?.failed)} failed)
                </span>
              </div>
              <div className="space-y-1.5">
                {(overview.ai?.byType || []).slice(0, 5).map((t) => (
                  <div key={t.type} className="flex justify-between text-xs gap-3">
                    <span className="text-slate-600 dark:text-zinc-300 truncate">{t.type}</span>
                    <span className="font-mono text-slate-900 dark:text-white">{fmtNum(t.count)}</span>
                  </div>
                ))}
                {(overview.ai?.byType || []).length === 0 && (
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">No exceptions recorded yet.</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Error occurrences / types</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {fmtNum(overview.errors?.occurrences)} / {fmtNum(overview.errors?.distinctTypes)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ======================= LIVE EVENTS ======================= */}
      {!loading && sub === 'events' && (
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Most recent events</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Event</th>
                <th className="py-2 pr-3 font-semibold">Time</th>
                <th className="py-2 pr-3 font-semibold">Visitor</th>
                <th className="py-2 font-semibold">URL</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-zinc-800/50">
                  <td className="py-2 pr-3">
                    <span
                      className={`font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${
                        e.event === '$exception'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : e.event === '$ai_generation'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {e.event}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{fmtTime(e.timestamp)}</td>
                  <td className="py-2 pr-3 font-mono text-slate-600 dark:text-zinc-300 max-w-[140px] truncate">{e.distinctId}</td>
                  <td className="py-2 text-slate-500 dark:text-zinc-400 max-w-[320px] truncate">{e.url || '—'}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    No events yet — browse the site (or run an AI generation) to see data flow.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= ERRORS ======================= */}
      {!loading && sub === 'errors' && errorsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
              Grouped errors (30 days) — {fmtNum(errorsData.totalOccurrences)} occurrences
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Message</th>
                  <th className="py-2 pr-3 font-semibold text-right">Count</th>
                  <th className="py-2 font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {(errorsData.grouped || []).map((g, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-zinc-800/50">
                    <td className="py-2 pr-3 font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">{g.type}</td>
                    <td className="py-2 pr-3 text-slate-700 dark:text-zinc-300 max-w-[260px] truncate" title={g.message}>{g.message}</td>
                    <td className="py-2 pr-3 font-mono text-right text-slate-900 dark:text-white">{fmtNum(g.count)}</td>
                    <td className="py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{fmtTimeShort(g.lastSeen)}</td>
                  </tr>
                ))}
                {(errorsData.grouped || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                      No errors recorded — all clear.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Latest exceptions</h3>
            {(errorsData.recent || []).map((r, i) => (
              <div key={i} className="border-b border-slate-50 dark:border-zinc-800/50 pb-2 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-rose-600 dark:text-rose-400 truncate">{r.type}</span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 whitespace-nowrap">{fmtTime(r.timestamp)}</span>
                </div>
                <p className="text-slate-700 dark:text-zinc-300 break-words">{r.message}</p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{r.source} · {r.distinctId}</p>
              </div>
            ))}
            {(errorsData.recent || []).length === 0 && (
              <p className="text-xs text-slate-400 dark:text-zinc-500">No exceptions captured yet.</p>
            )}
          </div>
        </div>
      )}


      {/* ======================= AI USAGE ======================= */}
      {!loading && sub === 'ai' && ai && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Generations (30d)', display: fmtNum(ai.total), tone: 'text-emerald-500' },
              { label: 'Success rate', display: `${ai.successRate ?? 0}%`, tone: 'text-indigo-500' },
              { label: 'Failures', display: fmtNum(ai.failed), tone: 'text-rose-500' },
              { label: 'Avg latency', display: ai.avgLatencySeconds != null ? `${ai.avgLatencySeconds}s` : 'n/a', tone: 'text-amber-500' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">{kpi.label}</div>
                <div className={`mt-2 text-xl font-bold font-mono ${kpi.tone}`}>{kpi.display}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">By provider</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                    <th className="py-2 pr-3 font-semibold">Provider</th>
                    <th className="py-2 pr-3 font-semibold">Operations</th>
                    <th className="py-2 pr-3 font-semibold text-right">Total</th>
                    <th className="py-2 pr-3 font-semibold text-right">OK</th>
                    <th className="py-2 font-semibold text-right">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {(ai.byProvider || []).map((p) => (
                    <tr key={p.provider} className="border-b border-slate-50 dark:border-zinc-800/50">
                      <td className="py-2 pr-3 font-mono text-slate-900 dark:text-white whitespace-nowrap">{p.provider}</td>
                      <td className="py-2 pr-3 text-slate-500 dark:text-zinc-400">
                        {(p.operations || []).map((o) => `${o.operation} (${o.count})`).join(', ')}
                      </td>
                      <td className="py-2 pr-3 font-mono text-right text-slate-900 dark:text-white">{fmtNum(p.generations)}</td>
                      <td className="py-2 pr-3 font-mono text-right text-emerald-600 dark:text-emerald-400">{fmtNum(p.success)}</td>
                      <td className="py-2 font-mono text-right text-rose-600 dark:text-rose-400">{fmtNum(p.failed)}</td>
                    </tr>
                  ))}
                  {(ai.byProvider || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-zinc-500">
                        No AI generations tracked yet — run one from the Blog CMS &amp; AI Studio tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Recent AI failures</h3>
              {(ai.recentErrors || []).map((f, i) => (
                <div key={i} className="border-b border-slate-50 dark:border-zinc-800/50 pb-2 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{f.provider}</span>
                    <span className="font-mono text-slate-900 dark:text-white">{fmtNum(f.count)}×</span>
                  </div>
                  <p className="text-slate-700 dark:text-zinc-300 break-words">{f.error}</p>
                </div>
              ))}
              {(ai.recentErrors || []).length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> No AI failures in the last 30 days.
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ======================= FEATURE FLAGS ======================= */}
      {!loading && sub === 'flags' && (
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Feature flags</h3>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">{flags.length} flags</span>
          </div>
          {flags.map((f) => (
            <div
              key={f.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-50 dark:border-zinc-800/50 pb-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Flag className={`w-3.5 h-3.5 shrink-0 ${f.active ? 'text-emerald-500' : 'text-slate-400 dark:text-zinc-500'}`} />
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">{f.key}</span>
                  {f.active ? (
                    <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">active</span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase bg-slate-500/10 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded">off</span>
                  )}
                  {f.archived && (
                    <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">archived</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                  {f.name}
                  {f.rollout != null && ` · rollout ${f.rollout}%`}
                  {f.createdAt && ` · created ${fmtTimeShort(f.createdAt)}`}
                </div>
              </div>
              <button
                onClick={() => toggleFlag(f)}
                disabled={toggling === f.id}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 ${
                  f.active
                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25'
                    : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/25'
                }`}
              >
                {toggling === f.id ? 'Saving…' : f.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
          {flags.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-zinc-500 py-4 text-center">
              No feature flags in this project yet. Create one in PostHog → Feature flags.
            </p>
          )}
        </div>
      )}
    {/* ======================= PAGES & VISITORS ======================= */}
      {!loading && sub === 'pages' && (
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3">
            Pageviews &amp; unique visitors per URL (30 days)
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Page</th>
                <th className="py-2 pr-3 font-semibold text-right">Views</th>
                <th className="py-2 pr-3 font-semibold text-right">Visitors</th>
                <th className="py-2 pr-3 font-semibold text-right">Views / visitor</th>
                <th className="py-2 font-semibold">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-zinc-800/50">
                  <td className="py-2 pr-3 font-mono text-indigo-600 dark:text-indigo-400 max-w-[380px] truncate" title={p.url}>
                    {p.url}
                  </td>
                  <td className="py-2 pr-3 font-mono text-right text-slate-900 dark:text-white">{fmtNum(p.views)}</td>
                  <td className="py-2 pr-3 font-mono text-right text-emerald-600 dark:text-emerald-400">{fmtNum(p.visitors)}</td>
                  <td className="py-2 pr-3 font-mono text-right text-slate-600 dark:text-zinc-300">
                    {p.visitors ? (p.views / p.visitors).toFixed(1) : '—'}
                  </td>
                  <td className="py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{fmtTimeShort(p.lastSeen)}</td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    No pageviews yet — browse the site to populate this table.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= SECTIONS ======================= */}
      {!loading && sub === 'sections' && (
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Sections visitors actually reached (30 days)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
            Captured automatically when a section scrolls into view. Add{' '}
            <code className="font-mono">data-track-section=&quot;name&quot;</code> to any element to name it
            explicitly; otherwise the id or first heading is used.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Section</th>
                <th className="py-2 pr-3 font-semibold">Page</th>
                <th className="py-2 pr-3 font-semibold text-right">Views</th>
                <th className="py-2 font-semibold text-right">Visitors</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-zinc-800/50">
                  <td className="py-2 pr-3 font-mono text-slate-900 dark:text-white max-w-[280px] truncate" title={s.section}>
                    {s.section}
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-500 dark:text-zinc-400 max-w-[280px] truncate" title={s.path}>
                    {s.path}
                  </td>
                  <td className="py-2 pr-3 font-mono text-right text-slate-900 dark:text-white">{fmtNum(s.views)}</td>
                  <td className="py-2 font-mono text-right text-emerald-600 dark:text-emerald-400">{fmtNum(s.visitors)}</td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    No section views yet — scroll through a page to generate them.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= INPUTS ======================= */}
      {!loading && sub === 'inputs' && (
        <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
            Form inputs visitors used (30 days)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
            Names, control types and usage counts only — passwords, emails, phone fields, file inputs and free
            text are never captured, and text values are never sent.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
                <th className="py-2 pr-3 font-semibold">Input</th>
                <th className="py-2 pr-3 font-semibold">Control</th>
                <th className="py-2 pr-3 font-semibold text-right">Uses</th>
                <th className="py-2 pr-3 font-semibold text-right">Users</th>
                <th className="py-2 font-semibold">Last used</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((inp, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-zinc-800/50">
                  <td className="py-2 pr-3 font-mono text-slate-900 dark:text-white max-w-[260px] truncate" title={inp.input}>
                    {inp.input}
                  </td>
                  <td className="py-2 pr-3 font-mono text-slate-500 dark:text-zinc-400 whitespace-nowrap">{inp.control}</td>
                  <td className="py-2 pr-3 font-mono text-right text-slate-900 dark:text-white">{fmtNum(inp.uses)}</td>
                  <td className="py-2 pr-3 font-mono text-right text-emerald-600 dark:text-emerald-400">{fmtNum(inp.users)}</td>
                  <td className="py-2 text-slate-500 dark:text-zinc-400 whitespace-nowrap">{fmtTimeShort(inp.lastUsed)}</td>
                </tr>
              ))}
              {inputs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 dark:text-zinc-500">
                    No input usage yet — change a filter, toggle a checkbox or adjust a slider.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
