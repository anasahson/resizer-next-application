/**
 * Auto-upload queue.
 *
 * Every processed image is hosted automatically (no button) through a small
 * client-side queue that keeps only a couple of uploads in flight at once.
 * That matters when many users process images at the same time: firing every
 * upload at imgbb simultaneously is what triggers "You have been forbidden to
 * use this website" / slow responses, so we serialise politely and retry with
 * backoff instead of hammering the API.
 *
 * Image bytes stay in memory (never sessionStorage — base64 images would blow
 * the ~5 MB storage quota). sessionStorage only keeps small metadata so a page
 * reload still shows which images were already hosted.
 */

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

/** Where the bytes came from — logged server-side for the audit trail. */
export type UploadSource = 'url-import' | 'system-file';

export interface UploadJob {
  id: string;
  filename: string;
  dataUrl: string;
  /** Raw bytes when we already have them (e.g. a URL import) — avoids base64. */
  blob?: Blob;
  /** Recorded in the hosting log so you can tell imports from system files. */
  source?: UploadSource;
  /**
   * imgbb's delete_url for this upload. Nothing is stored in a database any
   * more, so this token is the ONLY way to actually remove the image from
   * imgbb — without it a "delete" would only hide the link locally while the
   * image stayed live and publicly reachable forever.
   */
  deleteUrl?: string;
  status: UploadStatus;
  attempts: number;
  url?: string;
  error?: string;
  /** How long the upload took end-to-end, in ms (set once it settles). */
  durationMs?: number;
  updatedAt: number;
}

export interface QueueSnapshot {
  jobs: UploadJob[];
  total: number;
  queued: number;
  uploading: number;
  done: number;
  failed: number;
  /** true while anything is still queued or in flight */
  busy: boolean;
  lastUrl?: string;
  /** Duration in ms of the most recent finished upload. */
  lastDurationMs?: number;
  /** Mean duration in ms across every finished upload this session. */
  averageDurationMs?: number;
}

// imgbb rate-limits bursts (HTTP 429), so uploads go out one at a time with a
// small gap between them. The server-side concurrency gate backs this up when
// several users process images at once.
const MAX_CONCURRENT = 1;
const MIN_GAP_MS = 1200;
const MAX_JOBS = 25; // keep the queue bounded
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2000, 5000, 12000];
const STORAGE_KEY = 'resizora_host_queue';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  '';

type Listener = (snapshot: QueueSnapshot) => void;

class UploadQueue {
  private jobs: UploadJob[] = [];
  private inFlight = 0;
  private listeners = new Set<Listener>();
  private draining = false;
  /** Timestamp of the last finished upload, used to space requests out. */
  private lastFinishedAt = 0;

  constructor() {
    this.restore();
  }

  /** Metadata only — no image data (sessionStorage quota). */
  private persist() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const meta = this.jobs
        .filter((j) => j.status === 'done' || j.status === 'error')
        .slice(-MAX_JOBS)
        .map(({ id, filename, status, url, error, updatedAt }) => ({ id, filename, status, url, error, updatedAt }));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
    } catch {
      /* storage full or unavailable — the queue still works without it */
    }
  }

  /** Rehydrate finished jobs so the links survive a reload. */
  private restore() {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const meta = JSON.parse(raw) as Array<Partial<UploadJob>>;
      if (!Array.isArray(meta)) return;
      this.jobs = meta.map((m) => ({
        id: String(m.id),
        filename: String(m.filename || 'image'),
        dataUrl: '', // bytes are intentionally not persisted
        status: (m.status as UploadStatus) === 'done' ? 'done' : 'error',
        attempts: m.status === 'done' ? 1 : MAX_ATTEMPTS,
        url: m.url,
        error: m.error,
        updatedAt: Number(m.updatedAt) || Date.now(),
      }));
    } catch {
      this.jobs = [];
    }
  }

  snapshot(): QueueSnapshot {
    const count = (s: UploadStatus) => this.jobs.filter((j) => j.status === s).length;
    const doneJobs = this.jobs.filter((j) => j.status === 'done' && typeof j.durationMs === 'number');
    const lastDone = [...this.jobs].reverse().find((j) => j.status === 'done');
    const average = doneJobs.length
      ? Math.round(doneJobs.reduce((sum, j) => sum + (j.durationMs || 0), 0) / doneJobs.length)
      : undefined;
    return {
      jobs: this.jobs,
      total: this.jobs.length,
      queued: count('queued'),
      uploading: count('uploading'),
      done: count('done'),
      failed: count('error'),
      busy: count('queued') + count('uploading') > 0,
      lastUrl: lastDone?.url,
      lastDurationMs: lastDone?.durationMs,
      averageDurationMs: average,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snap = this.snapshot();
    this.persist();
    this.listeners.forEach((l) => l(snap));
  }

  private update(id: string, patch: Partial<UploadJob>) {
    this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j));
    this.emit();
  }

  /** Queue an image for hosting. Duplicate ids are ignored. */
  enqueue(job: { id: string; filename: string; dataUrl?: string; blob?: Blob; source?: UploadSource }) {
    if (!job?.dataUrl && !job?.blob) return;
    if (this.jobs.some((j) => j.id === job.id)) return;
    this.jobs = [
      ...this.jobs,
      { ...job, dataUrl: job.dataUrl || '', status: 'queued', attempts: 0, updatedAt: Date.now() },
    ];
    if (this.jobs.length > MAX_JOBS) this.jobs = this.jobs.slice(-MAX_JOBS);
    this.emit();
    this.drain();
  }

  /**
   * Forget a saved image: deletes the file from imgbb, then drops it from the
   * queue. Images live on imgbb and not in any database, so the host is the
   * source of truth — if we only removed the row here the public URL would keep
   * working forever.
   */
  async remove(id: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === id);

    if (job?.deleteUrl) {
      const res = await fetch(`${BACKEND_URL}/api/storage/hosted`, {
        method: 'DELETE',
        headers: { ...this.authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteUrl: job.deleteUrl }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Delete failed (HTTP ${res.status}).`);
      }
    }
    // No deleteUrl (e.g. a host that gives none back): we can still forget it
    // locally, but be honest that the file itself may remain on the host.
    this.dismiss(id);
  }

  /** Retry a failed job (its bytes are still in memory). */
  retry(id: string) {
    const job = this.jobs.find((j) => j.id === id);
    if (!job || !job.dataUrl) return;
    this.update(id, { status: 'queued', attempts: 0, error: undefined });
    this.drain();
  }

  /** Drop a job and release its bytes. */
  dismiss(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.emit();
  }

  private async drain() {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.inFlight < MAX_CONCURRENT) {
        const next = this.jobs.find((j) => j.status === 'queued' && j.dataUrl);
        if (!next) break;

        // Keep a gap between uploads so a burst never trips imgbb's throttle.
        const sinceLast = Date.now() - this.lastFinishedAt;
        if (this.lastFinishedAt && sinceLast < MIN_GAP_MS) {
          const delay = MIN_GAP_MS - sinceLast;
          const timer = setTimeout(() => {
            if (typeof timer.unref === 'function') timer.unref();
            this.draining = false;
            this.drain();
          }, delay);
          if (typeof timer.unref === 'function') timer.unref();
          return;
        }

        this.update(next.id, { status: 'uploading' });
        this.inFlight += 1;
        // Intentionally not awaited: the queue advances when this finishes.
        this.run(next).finally(() => {
          this.inFlight -= 1;
          this.lastFinishedAt = Date.now();
          this.drain();
        });
      }
    } finally {
      this.draining = false;
    }
  }

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token =
        localStorage.getItem('resizora_auth_token') ||
        localStorage.getItem('resizer_user_auth_token');
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /** Upload one job, retrying transient failures with exponential backoff. */
  private async run(job: UploadJob) {
    const startedAt = Date.now();
    const elapsed = () => Date.now() - startedAt;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        // Raw bytes are passed straight through — no base64 round-trip needed.
        const blob = job.blob ?? (await (await fetch(job.dataUrl)).blob());
        const form = new FormData();
        form.append('image', blob, job.filename);
        form.append('caption', `Optimised with Resizer AI — ${job.filename}`);
        // Lets the backend log whether this came from a URL import or a file.
        form.append('source', job.source || 'system-file');

        const res = await fetch(`${BACKEND_URL}/api/storage/upload`, {
          method: 'POST',
          headers: this.authHeaders(),
          body: form,
        });

        // 5xx / 429 / 408 are transient and worth retrying; other 4xx are not.
        const retryable = res.status >= 500 || res.status === 429 || res.status === 408;
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          imageUrl?: string;
          displayUrl?: string;
          hosting?: { id?: string; deleteUrl?: string | null; expiration?: number };
        };

        if (!res.ok || !data.success) {
          const message = data.error || `Upload failed (HTTP ${res.status})`;
          if (retryable && attempt < MAX_ATTEMPTS) {
            await this.wait(BACKOFF_MS[attempt - 1] ?? 9000);
            continue;
          }
          this.update(job.id, { status: 'error', attempts: attempt, error: message, durationMs: elapsed() });
          return;
        }

        this.update(job.id, {
          status: 'done',
          attempts: attempt,
          url: data.imageUrl || data.displayUrl,
          error: undefined,
          durationMs: elapsed(),
          deleteUrl: typeof data.hosting?.deleteUrl === 'string' ? data.hosting.deleteUrl : undefined,
        });
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network error while uploading';
        if (attempt < MAX_ATTEMPTS) {
          await this.wait(BACKOFF_MS[attempt - 1] ?? 9000);
          continue;
        }
        this.update(job.id, {
          status: 'error',
          attempts: attempt,
          error: message,
          durationMs: elapsed(),
        });
      }
    }
  }

  private wait(ms: number) {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, ms);
      if (typeof (timer as unknown as { unref?: () => void }).unref === 'function') {
        (timer as unknown as { unref: () => void }).unref();
      }
    });
  }
}

/** Shared singleton — one queue per browser tab. */
export const uploadQueue = new UploadQueue();