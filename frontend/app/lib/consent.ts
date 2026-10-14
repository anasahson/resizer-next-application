/**
 * Analytics consent (GDPR / ePrivacy).
 *
 * PostHog must not initialise — and must not set its `ph_...posthog` cookie or
 * download `posthog-recorder.js` — until the visitor has actively agreed. The
 * consent decision is persisted in localStorage so the banner is asked once.
 *
 * Absence of a stored decision means "no consent", so a first-time visitor is
 * never tracked before choosing.
 */

export const CONSENT_KEY = 'resizer_analytics_consent';
export const CONSENT_VERSION = 1;

export type ConsentState = 'granted' | 'denied' | null;

/** Fires the `resizer:consent` event so providers can react in the same tab. */
function notifyConsent(granted: boolean) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('resizer:consent', { detail: { granted, version: CONSENT_VERSION } })
  );
}

/** Reads the stored decision. Returns null when no valid choice exists. */
export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { granted?: boolean; version?: number };
    if (typeof parsed.granted !== 'boolean') return null;
    // A stored decision from an older consent version is treated as no answer,
    // so changes to what we collect re-prompt the visitor.
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.granted ? 'granted' : 'denied';
  } catch {
    return null;
  }
}

/** Persists a decision and notifies listeners. */
export function setConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ granted, version: CONSENT_VERSION, at: new Date().toISOString() })
    );
  } catch {
    // Storage can be unavailable (private mode / blocked). The in-memory
    // notification below still applies for this page view.
  }
  notifyConsent(granted);
}

/** True only when the visitor has explicitly opted in. */
export function hasConsent(): boolean {
  return getConsent() === 'granted';
}

/**
 * Subscribes to consent changes, including ones made in another tab.
 * Returns an unsubscribe function.
 */
export function onConsentChange(handler: (granted: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const onLocal = (e: Event) => {
    handler((e as CustomEvent<{ granted: boolean }>).detail.granted);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) handler(getConsent() === 'granted');
  };

  window.addEventListener('resizer:consent', onLocal);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('resizer:consent', onLocal);
    window.removeEventListener('storage', onStorage);
  };
}
