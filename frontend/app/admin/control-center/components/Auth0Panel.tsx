'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Search, Shield, Users } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

interface Auth0Status {
  configured: boolean;
  audience?: string;
  hint?: string;
}

interface Auth0User {
  user_id: string;
  name?: string;
  nickname?: string;
  email?: string;
  picture?: string;
  created_at?: string;
  last_login?: string;
  blocked?: boolean;
  [key: string]: unknown;
}

export default function Auth0Panel() {
  const [status, setStatus] = useState<Auth0Status | null>(null);
  const [users, setUsers] = useState<Auth0User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const getAuthToken = () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('resizora_auth_token')
      || localStorage.getItem('resizer_superadmin_auth_token')
      || '';
  };

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAuthToken();
      const response = await fetch(`${BACKEND_URL}/api/admin/auth0/status`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to load Auth0 status.');
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Auth0 status.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ per_page: '25', page: '0' });
      if (query.trim()) params.set('q', query.trim());

      const response = await fetch(`${BACKEND_URL}/api/admin/auth0/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Failed to load Auth0 users.');

      const rows = Array.isArray(data.users) ? data.users : [];
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Auth0 users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      void loadStatus();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadStatus]);

  const refreshUsers = () => {
    void loadUsers(search);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-orange-500/20 dark:bg-zinc-900/80 dark:shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Auth0 Management</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Manage tenant users through the server-side Auth0 API.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadStatus()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {status && (
          <div className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-3 text-xs ${
            status.configured
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
          }`}>
            {status.configured
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <p className="font-semibold">{status.configured ? 'Auth0 Management API configured' : 'Auth0 Management API not configured'}</p>
              {status.audience && <p className="mt-1 break-all opacity-80">Audience: {status.audience}</p>}
              {status.hint && <p className="mt-1">{status.hint}</p>}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}
      </div>

      {status?.configured && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tenant Users</h3>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') refreshUsers();
                  }}
                  placeholder="Search name or email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={refreshUsers}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading Auth0 users...
            </div>
          ) : users.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-xs text-slate-500 dark:border-zinc-700 dark:text-zinc-400">
              No Auth0 users found.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="px-3 py-2 font-semibold">User</th>
                    <th className="px-3 py-2 font-semibold">Email</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-slate-100 dark:border-zinc-800/60">
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{user.name || user.nickname || 'Unnamed user'}</div>
                        <div className="mt-1 break-all font-mono text-[10px] text-slate-400">{user.user_id}</div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-zinc-300">{user.email || '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 font-semibold ${user.blocked
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        }`}>
                          {user.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-500 dark:text-zinc-400">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
