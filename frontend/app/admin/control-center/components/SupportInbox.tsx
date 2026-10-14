'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, MessageSquareText, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

interface SupportMessage {
  id: number;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function SupportInbox() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/contact?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load support messages.');
      }

      setMessages(data.data?.submissions || []);
    } catch (err) {
      console.error('Support inbox error', err);
      setError(err instanceof Error ? err.message : 'Unable to load the support inbox.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            Support Inbox
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
            Contact submissions
          </h2>
        </div>
        <button
          type="button"
          onClick={loadMessages}
          className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Refresh inbox
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          Loading support requests...
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          No support messages yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <UserCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                    <span>{message.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {message.email}
                    </span>
                    <span>{formatDate(message.created_at)}</span>
                  </div>
                </div>

                <div className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                  #{message.id}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  Subject
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{message.subject}</p>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Message
                </div>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-zinc-300">
                  {message.message}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
