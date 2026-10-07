'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog } from '../lib/posthog';
import { initFrontendTracking, resetSectionTracking } from '../lib/tracking';
import posthog from 'posthog-js';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize once on mount
  useEffect(() => {
    initPostHog();
    initFrontendTracking();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    resetSectionTracking();
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    posthog.capture('$pageview', { $current_url: window.location.origin + url });
  }, [pathname, searchParams]);

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

  return <>{children}</>;
}
