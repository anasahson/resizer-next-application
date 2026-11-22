'use client';

import { useSyncExternalStore } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { getConsent, onConsentChange, setConsent } from '../lib/consent';

const subscribeToConsent = (onStoreChange: () => void) =>
  onConsentChange(() => onStoreChange());
const getVisibleSnapshot = () => getConsent() === null;
const getServerVisibleSnapshot = () => false;

/**
 * Analytics consent banner.
 *
 * Rendered from PostHogProvider so analytics stay blocked until a choice is
 * made. Nothing is tracked — no cookie, no recorder download, no events — while
 * this banner is visible, which is what makes the "No Tracking" claim on
 * /privacy accurate for visitors who decline.
 *
 * The decision is stored in localStorage; see app/lib/consent.ts.
 */
export default function ConsentBanner() {
  const visible = useSyncExternalStore(
    subscribeToConsent,
    getVisibleSnapshot,
    getServerVisibleSnapshot,
  );

  if (!visible) return null;

  const choose = (granted: boolean) => {
    setConsent(granted);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[9999]"
    >
      <div className="rounded-2xl border border-border bg-surface-elevated dark:bg-zinc-900 shadow-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-primary dark:text-white">
              Help us improve Resizer AI
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              We use PostHog for anonymous, aggregate usage analytics — which pages and
              features are used, and JavaScript errors.{' '}
              <b className="text-primary dark:text-zinc-200">
                Your images never leave your browser
              </b>{' '}
              and are never analysed, uploaded or recorded. Session recording is always
              off. You can decline and use the site fully.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              See our{' '}
              <a
                href="/privacy"
                className="underline text-blue-600 dark:text-blue-400 hover:no-underline"
              >
                Privacy Policy
              </a>{' '}
              for details.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => choose(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
              >
                Accept analytics
              </button>
              <button
                type="button"
                onClick={() => choose(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => choose(false)}
            aria-label="Decline analytics and close"
            className="text-muted hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
