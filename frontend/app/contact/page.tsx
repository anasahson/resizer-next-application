'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Mail, MessageSquareText, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialForm: ContactFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState<ContactFormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const handleChange = (field: keyof ContactFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: 'idle', message: '' });

    const name = (form.name || user?.name || '').trim();
    const email = (form.email || user?.email || '').trim().toLowerCase();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name || name.length > 120) {
      setStatus({ type: 'error', message: 'Please enter your name.' });
      return;
    }

    if (!user && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      setStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (!subject || subject.length > 160) {
      setStatus({ type: 'error', message: 'Add a shorter subject (max 160 characters).' });
      return;
    }

    if (!message || message.length > 3000) {
      setStatus({ type: 'error', message: 'Write a message between 1 and 3,000 characters.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email: user?.email || email,
          subject,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to send your message right now.');
      }

      setStatus({
        type: 'success',
        message: 'Your request was saved successfully. Our support team will review it shortly.',
      });
      setForm({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pt-24 pb-16 px-4">
      <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.1fr_1.4fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Support Center
          </div>

          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Contact the Resizer support team
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-zinc-300">
            Need help with billing, privacy, image processing, or account access? Send a message and our team will review it in the secure support inbox.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <Mail className="mt-0.5 h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Email response</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300">We aim to answer support requests within 1–2 business days.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <MessageSquareText className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Stored securely</p>
                <p className="text-sm text-slate-600 dark:text-zinc-300">Requests are saved in a compact support inbox with only the information required to respond.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200">
                <span className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" /> Full name
                </span>
                <input
                  type="text"
                  value={form.name || user?.name || ''}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none ring-0 transition focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  placeholder="Jane Doe"
                  maxLength={120}
                  disabled={isSubmitting}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200">
                <span className="mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" /> Email
                </span>
                <input
                  type="email"
                  value={form.email || user?.email || ''}
                  onChange={(event) => handleChange('email', event.target.value)}
                  readOnly={Boolean(user)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${user
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    : 'border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white'}`}
                  placeholder="name@example.com"
                  maxLength={254}
                  disabled={isSubmitting}
                />
                {user && (
                  <span className="mt-2 block text-[11px] text-slate-500 dark:text-zinc-400">
                    Your signed-in email is automatically loaded and cannot be edited.
                  </span>
                )}
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200">
              <span className="mb-2 block">Subject</span>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => handleChange('subject', event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Need help with my account"
                maxLength={160}
                disabled={isSubmitting}
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-200">
              <span className="mb-2 block">Message</span>
              <textarea
                value={form.message}
                onChange={(event) => handleChange('message', event.target.value)}
                rows={7}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Describe your issue or question. Include any relevant details so we can help faster."
                maxLength={3000}
                disabled={isSubmitting}
              />
            </label>

            {status.type !== 'idle' && (
              <div
                className={`rounded-xl border px-3.5 py-3 text-sm ${status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'}`}
              >
                {status.message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {!user ? (
                <Link
                  href="/login?redirect=/contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-300"
                >
                  Already have an account? Sign in here
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span className="text-xs text-slate-500 dark:text-zinc-400">Signed in as {user.email}</span>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
