import posthog from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_BLffV3wiLg4uCd22oHvA62VHFiXr2z4Gpw43N3pwR9HQ';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initPostHog() {
  if (typeof window === 'undefined') return;
  if (posthog.__loaded) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    // Explicitly keep the SDK quiet by default. This prevents console payloads
    // from being logged during hot reloads or rehydration and avoids leaking
    // user/device metadata to the browser console in local development.
    debug: process.env.NEXT_PUBLIC_ENABLE_POSTHOG_DEBUG === 'true',
    // Auto pageview capture only fires once at init (SPA route changes need
    // 'history_change'). PostHogProvider captures $pageview manually on mount
    // and on every route change, so leaving this true would double-count the
    // landing page.
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false, // manual control for a tool-focused app
    // Session recording is deliberately OFF. It would download
    // posthog-recorder.js and capture DOM interactions, which is far beyond
    // aggregate page/section metrics and requires explicit opt-in we do not
    // ask for. See app/lib/consent.ts.
    disable_session_recording: true,
    // Never persist analytics state in a cookie. PostHog would otherwise set
    // `ph_<key>_posthog` on first load, before any consent decision.
    persistence: 'localStorage',
    loaded: (ph) => {
      // Keep analytics logs quiet in local development unless an explicit
      // opt-in is enabled. PostHog debug output exposes event payloads and can
      // flood the browser console during active testing.
      if (process.env.NEXT_PUBLIC_ENABLE_POSTHOG_DEBUG === 'true') {
        ph.debug();
      }
    },
  });
}

/**
 * Stops the SDK and clears any identity/device state it has already written.
 * Used when a visitor withdraws consent mid-session.
 */
export function optOutPostHog() {
  if (typeof window === 'undefined') return;
  try {
    if (posthog.__loaded) {
      posthog.opt_out_capturing();
      posthog.reset();
    }
    posthog.__loaded = false;
  } catch {
    // Best effort only — analytics must never break the app.
  }
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
