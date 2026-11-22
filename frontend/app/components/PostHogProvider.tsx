'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initPostHog, optOutPostHog } from '../lib/posthog';
import { initFrontendTracking, resetSectionTracking } from '../lib/tracking';
import { getConsent, onConsentChange } from '../lib/consent';
import ConsentBanner from './ConsentBanner';
import posthog from 'posthog-js';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Resolve the stored decision, then start analytics only if granted.
  useEffect(() => {
    const granted = getConsent() === 'granted';
    if (granted) {
      initPostHog();
      initFrontendTracking();
    }
    return onConsentChange((next) => {
      if (next) {
        initPostHog();
        initFrontendTracking();
      } else {
        optOutPostHog();
      }
    });
  }, []);


  // Track page views on route changes. Skipped entirely without consent, and
  // no-op'd by posthog.capture itself while the SDK is unloaded.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (getConsent() !== 'granted') return;
    resetSectionTracking();
    // window.location already carries pathname + query string.
    posthog.capture('$pageview', { $current_url: window.location.href });
  }, [pathname]);

  // Report uncaught errors & promise rejections to PostHog Error Tracking.
  // posthog-js does NOT capture these on its own (verified against the
  // bundled dist), so this listener is what feeds the $exception events
  // shown in the SuperAdmin "PostHog Analytics" panel.
  useEffect(() => {
    const report = (type: string, message: string, source: string) => {
      if (!posthog.__loaded) return;
      const value = (message || 'Unknown error').slice(0, 2000);
      posthog.capture('$exception', {
        $exception_type: type || 'Error',
        $exception_message: value,
        $exception_source: source,
        $exception_url: window.location.href,
        // Shape matches PostHog's exception_list convention so the Error
        // Tracking product can group issues by type + value.
        $exception_list: [{ type: type || 'Error', value }],
      });
    };

    const onError = (e: ErrorEvent) => {
      // ErrorEvent carries no `name`; the underlying Error does.
      const type = e.error instanceof Error ? e.error.name : 'ErrorEvent';
      report(type, e.message || String(e.error || ''), 'frontend-onerror');
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: unknown = e.reason;
      if (reason instanceof Error) report(reason.name, reason.message, 'frontend-unhandledrejection');
      else report('UnhandledRejection', String(reason), 'frontend-unhandledrejection');
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
