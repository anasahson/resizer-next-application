import { trackEvent } from './posthog';

/**
 * Automatic, privacy-safe frontend tracking. Installed once by PostHogProvider.
 *
 * Emits:
 *  - `$section_view` — which sections of a page were actually scrolled into
 *    view (IntersectionObserver, 50% visible, once per section per page view).
 *    Section name = `data-track-section` attribute, else element `id`, else the
 *    first heading's text.
 *  - `$input_used` — which form controls were used, and a *bucketed* value for
 *    safe controls (range/number rounded, select option label, on/off).
 *
 * Privacy: passwords, emails, phone numbers, file inputs and free-text
 * textareas are NEVER tracked (see isSensitive), and no typed text value is
 * ever sent. Opt out per element with data-track-input="off" /
 * data-track-section="off".
 */

// Never track anything that could carry personal data.
const SENSITIVE_NAME = /pass|email|mail|phone|tel|token|secret|otp|cvv|card|ssn|user_?name/i;
const SENSITIVE_TYPES = new Set(['password', 'email', 'tel', 'file', 'hidden']);

let installed = false;
/** `${pathname}::${section}` keys already reported this page view. */
const seenSections = new Set<string>();

function currentPath(): string {
  return window.location.pathname;
}

function sectionName(el: Element): string {
  const explicit = el.getAttribute('data-track-section');
  if (explicit && explicit !== 'off') return explicit.slice(0, 60);
  const id = el.getAttribute('id');
  if (id) return id.slice(0, 60);
  const heading = el.querySelector('h1, h2, h3')?.textContent?.trim();
  if (heading) return heading.replace(/\s+/g, ' ').slice(0, 60);
  return 'section';
}

function isSensitive(el: HTMLElement): boolean {
  if (el.getAttribute('data-track-input') === 'off') return true;
  if (el.tagName.toLowerCase() === 'textarea') return true;
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  if (SENSITIVE_TYPES.has(type)) return true;
  const ident = el.getAttribute('name') || el.getAttribute('id') || '';
  return SENSITIVE_NAME.test(ident);
}

function controlOf(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  if (tag === 'select') return 'select';
  if (tag === 'textarea') return 'textarea';
  const type = (el.getAttribute('type') || 'text').toLowerCase();
  return `input:${type}`;
}

/** Bucketed value for safe controls only — never raw typed text. */
function bucketValue(el: HTMLElement): string | undefined {
  const tag = el.tagName.toLowerCase();
  if (tag === 'select') {
    const opt = (el as HTMLSelectElement).selectedOptions?.[0];
    const text = opt?.textContent?.trim().replace(/\s+/g, ' ');
    return text ? text.slice(0, 40) : undefined;
  }
  const input = el as HTMLInputElement;
  const type = (input.getAttribute('type') || 'text').toLowerCase();
  if (type === 'checkbox' || type === 'radio') return input.checked ? 'on' : 'off';
  if (type === 'range' || type === 'number') {
    const n = Number(input.value);
    if (!Number.isFinite(n)) return undefined;
    return type === 'range' ? `${Math.round(n / 10) * 10}` : `${Math.round(n)}`;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Section visibility                                                   */
/* ------------------------------------------------------------------ */
function installSectionTracking() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const name = sectionName(el);
        if (!name || name === 'off') continue;
        const key = `${currentPath()}::${name}`;
        if (seenSections.has(key)) continue;
        seenSections.add(key);
        trackEvent('$section_view', {
          $section: name,
          $section_path: currentPath(),
          $section_ratio: Math.round(entry.intersectionRatio * 100) / 100,
        });
        // One view per section per page view keeps the metric meaningful.
        observer.unobserve(el);
      }
    },
    { threshold: 0.5 }
  );

  const scan = () => {
    document.querySelectorAll('section, [data-track-section]').forEach((el) => {
      const marker = el as HTMLElement;
      if (marker.dataset.trackObserved === '1') return;
      if (marker.getAttribute('data-track-section') === 'off') return;
      marker.dataset.trackObserved = '1';
      observer.observe(el);
    });
  };

  // Next.js renders pages client-side, so re-scan when the DOM changes.
  const mutation = new MutationObserver(() => scan());
  if (document.body) mutation.observe(document.body, { childList: true, subtree: true });
  scan();
  window.setTimeout(scan, 300);
}

/* ------------------------------------------------------------------ */
/* Form input usage (delegated)                                         */
/* ------------------------------------------------------------------ */
function installInputTracking() {
  const handler = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const el = target.closest('[data-track-input], select, input, textarea') as HTMLElement | null;
    if (!el || el === document.body) return;
    if (isSensitive(el)) return;

    const explicit = el.getAttribute('data-track-input');
    const name = (
      explicit && explicit !== 'off'
        ? explicit
        : el.getAttribute('name') || el.getAttribute('id') || 'unnamed'
    ).slice(0, 60);

    trackEvent('$input_used', {
      $input: name,
      $control: controlOf(el),
      $input_bucket: bucketValue(el) ?? null,
      $input_path: currentPath(),
    });
  };

  // `change` covers selects/checkboxes/ranges; `blur` covers text-ish controls.
  document.addEventListener('change', handler, true);
  document.addEventListener('blur', handler, true);
}

/** Idempotent — safe to call from a React effect that may run twice. */
export function initFrontendTracking() {
  if (typeof window === 'undefined' || installed) return;
  installed = true;
  try {
    installSectionTracking();
    installInputTracking();
  } catch (err) {
    console.warn('[PostHog] frontend tracking setup failed:', err);
  }
}

/** Clear per-page section dedupe so returning to a page counts again. */
export function resetSectionTracking() {
  seenSections.clear();
}

export default initFrontendTracking;