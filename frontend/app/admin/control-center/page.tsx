'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import PostsManager from './components/PostsManager';
import SystemSettingsPage from './components/SystemSettingsPage';
import PostHogPanel from './components/PostHogPanel';
import SupportInbox from './components/SupportInbox';
import Auth0Panel from './components/Auth0Panel';
import {
  ShieldCheck,
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Users,
  FileCheck,
  Sparkles,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Layers,
  Download,
  Image as ImageIcon,
  Zap,
  Lock,
  ChevronRight,
  LogOut,
  Sliders,
  Shield,
  Mail,
  KeyRound,
  BookOpen,
  Globe,
  ExternalLink,
  Wand2,
  BarChart3,
} from 'lucide-react';

interface SystemStats {
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  cpuCores: number;
  cpuModel: string;
  memory: {
    totalFormatted: string;
    usedFormatted: string;
    freeFormatted: string;
    usagePercent: number;
    processRssFormatted: string;
    processHeapUsedFormatted: string;
  };
}

interface DatabaseStats {
  status: string;
  host: string;
  port: number;
  name: string;
  version: string;
  latencyMs: number;
}

interface AnalyticsStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalOriginalBytes: number;
  totalOutputBytes: number;
  totalBytesSaved: number;
  avgSavingsPercent: number;
  avgProcessingTimeMs: number;
  totalOriginalFormatted: string;
  totalOutputFormatted: string;
  totalBytesSavedFormatted: string;
  formatBreakdown: { target_format: string; count: number; total_size: number }[];
}

interface JobRecord {
  id: number;
  filename: string;
  original_name: string;
  target_format: string;
  original_size: number;
  output_size: number;
  savings_percent: number;
  width: number | null;
  height: number | null;
  processing_time_ms: number;
  status: 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  originalSizeFormatted: string;
  outputSizeFormatted: string;
  bytesSavedFormatted: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'superadmin';
  image: string | null;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

const subscribeToMount = (_onStoreChange: () => void) => () => {};
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;

export default function SuperAdminControlCenterPage() {
  const router = useRouter();
  const { user, token, isSuperAdmin, isLoading, logout } = useAuth();
  const hasMounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );

  // Active Admin Sidebar Tab
  const [activeTab, setActiveTab] = useState<'telemetry' | 'posts' | 'settings' | 'users' | 'logs' | 'support' | 'studio' | 'posthog' | 'auth0'>('telemetry');

  // Stats State
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [database, setDatabase] = useState<DatabaseStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Global Logs State
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('');
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  // Users RBAC Management State
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'superadmin'>('all');

  // Support Inbox State
  const [supportMessagesCount, setSupportMessagesCount] = useState<number>(0);

  // Admin Sandbox Studio State
  const [sandboxFile, setSandboxFile] = useState<File | null>(null);
  const [sandboxPreviewUrl, setSandboxPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<string>('webp');
  const [quality, setQuality] = useState<number>(80);
  const [resizeWidth, setResizeWidth] = useState<string>('');
  const [resizeHeight, setResizeHeight] = useState<string>('');
  const [fitMode, setFitMode] = useState<string>('fit');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<{
    success: boolean;
    dataBase64?: string;
    filename?: string;
    originalSizeBytes?: number;
    outputSizeBytes?: number;
    savingsPercent?: number;
    processingTimeMs?: number;
    width?: number;
    height?: number;
    format?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  // Fetch Dashboard System Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystem(data.system);
          setDatabase(data.database);
          setAnalytics(data.analytics);
        }
      }
    } catch (err) {
      console.warn('Could not fetch stats:', err);
    }
  }, [token]);

  // Fetch Global Jobs Table
  const fetchJobs = useCallback(
    async (page = 1) => {
      setIsTableLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: '10',
          search: searchQuery,
          format: formatFilter,
        });

        const res = await fetch(`${BACKEND_URL}/api/dashboard/jobs?${queryParams.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setJobs(data.jobs || []);
            setCurrentPage(data.pagination.page);
            setTotalPages(data.pagination.totalPages);
            setTotalRecords(data.pagination.total);
          }
        }
      } catch (err) {
        console.warn('Could not fetch jobs:', err);
      } finally {
        setIsTableLoading(false);
      }
    },
    [searchQuery, formatFilter, token]
  );

  // Fetch Users List (SuperAdmin only)
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsUsersLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsersList(data.users);
        }
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setIsUsersLoading(false);
    }
  }, [token]);

  const fetchSupportMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/contact?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSupportMessagesCount(data.data?.submissions?.length || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to load support inbox:', err);
    }
  }, [token]);

  // Update User Role (SuperAdmin only)
  const handleUpdateRole = async (userId: string, currentRole: 'user' | 'superadmin') => {
    const newRole = currentRole === 'superadmin' ? 'user' : 'superadmin';
    if (!confirm(`Are you sure you want to change this user's role to '${newRole}'?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast(data.message || 'User role updated!');
        fetchUsers();
      } else {
        triggerToast(data.message || 'Failed to update role', 'error');
      }
    } catch (err) {
      triggerToast(err instanceof Error && err.message ? err.message : 'Error updating role', 'error');
    }
  };

  // Clear Job History
  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all processing logs from MySQL?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/jobs`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      triggerToast(data.message || 'Processing history cleared!');
      fetchStats();
      fetchJobs(1);
    } catch {
      triggerToast('Failed to clear logs', 'error');
    }
  };

  // Process Sandbox Image
  const handleProcessSandbox = async () => {
    if (!sandboxFile) {
      triggerToast('Please select or drop an image first!', 'error');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('image', sandboxFile);
    formData.append('format', targetFormat);
    formData.append('quality', String(quality));
    formData.append('fit', fitMode);
    if (resizeWidth) formData.append('width', resizeWidth);
    if (resizeHeight) formData.append('height', resizeHeight);

    try {
      const res = await fetch(`${BACKEND_URL}/api/images/process?responseType=json`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSandboxResult(data);
        triggerToast(`Processed in ${data.processingTimeMs}ms! Saved ${data.savingsPercent}%`);
        fetchStats();
        fetchJobs(1);
      } else {
        triggerToast(data.error || 'Failed to process image', 'error');
      }
    } catch (err) {
      triggerToast(err instanceof Error && err.message ? err.message : 'Error communicating with backend', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDrop = (file: File) => {
    setSandboxFile(file);
    setSandboxPreviewUrl(URL.createObjectURL(file));
    setSandboxResult(null);
  };

  const filteredUsers = usersList.filter((account) => {
    const query = userSearch.trim().toLowerCase();
    const matchesSearch = !query || [account.name, account.email, account.id].some((value) => value.toLowerCase().includes(query));
    const matchesRole = userRoleFilter === 'all' || account.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Initial dashboard load. The fetch helpers flip their loading flags
  // synchronously so the admin tabs show spinners right away.
  useEffect(() => {
    if (isSuperAdmin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStats();
      fetchJobs(1);
      fetchUsers();
      fetchSupportMessages();
    }
  }, [isSuperAdmin, fetchStats, fetchJobs, fetchUsers, fetchSupportMessages]);

  // Polling for live telemetry
  useEffect(() => {
    if (!isSuperAdmin || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchJobs(currentPage);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSuperAdmin, autoRefresh, currentPage, fetchStats, fetchJobs]);

  // =========================================================================
  // ACCESS GUARD: RESTRICT NON-SUPERADMINS
  // =========================================================================
  if (!hasMounted || isLoading) {
    return (
      <div className="min-h-[85vh] bg-zinc-950 flex items-center justify-center text-zinc-400 px-4">
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 shadow-lg shadow-black/20">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Verifying SuperAdmin credentials...</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-[85vh] bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="max-w-md w-full bg-zinc-900/80 border border-rose-500/30 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-white">403 Access Denied</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The <strong className="text-indigo-400">Resizer Control Center</strong> is restricted exclusively to SuperAdmin accounts. Standard users cannot view or access infrastructure telemetry.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/login?redirect=/admin/control-center"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              Sign In with SuperAdmin Credentials
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
            >
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white pb-20 transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* SuperAdmin Layout with ASIDE Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================================= */}
          {/* ASIDE SIDEBAR: SUPERADMIN                                                 */}
          {/* ========================================================================= */}
          <aside className="lg:col-span-3 bg-white/90 dark:bg-zinc-900/70 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-sm dark:shadow-2xl space-y-6 sticky top-20">
            
            {/* SuperAdmin Header Badge in Sidebar */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-zinc-800/80">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user ? user.name : 'SuperAdmin'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user?.email || 'admin@resizer.com'}</p>
                <span className="inline-block mt-1 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">
                  👑 SuperAdmin
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'telemetry'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Infrastructure & Telemetry</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('posts')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'posts'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Blog CMS & AI Studio</span>
                </div>
                <span className="text-[9px] font-mono bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded font-bold shadow-sm">
                  AI
                </span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Platform & AI Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>User RBAC Management</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold">
                  {usersList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Global MySQL Logs</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                  {totalRecords}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'support'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Support Inbox</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  {supportMessagesCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('posthog')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'posthog'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>PostHog Analytics</span>
                </div>
                <span className="text-[9px] font-mono bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => setActiveTab('auth0')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'auth0'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Auth0 Management</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveTab('studio')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'studio'
                    ? 'bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-purple-600/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Testing Studio</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            </nav>

            {/* Quick Actions in Sidebar */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800/80 space-y-2">
              <Link
                href="/dashboard"
                className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-2 transition-all"
              >
                <span>View User Dashboard</span>
              </Link>

              <button
                onClick={logout}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </aside>

          {/* ========================================================================= */}
          {/* MAIN CONTENT AREA: SUPERADMIN                                             */}
          {/* ========================================================================= */}
          <main className="lg:col-span-9 space-y-6">

            {/* Control Center Header */}
            <div className="bg-white dark:bg-gradient-to-r dark:from-zinc-900 dark:via-zinc-900/90 dark:to-indigo-950/40 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-5 shadow-sm dark:shadow-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Resizer Control Center
                  </h1>
                  <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 font-mono text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Root Infrastructure
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Real-time Docker MySQL database diagnostics, process telemetry, and role authorization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoRefresh((enabled) => !enabled)}
                  aria-pressed={autoRefresh}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    autoRefresh
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>{autoRefresh ? 'Live refresh' : 'Refresh paused'}</span>
                </button>
                <button
                  onClick={() => {
                    fetchStats();
                    fetchJobs(currentPage);
                    fetchUsers();
                    triggerToast('Telemetry refreshed!');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* 4 SuperAdmin Infrastructure KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 p-5 shadow-sm dark:shadow-xl">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total MySQL Jobs</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {analytics ? analytics.totalJobs.toLocaleString() : '0'}
                  </div>
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-1.5">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {analytics ? analytics.completedJobs : 0} Completed
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 p-5 shadow-sm dark:shadow-xl">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Storage Saved</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <HardDrive className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {analytics ? analytics.totalBytesSavedFormatted : '0 B'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
                    Orig: {analytics?.totalOriginalFormatted || '0 B'} &rarr; Out: {analytics?.totalOutputFormatted || '0 B'}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 p-5 shadow-sm dark:shadow-xl">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Average Savings</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                    {analytics ? `${analytics.avgSavingsPercent}%` : '0%'}
                  </div>
                  <div className="text-xs text-cyan-700 dark:text-cyan-300 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{analytics ? `${analytics.avgProcessingTimeMs}ms latency` : '0ms'}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 p-5 shadow-sm dark:shadow-xl">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Engine Uptime</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-300">
                    {formatUptime(system?.uptimeSeconds)}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-300 mt-1.5">
                    Node {system?.nodeVersion || '--'} ({system?.cpuCores || 0} Cores)
                  </div>
                </div>
              </div>
            </div>

            {/* TAB: BLOG CMS & AI STUDIO */}
            {activeTab === 'posts' && <PostsManager />}

            {/* TAB: PLATFORM & AI SETTINGS (Master Settings Hub) */}
            {activeTab === 'settings' && <SystemSettingsPage />}

            {/* TAB: SUPPORT INBOX */}
            {activeTab === 'support' && <SupportInbox />}

            {/* TAB: POSTHOG ANALYTICS (reads data back from PostHog) */}
            {activeTab === 'posthog' && <PostHogPanel />}

            {/* TAB: AUTH0 MANAGEMENT (credentials remain server-side) */}
            {activeTab === 'auth0' && <Auth0Panel />}

            {/* TAB 1: TELEMETRY */}
            {activeTab === 'telemetry' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl">
                  <div className="flex items-center gap-2.5 mb-4 text-slate-900 dark:text-white font-bold text-base">
                    <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2>Docker MySQL Telemetry</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Status</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {database?.status?.toUpperCase() || 'OFFLINE'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Database</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-200">{database?.name || 'nextjs_app'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Host & Port</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-200">{database ? `${database.host}:${database.port}` : 'localhost:3306'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Engine Version</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-200">{database?.version || '8.0'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500 dark:text-zinc-400">Ping Latency</span>
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-semibold">{database ? `${database.latencyMs} ms` : '--'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl">
                  <div className="flex items-center gap-2.5 mb-4 text-slate-900 dark:text-white font-bold text-base">
                    <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <h2>Process & Host Memory</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Heap Used</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-200">{system?.memory.processHeapUsedFormatted || '--'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <span className="text-slate-500 dark:text-zinc-400">Resident RSS</span>
                      <span className="font-mono text-slate-800 dark:text-zinc-200">{system?.memory.processRssFormatted || '--'}</span>
                    </div>
                    <div className="py-2 border-b border-slate-100 dark:border-zinc-800/60">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-500 dark:text-zinc-400">Host RAM Usage</span>
                        <span className="font-mono text-slate-800 dark:text-zinc-200 font-semibold">{system?.memory.usagePercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${system?.memory.usagePercent || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500 dark:text-zinc-400">Host OS</span>
                      <span className="font-mono text-xs text-slate-600 dark:text-zinc-300">{system?.platform || 'Windows / x64'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl">
                  <div className="flex items-center gap-2.5 mb-4 text-slate-900 dark:text-white font-bold text-base">
                    <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2>Format Distribution</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    {analytics && analytics.formatBreakdown && analytics.formatBreakdown.length > 0 ? (
                      analytics.formatBreakdown.map((item) => {
                        const percent = analytics.totalJobs > 0 ? Math.round((item.count / analytics.totalJobs) * 100) : 0;
                        return (
                          <div key={item.target_format} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-mono font-bold uppercase text-slate-800 dark:text-zinc-200">{item.target_format}</span>
                              <span className="text-slate-500 dark:text-zinc-400">
                                {item.count} files ({percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-slate-400 dark:text-zinc-500 text-center">
                        <Layers className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">No conversions recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* TAB 2: USER RBAC MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-indigo-500/30 rounded-2xl p-6 shadow-sm dark:shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registered Users & Role Assignment</h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Promote users to SuperAdmin or demote accounts directly in MySQL.</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchUsers}
                    disabled={isUsersLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUsersLoading ? 'animate-spin' : ''}`} />
                    <span>Reload Users</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <label className="relative flex-1">
                    <span className="sr-only">Search users</span>
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, email, or ID"
                      className="w-full bg-slate-50 dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </label>
                  <label>
                    <span className="sr-only">Filter users by role</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value as 'all' | 'user' | 'superadmin')}
                      className="w-full sm:w-auto bg-slate-50 dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All roles</option>
                      <option value="user">Users only</option>
                      <option value="superadmin">SuperAdmins only</option>
                    </select>
                  </label>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-950/80 text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-zinc-800">
                        <th className="py-3 px-4">User ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Registered</th>
                        <th className="py-3 px-4 text-right">Role Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
                      {isUsersLoading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-zinc-500">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                            Loading registered accounts...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-zinc-500">
                            No registered users found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-500 text-[11px]">{u.id}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{u.name || 'User'}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-300">{u.email}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  u.role === 'superadmin'
                                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/40'
                                    : 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/40'
                                }`}
                              >
                                {u.role === 'superadmin' ? '👑 SuperAdmin' : '👤 User'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString() : '--'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleUpdateRole(u.id, u.role)}
                                className="px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:scale-105 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-700"
                              >
                                {u.role === 'superadmin' ? 'Demote to User' : 'Promote to SuperAdmin'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: GLOBAL MYSQL ACTIVITY LOGS */}
            {activeTab === 'logs' && (
              <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-2xl space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Global MySQL Activity Logs (`image_jobs`)</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      Root access to inspect and manage all job records stored in Docker MySQL.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 w-48"
                      />
                    </div>

                    <select
                      value={formatFilter}
                      onChange={(e) => setFormatFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                    >
                      <option value="">All Formats</option>
                      <option value="webp">WebP</option>
                      <option value="avif">AVIF</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                    </select>

                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Logs</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800/80">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-950/80 text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-zinc-800">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-4">Format</th>
                        <th className="py-3 px-4">Original</th>
                        <th className="py-3 px-4">Output</th>
                        <th className="py-3 px-4">Savings</th>
                        <th className="py-3 px-4">Dimensions</th>
                        <th className="py-3 px-4">Latency</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-zinc-800/60">
                      {isTableLoading ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-zinc-500">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                            Loading logs from MySQL...
                          </td>
                        </tr>
                      ) : jobs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-zinc-500">
                            No matching processing records found in MySQL.
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-400 dark:text-zinc-500">#{job.id}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-200">
                              <span title={job.original_name}>
                                {job.original_name.length > 20
                                  ? `${job.original_name.substring(0, 18)}...`
                                  : job.original_name}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                  job.target_format === 'webp'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                                    : job.target_format === 'avif'
                                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30'
                                    : job.target_format === 'jpeg' || job.target_format === 'jpg'
                                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                                    : 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30'
                                }`}
                              >
                                {job.target_format}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-300">{job.originalSizeFormatted}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-300">{job.outputSizeFormatted}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono font-semibold px-2 py-0.5 rounded-md ${
                                  job.savings_percent > 0
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                    : 'text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800'
                                }`}
                              >
                                {job.savings_percent > 0 ? `-${Math.round(job.savings_percent)}%` : '0%'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                              {job.width && job.height ? `${job.width}×${job.height}` : 'Auto'}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-zinc-300">{job.processing_time_ms}ms</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                  job.status === 'completed'
                                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                                    : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                                }`}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                              {new Date(job.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-zinc-400 pt-2">
                  <span>
                    Page {currentPage} of {totalPages} ({totalRecords} records total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (currentPage > 1) fetchJobs(currentPage - 1);
                      }}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-slate-700 dark:text-zinc-300 font-semibold transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        if (currentPage < totalPages) fetchJobs(currentPage + 1);
                      }}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-slate-700 dark:text-zinc-300 font-semibold transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SHARP TESTING STUDIO */}
            {activeTab === 'studio' && (
              <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm dark:shadow-2xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">SuperAdmin Testing Studio</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Directly test Sharp engine pipeline and verify MySQL `image_jobs` logging.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileDrop(e.dataTransfer.files[0]);
                        }
                      }}
                      className="border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] group"
                    >
                      <ImageIcon className="w-10 h-10 text-indigo-500 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {sandboxFile ? sandboxFile.name : 'Click or drop an image to test'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                        {sandboxFile ? `${(sandboxFile.size / 1024).toFixed(1)} KB` : 'Supports JPG, PNG, WebP, AVIF, TIFF up to 50MB'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileDrop(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Format
                        </label>
                        <select
                          value={targetFormat}
                          onChange={(e) => setTargetFormat(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950/70 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                        >
                          <option value="webp">WebP (Recommended)</option>
                          <option value="avif">AVIF (Ultra Compress)</option>
                          <option value="jpeg">JPEG / JPG</option>
                          <option value="png">PNG (Lossless)</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Quality</label>
                          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          placeholder="Auto"
                          value={resizeWidth}
                          onChange={(e) => setResizeWidth(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950/70 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          placeholder="Auto"
                          value={resizeHeight}
                          onChange={(e) => setResizeHeight(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-zinc-950/70 border border-slate-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleProcessSandbox}
                      disabled={isProcessing || !sandboxFile}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Processing with Sharp...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Process & Record to MySQL</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Output Result</span>
                      {sandboxResult && (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                          -{sandboxResult.savingsPercent}% Size Reduction
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-h-[190px] rounded-xl bg-slate-200/50 dark:bg-black/40 border border-slate-200 dark:border-zinc-800/60 flex items-center justify-center p-3 overflow-hidden">
                      {sandboxResult?.dataBase64 ? (
                        <img
                          src={sandboxResult.dataBase64}
                          alt="Processed result"
                          className="max-h-48 max-w-full object-contain rounded-lg shadow-md"
                        />
                      ) : sandboxPreviewUrl ? (
                        <img
                          src={sandboxPreviewUrl}
                          alt="Original preview"
                          className="max-h-48 max-w-full object-contain rounded-lg opacity-70"
                        />
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-zinc-500 text-center">
                          Select an image to test conversion and record into MySQL.
                        </p>
                      )}
                    </div>

                    {sandboxResult && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800/80 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-zinc-400">Storage Saved:</span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {((sandboxResult.originalSizeBytes! - sandboxResult.outputSizeBytes!) / 1024).toFixed(1)} KB (
                            {sandboxResult.savingsPercent}%)
                          </span>
                        </div>
                        <a
                          href={sandboxResult.dataBase64}
                          download={sandboxResult.filename || 'resized_image'}
                          className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-zinc-700"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download ({sandboxResult.filename})</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
