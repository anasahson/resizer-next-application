import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_BLffV3wiLg4uCd22oHvA62VHFiXr2z4Gpw43N3pwR9HQ';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (posthog.__loaded) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    // Auto pageview capture only fires once at init (SPA route changes need
    // 'history_change'). PostHogProvider captures $pageview manually on mount
    // and on every route change, so leaving this true would double-count the
    // landing page.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false, // manual control for a tool-focused app
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.debug();
      }
    },
  });
}

/** Fire a custom event. No-ops until the SDK has loaded. */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;
  posthog.capture(event, properties);
}

/**
 * Identify the signed-in user. Needed because `person_profiles` is
 * 'identified_only': without identify(), every visitor stays anonymous and
 * per-page visitor counts can only be deduplicated by device id.
 */
export function identifyUser(user: {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
}) {
  if (typeof window === 'undefined' || !posthog.__loaded) return;
  if (user?.id == null) return;
  posthog.identify(String(user.id), {
    ...(user.email ? { $email: user.email } : {}),
    ...(user.name ? { name: user.name } : {}),
    ...(user.role ? { role: user.role } : {}),
  });
}

/** Drop the identity on logout so the next visitor starts anonymous. */
export function resetUser() {
  if (typeof window === 'undefined' || !posthog.__loaded) return;
  posthog.reset();
}

export default posthog;
